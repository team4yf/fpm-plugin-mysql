const _ = require('lodash');
const Promise = require('bluebird');
const DBM = require('yf-fpm-dbm');
const fs = require('fs');
const path = require('path');
const eachSeries = require('async/eachSeries');
const crypto = require('crypto');
const assert = require('assert');
const debug = require('debug')('fpm-plugin-mysql');

const readdir = Promise.promisify(fs.readdir)
const readFile = Promise.promisify(fs.readFile)

const concatSqls = sqlStr => {
  let sqlArr = [];
  let sql = sqlStr.split(';');
  sqlArr = _.concat(sqlArr, sql);
  sqlArr = _.map(sqlArr, _.trim);
  _.remove(sqlArr, (n) => { return n == '' || n == '\n' })
  return sqlArr;
}

const readFileMd5 = (url) =>{
  return new Promise((reslove) => {
    let md5sum = crypto.createHash('md5');
    let stream = fs.createReadStream(url);
    stream.on('data', function(chunk) {
      md5sum.update(chunk);
    });
    stream.on('end', function() {
      let fileMd5 = md5sum.digest('hex');
      reslove(fileMd5);
    })
  })
}

module.exports = {
  bind: (fpm) => {
    const c = fpm.getConfig('mysql')
    const mysqlOptions = _.assign({
      "host": "localhost",
      "port": "3306",
      "database": "fpm",
      "username": "root",
      "password": "root",
      "migrate": "_migrate",
      "showSql": true,
      "logger": fpm.logger
    }, c || {})
    // debug('The mysql connection options: %O', mysqlOptions);
    const M = Promise.promisifyAll(DBM(mysqlOptions));
    
    // the falg of install function, the install function will not execute if it's false likely
    let enableInstall = parseInt(fpm.getEnv('ENABLE_INSTALL_SQL', 1));
    enableInstall = isNaN(enableInstall) ? 1: enableInstall;
    debug('The mysql enable install flag: %o', enableInstall);

    M.executeFiles = async files => {
      files.sort( (x1, x2) => x2.name - x1.name);
      let sqlArr = []
      const len = files.length
      for(let i = 0; i< len; i++){
        let file = files[i]
        let sql = await readFile(file.path)
        sql = sql.toString()
        const sqls = concatSqls(sql);
        sqlArr = _.concat(sqlArr, sqls)
      }
      
      return new Promise((rs, rj) => {
        M.transationAsync()
          .then((atom) => {
            eachSeries(sqlArr, (sql, callback) =>{
              atom.command({sql}, callback)
            }, 
            (e) => {
              if(e){
                atom.rollback()
                rj(e)
              }else{
                atom.commit(() => {
                  rs(files)
                })
              }
            })
          })
          .catch(e => {
            rj(e)
          })
        })

    } 

    const getLockInfo = async () => {
      const migrateTable = `CREATE TABLE IF NOT EXISTS ${mysqlOptions.migrate} (
  id bigint(20) NOT NULL AUTO_INCREMENT,
  createAt bigint(20) NOT NULL DEFAULT '0',
  updateAt bigint(20) NOT NULL DEFAULT '0',
  delflag tinyint(4) NOT NULL DEFAULT '0',
  name varchar(200) NOT NULL,
  hash varchar(200) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;`;
      await M.commandAsync({ sql: migrateTable });
      const list = await M.findAsync({ table: mysqlOptions.migrate });
      return _.keyBy(list, 'name');
    }

    // WARNING: this may be the bug. stream.write() is not a sync function.
    const saveLockInfo = async info => {
      const rows = _.map(info, x => {
        return { name: x.file, hash: x.hash, createAt: x.executeAt, updateAt: x.executeAt };
      });
      if (_.isEmpty(rows)) {
        return;
      }
      const result = await M.createAsync({
        table: mysqlOptions.migrate,
        row: rows,
      });
      return result;
    }

    const compareHash = (info, file, hash) => {
      if(!_.has(info, file)){
        return false;
      }
      return info[file].hash == hash;
    }

    M.init = M.install = async filepath => {
      try {
        assert(!!enableInstall, `The evn ENABLE_INSTALL_SQL might be 1, otherwise we cant run the sql scripts.`)
        // check file/dir exists
        assert.ok(fs.existsSync(filepath), `The File or Directory: ${ filepath } Not Exists`)
        const stats = fs.statSync(filepath);
        let todoExecutedSqlFiles = [];
        // get lock info
        const lockInfo = await getLockInfo();
        debug("LockInfo before: %O", lockInfo);
        if(stats.isFile()){
          const hash = await readFileMd5(filepath);
          const fileName = filepath.split('/').pop();
          if(compareHash(lockInfo, fileName, hash)){
            // nothing to do
            return 0;
          }
          todoExecutedSqlFiles.push({ file: fileName, path: filepath, hash });
        }else{
          // get files
          const sqlFiles = await readdir(filepath)
          _.remove(sqlFiles, (f) => {
            return !_.endsWith(f, '.sql')
          })
          const sqlFilesLength = sqlFiles.length;
          const sqlFilesHash = [];
          
          for(let i = 0; i< sqlFilesLength; i++){
            const file = sqlFiles[i];
            const realpath = path.join(filepath, file);
            const hash = await readFileMd5(realpath);
            sqlFilesHash.push({ file, hash, path: realpath });
          }

          todoExecutedSqlFiles = _.concat(todoExecutedSqlFiles, _.filter(sqlFilesHash, sql => {
            return !compareHash(lockInfo, sql.file, sql.hash);
          }));          
        }
        debug('todo sql: %O', todoExecutedSqlFiles);
        const result = await M.executeFiles(todoExecutedSqlFiles);
        const NOW = _.now();
        _.map(result, item => {
          lockInfo[item.file] = _.assign(item, { executeAt: NOW})
        })
        return await saveLockInfo(todoExecutedSqlFiles);
      } catch (error) {
        debug('Install error: %O', error)
        return Promise.reject(error);
      }

      //
    }

    fpm.M = M
    
    const functions = {}
    _.map(['find', 'first', 'create', 'update', 'remove', 'clear', 'get', 'count', 'findAndCount'], (fnName) => {
        functions[fnName] = async (args) =>{
          return await M[fnName + 'Async'](args)
        } 
    })
    fpm.registerAction('BEFORE_SERVER_START', () => {
      
      fpm.extendModule('common', functions)
    })

    return M
  }
}
