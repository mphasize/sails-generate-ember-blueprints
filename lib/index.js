/**
 * sails-generate-auth
 *
 * Usage:
 * `sails generate auth`
 *
 * @type {Object}
 */

var fs = require( 'fs-extra' );
var templateDir = require( 'path' ).resolve( __dirname, '../templates' );

module.exports = {

  templatesDirectory: templateDir,

  before: require( './before' ),

  targets: {
    './': {
      exec: function( scope, cb ) {
        templateDir = templateDir + '/' + scope.flavor;
        console.log( 'Running generator (sails-generate-ember-blueprints) @ `' + scope.rootPath + '`...' );

        if ( fs.existsSync( scope.rootPath + '/api/blueprints' ) && fs.existsSync( scope.rootPath + '/api/services/Ember.js' ) && !scope.force ) {
          console.log( scope );
          return cb( new Error( "Looks like the blueprints are already installed. Just in case you made some changes to them, we're stopping here. If you want to override the existing files and do a fresh install use the '--force' option." ) );
        }

        console.log( 'Installing "' + scope.flavor + '" of blueprints.' );

        fs.copySync( templateDir + '/api/blueprints', scope.rootPath + '/api/blueprints' );
        fs.copySync( templateDir + '/api/services/Ember.js', scope.rootPath + '/api/services/Ember.js' );

        cb();
      }
    },
  }
};