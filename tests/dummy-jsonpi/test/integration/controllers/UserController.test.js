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

  describe('Get newly created user GET /users', function() {
    it('Should return created user', function (done) {
      request(sails.hooks.http.app)
        .get('/users')
        .expect(200)
        .expect(validateJSONapi)
        .expect({
          'data': [{
            'id': 1,
            'type': 'users',
            'attributes': {
              'email': 'test@sanestack.com',
              'first-name':'Test',
              'last-name':'SaneStack'
            }
          }]
        })
        .end(done)
    });
  });

  describe('Add second userPOST /users', function() {

    it('Should return created user', function (done) {

      var userToCreate = {
        'data': {
          'attributes': {
            'email': 'test2@sanestack.com',
            'first-name':'Test2',
            'last-name':'SaneStack2'
          },
          'type':'users'
        }
      };

      userCreated = userToCreate;
      userCreated.data.id = 2;

      request(sails.hooks.http.app)
        .post('/users')
        .send(userToCreate)
        .expect(201)
        .expect(validateJSONapi)
        .expect(userCreated)
        .end(done)
    });
  });

  describe('Get two created users GET /users', function() {
    it('Should return created user', function (done) {
      request(sails.hooks.http.app)
        .get('/users')
        .expect(200)
        .expect(validateJSONapi)
        .expect({
          'data': [{
            'id': 1,
            'type': 'users',
            'attributes': {
              'email': 'test@sanestack.com',
              'first-name':'Test',
              'last-name':'SaneStack'
            }
          }, {
            'id': 2,
            'type': 'users',
            'attributes': {
              'email': 'test2@sanestack.com',
              'first-name':'Test2',
              'last-name':'SaneStack2'
            }
          }]
        })
        .end(done)
    });
  });
});
