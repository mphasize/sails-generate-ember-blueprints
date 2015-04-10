/**
 * sails-generate-auth
 *
 * Usage:
 * `sails generate auth`
 *
 * @type {Object}
 */

var fs = require('fs');
var templateDir = require( 'path' ).resolve( __dirname, '../templates' );

module.exports = {

  templatesDirectory: templateDir,

  before: require( './before' ),

  targets: {
    './': {
      exec: function ( scope, cb ) {
        // get the "flavor" of bluepritns
        templateDir = templateDir + '/' + scope.flavor;
        console.log( 'Running generator (sails-generate-ember-blueprints) @ `' + scope.rootPath + '`...' );

        // check for previous installation
        if ( fs.existsSync( scope.rootPath + '/api/blueprints' ) && fs.existsSync( scope.rootPath + '/api/services/Ember.js' ) && !scope.force ) {
          console.log( scope );
          return cb( new Error( 'Looks like the blueprints are already installed. Just in case you made some changes to them, we\'re stopping here. If you want to override the existing files and do a fresh install use the \'--force\' option.' ) );
        }

        // copy blueprint and service files
        console.log( 'Installing "' + scope.flavor + '" of blueprints.' );

        // create blueprints directory if it does not exist
        if ( !fs.existsSync( scope.rootPath + '/api/blueprints' ) ) {
          fs.mkdirSync( scope.rootPath + '/api/blueprints' );
        }

        ['create', 'destroy', 'find', 'findone', 'populate', 'update'].forEach(function (blueprint) {
          fs.writeFileSync(scope.rootPath + '/api/blueprints/' + blueprint + '.js', 'module.exports = require(\'sails-generate-ember-blueprints/templates/' + scope.flavor + '/api/blueprints/' + blueprint + '.js\');\n');
        });

        fs.writeFileSync(scope.rootPath + '/api/services/Ember.js', 'module.exports = require(\'sails-generate-ember-blueprints/templates/' + scope.flavor + '/api/services/Ember.js\');\n');

        // @todo: check configuration options? Would be great if we could peek into the Sails project configuration and notify the developer about necessary changes

        cb();
      }
    }
  }
};
