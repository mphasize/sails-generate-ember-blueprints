/**
 * Ember service
 *
 * @module Ember
 */

var forEach   = require('lodash/collection/forEach');
var map       = require('lodash/collection/map');
var size      = require('lodash/collection/size');
var pluralize = require( 'pluralize' );

module.exports = {
  linkAssociations: function ( model, records ) {
    if ( !Array.isArray( records ) ) records = [ records ];
    var modelPlural = pluralize( model.identity );

    return map( records, function ( record ) {
      var links = {};
      forEach( model.associations, function ( assoc ) {
        if ( assoc.type == "collection" ) {
          links[ assoc.alias ] = sails.config.blueprints.prefix + "/" + modelPlural + "/" + record.id + "/" + assoc.alias;
        }
      } );
      if ( size( links ) > 0 ) {
        record.links = links;
      }
      return record;
    } );
  }

};
