var should = require("chai").should();
var YF = require("yf-fpm-client-js").default;
YF.init({ appkey:'123123', masterKey:'123123', domain: 'http://localhost:9999' });


describe('DB', function(){

  it('Find A', function(done){
    var query = new YF.Query('area');
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
