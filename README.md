## FPM-PLUGIN-MYSQL

### Usage
```bash
$ yarn add fpm-plugin-mysql
```

### Config In config.json
```javascript
"mysql":
  {
    "host": "localhost",
    "database": "db",
    "username": "root",
    "password": "root",
    "showSql": true
  }
```

### Code
```javascript
fpm.M.findAsync()......
```