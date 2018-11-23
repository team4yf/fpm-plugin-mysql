## FPM-PLUGIN-MYSQL

## Basic Info
- Run Action Hook Name
  - `INIT` 
  - `BEFORE_SERVER_START`
- ExtendModule Name: `mysql`
- Exception
  - [x] `E.Nbiot.SEND_ERROR`
    ```javascript
    const E = {
        Nbiot: {
            SEND_ERROR: {
            errno: -10041, 
            code: 'SEND_ERROR', 
            message: 'An error occured when the mqtt server publish a message'
            }
        }
    }
    ```
- `getDependencies()`
  - [x] `[]`
- The Reference Of The `Bind()` Method
  An BizModule Object Contains The Functions
  - [ ] `send`

### Usage
```bash
$ npm i fpm-plugin-mysql --save
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