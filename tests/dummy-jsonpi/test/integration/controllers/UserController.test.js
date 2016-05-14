var request = require('supertest');

describe('UserController', function() {

  describe('GET /users', function() {
    it('Should return empty array', function (done) {
      request(sails.hooks.http.app)
        .get('/users')
        .expect(200)
        .expect({
          data: []
        })
        .end(done)
    });
  });

});
