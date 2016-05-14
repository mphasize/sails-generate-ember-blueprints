var request = require('supertest');
var JSONAPIValidator = require('jsonapi-validator').Validator;

validateJSONapi = function(res) {
  var validator = new JSONAPIValidator();

  validator.validate(res.body);
}

describe('UserController', function() {

  describe('GET /users', function() {
    it('Should return empty array', function (done) {
      request(sails.hooks.http.app)
        .get('/users')
        .expect(200)
        .expect(validateJSONapi)
        .expect({
          data: []
        })
        .end(done)
    });
  });

});
