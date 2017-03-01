import _ from 'lodash'
import Promise from 'bluebird'
import DBM from 'yf-fpm-dbm'

export default {
  bind: (fpm) => {
    fpm.registerAction('INIT', () => {
      console.log('mysql-plugin start')
      const c = fpm.getConfig()
      let mysqlOptions = _.assign({
        "host": "localhost",
        "database": "fpm",
        "username": "dbadmin",
        "password": "741235896",
        "showSql": true
      }, c.mysql || {})
      let M = Promise.promisifyAll(DBM(mysqlOptions))
      fpm.M = M
    })
  }
}
