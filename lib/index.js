/**
 * sails-generate-auth
 *
 * Usage:
 * `sails generate auth`
 *
 * @type {Object}
 */

var templateDir = require( 'path' ).resolve( __dirname, '../templates' );

module.exports = {

  templatesDirectory: templateDir,

  before: require( './before' ),

  targets: {
    './': {
      exec: function ( scope, cb ) {
        console.log( 'Running generator (sails-generate-ember-blueprints) @ `' + scope.rootPath + '`...' );
        cb();
      }
    },

    // Blueprints and Util folder
    './api/blueprints/_util': {
      folder: {}
    },

    // Action Util
    './api/blueprints/_util/actionUtil.js': {
      copy: templateDir + '/api/blueprints/_util/actionUtil.js'
    },

    // Blueprints
    './api/blueprints/findone.js': {
      copy: templateDir + '/api/blueprints/findone.js'
    },
    './api/blueprints/find.js': {
      copy: templateDir + '/api/blueprints/find.js'
    },
    './api/blueprints/create.js': {
      copy: templateDir + '/api/blueprints/create.js'
    },
    './api/blueprints/update.js': {
      copy: templateDir + '/api/blueprints/update.js'
    },
    './api/blueprints/populate.js': {
      copy: templateDir + '/api/blueprints/populate.js'
    },
    './api/blueprints/destroy.js': {
      copy: templateDir + '/api/blueprints/destroy.js'
    },

    // Ember Service
    './api/services/Ember.js': {
      copy: templateDir + '/api/services/Ember.js'
    }
  }
};
