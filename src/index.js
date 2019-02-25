import _ from 'lodash'
import Promise from 'bluebird'
import DBM from 'yf-fpm-dbm'
import fs from 'fs'
import path from 'path'
import eachSeries from 'async/eachSeries'

const readdir = Promise.promisify(fs.readdir)
const readFile = Promise.promisify(fs.readFile)

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


    const concatSqls = sqlStr => {
      let sqlArr = [];
      let sql = sqlStr.split(';');
      sqlArr = _.concat(sqlArr, sql);
      sqlArr = _.map(sqlArr, _.trim);
      _.remove(sqlArr, (n) => { return n == '' || n == '\n' })
      return sqlArr;
    }

    M.runFile = async filepath => {
      if(!fs.existsSync(filepath)){
        return Promise.reject(new Error(`SQL File: ${ filepath } Not Exists`));
      }
      if(!_.endsWith(filepath, '.sql')){
        return Promise.reject(new Error(`The File: ${ filepath } Should Be .sql`));
      }

      let sql = await readFile(filepath);
      sql = sql.toString();
      const sqlArr = concatSqls(sql);
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
                  rs(1)
                })
              }
            })
          })
          .catch(e => {
            rj(e)
          })
        })

    }

    M.runDir = async dir => {
      if(!fs.existsSync(dir)){
        return Promise.reject(new Error(`SQL File Directory: ${ dir } Not Exists`));
      }
      let files = await readdir(dir)
      _.remove(files, (f) => {
        return !_.endsWith(f, '.sql')
      })

      let sqlArr = []
      const len = files.length
      for(let i = 0; i< len; i++){
        let file = files[i]
        let sql = await readFile(path.join(dir, file))
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
                  rs(1)
                })
              }
            })
          })
          .catch(e => {
            rj(e)
          })
        })

    } 

    M.init = async (dir) =>{
      // if db.lock exists reject
      // Read Sql Scripts Content
      const lockfilePath = path.join(fpm.get('CWD'), 'db.lock')
      if(fs.existsSync(lockfilePath)){
        return Promise.reject(new Error('db.lock exists, it seems like your db is installed! If you wanna execute the scripts, Delete The db.lock File In your Project'));
      }
      try {
        await M.runDir(dir);
        console.log('All Scripts Done!');
        fs.createWriteStream(lockfilePath);
        return 1;
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
