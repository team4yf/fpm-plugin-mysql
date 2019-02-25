import _ from 'lodash'
import Promise from 'bluebird'
import DBM from 'yf-fpm-dbm'
import fs, { readFileSync } from 'fs'
import path from 'path'
import eachSeries from 'async/eachSeries'
import crypto from 'crypto';
import assert from 'assert';

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

export default {
  bind: (fpm) => {
    const c = fpm.getConfig('mysql')
    let mysqlOptions = _.assign({
      "host": "localhost",
      "port": "3306",
      "database": "fpm",
      "username": "root",
      "password": "root",
      "showSql": true,
      "logger": fpm.logger
    }, c || {})
    let M = Promise.promisifyAll(DBM(mysqlOptions));

    const lockfilePath = path.join(fpm.get('CWD'), 'db.lock');

    M.executeFiles = async files => {
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

    const getLockInfo = () => {
      if(fs.existsSync(lockfilePath)){
        const content = readFileSync(lockfilePath);
        try {
          return JSON.parse(content.toString());
        } catch (error) {
          return {}
        }
      }
      return {};
    }

    const saveLockInfo = info => {
      const ws = fs.createWriteStream(lockfilePath);
      ws.write(JSON.stringify(info));
      ws.end();
    }

    const compareHash = (info, file, hash) => {
      if(!_.has(info, file)){
        return false;
      }
      return info[file].hash == hash;
    }

    M.install = async filepath => {
      try {
        // check file/dir exists
        assert.ok(fs.existsSync(filepath), `The File or Directory: ${ filepath } Not Exists`)
        const stats = fs.statSync(filepath);
        let todoExecutedSqlFiles = [];
        // get lock info
        const lockInfo = getLockInfo();
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

          _.remove(sqlFilesHash, sql => {
            return compareHash(lockInfo, sql.file, sql.hash);
          })
          todoExecutedSqlFiles = _.concat(todoExecutedSqlFiles, sqlFilesHash);          
        }
        const result = await M.executeFiles(todoExecutedSqlFiles);
        const NOW = _.now();
        _.map(result, item => {
          lockInfo[item.file] = _.assign(item, { executeAt: NOW})
        })
        saveLockInfo(lockInfo);
        return 1
      } catch (error) {
        return Promise.reject(error.toString());
      }

      //
    }

    M.init = async (dir) =>{
      try {
        return await M.install(dir);
      } catch (error) {
        return Promise.reject(error);
      }
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
