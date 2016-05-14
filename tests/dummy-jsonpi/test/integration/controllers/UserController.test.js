var request = require('supertest');

describe('UserController', function() {

  describe('GET /users', function() {
    it('Should return empty array', function (done) {
      request(sails.hooks.http.app)
        .post('/users')
        .expect(404)
        .expect({
        })
        .end(done)
    });
  });

});
