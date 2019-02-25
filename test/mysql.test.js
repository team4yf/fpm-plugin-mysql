const { init, Func, DBQuery } = require("fpmc-jssdk");
const assert = require('assert');
init({ appkey:'123123', masterKey:'123123', endpoint: 'http://localhost:9999/api' });


describe('DB', function(){

  it('Find A', function(done){
    var query = new DBQuery('area');
    query.page(1,10);
    query.findAndCount()
      .then(function(data){
        console.log(data)
        done();
      }).catch(function(err){
        done(err);
      })
  })
})
