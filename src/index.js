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
    fpm.registerAction('INIT', () => {
      const c = fpm.getConfig()
      let mysqlOptions = _.assign({
        "host": "localhost",
        "database": "dbadmin",
        "username": "dbadmin",
        "password": "741235896",
        "showSql": true
      }, c.mysql || {})
      let M = Promise.promisifyAll(DBM(mysqlOptions))

      M.init = async (dir) =>{
        // if db.lock exists reject
        // Read Sql Scripts Content
        const lockfilePath = path.join(fpm.get('CWD'), 'db.lock')
        if(fs.existsSync(lockfilePath)){
          return new Promise((rs, rj) => {
            rj('db.lock exists, it seems like your db is installed! If you wanna execute the scripts, Delete The db.lock File In your Project')
          }) 
        }
        let files = await readdir(dir)
        _.remove(files, (f) => {
          return !_.endsWith(f, '.sql')
        })
        console.log('Scripts: ', files)
        let sqlArr = []
        const len = files.length
        for(let i = 0; i< len; i++){
          let file = files[i]
          let sql = await readFile(path.join(dir, file))
          sql = sql.toString()
          
          sql = sql.split(';')
          sqlArr = _.concat(sqlArr, sql)
        }
        _.remove(sqlArr, (n) => { return n == ''})

        return new Promise((rs, rj) => {
          M.transationAsync()
            .then((atom) => {
              eachSeries(sqlArr, (sql, callback) =>{
                atom.command({sql}, callback)
              }, 
              (e, results) => {
                if(e){
                  atom.rollback()
                  rj(e)
                }else{
                  atom.commit(() => {
                    console.log('All Scripts Done!')
                    fs.createWriteStream(lockfilePath)
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

      fpm.M = M
    })
  }
}
