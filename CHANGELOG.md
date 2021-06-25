## 1.3.1(2021-06-25)
Change:
- Add `_migrate_` table for lock the migration.

## 1.3.0(2019-03-28)
Change: 
- Remove `babel`
- Add `Debug`
- Add a env argument `ENABLE_INSTALL_SQL` , refuse the install function when it setted be `0`
Fixbugs:
- Run `install` many times, the `db.lock` rewrite by the last execution and drop the preview results.

## 1.2.0(2019-03-26)
Change:
- Remove `runFile` & `runDir`
- Add `install(path)` for install file/dir
  - compare the sqlfile md5 hash code, do not run the sqlfile if hash code is the same!

- `init` == `install`

## 1.1.5(2019-03-26)
Feature:

- Add `runFile(filepath)`
  
  For run single sql file

- Add `runDir(dir)`

  For run all sql files in the directory.

  
## 1.1.4(2018-11-26)
Fix Warning:

- `(node:28524) Warning: a promise was rejected with a non-error: [object Object]`

  The reason [http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-rejected-with-a-non-error](http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-rejected-with-a-non-error)

  So, we do the change to fix the warning:

  ```javascript
  // before
  Promise.reject('db.lock exists, it seems like your db is installed! If you wanna execute the scripts, Delete The db.lock File In your Project');

  // after, add new Error() to wrap the error stack
  Promise.reject(new Error('db.lock exists, it seems like your db is installed! If you wanna execute the scripts, Delete The db.lock File In your Project'));
  ```

## 1.1.1(2018-06-12)
Add `count` & `get` method for biz `common`

## 1.1.0(2018-06-08)
Add Docker-Compose file
Return M In `Bind()` Method
Add Some Test Script


## 1.0.8(2018-05-14)

Update yf-fast-dbm@2.0.7

## 1.0.7(2018-04-24)

Add npmignore `views/`

## 1.0.6(2018-04-23)

Feature
  Add `db.lock` after `init()` execute success!
    Do nothing if `db.lock` exists

## 1.0.4(2018-04-23)

Feature
  Add `Init` Api; Run `*.sql` Scripts In `sql` directions
  Add `dev.js` to Dev The Plugin
  
Deps
  Add `async@2.6.0`