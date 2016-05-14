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

  describe('POST /users', function() {

    it('Should return created user', function (done) {

      var userToCreate = {
        'data': {
          'attributes': {
            'email': 'test@sanestack.com',
            'first-name':'Test',
            'last-name':'SaneStack'
          },
          'type':'users'
        }
      };

      userCreated = userToCreate;
      userCreated.data.id = 1;

      request(sails.hooks.http.app)
        .post('/users')
        .send(userToCreate)
        .expect(201)
        .expect(validateJSONapi)
        .expect(userCreated)
        .end(done)
    });
  });
});
