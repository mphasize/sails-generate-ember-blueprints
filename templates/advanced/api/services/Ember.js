/**
 * Ember service
 *
 * @module Ember
 */

var _ = require( 'lodash' ),
	pluralize = require( 'pluralize' );

var Ember = {
	linkAssociations: function ( model, records ) {
		if ( !Array.isArray( records ) ) records = [ records ];
		var modelPlural = pluralize( model.identity );

		return _.map( records, function ( record ) {
			var links = {};
			_.each( model.associations, function ( assoc ) {
				if ( assoc.type === "collection" ) {
					links[ assoc.alias ] = sails.config.blueprints.prefix + "/" + modelPlural + "/" + record.id + "/" + assoc.alias;
				}
				if ( assoc.type === 'model') {
					links[ assoc.alias ] = sails.config.blueprints.prefix + "/" + modelPlural + "/" + record.id + "/" + assoc.alias;
					delete record[ assoc.alias ];
				}
			} );
			if ( _.size( links ) > 0 ) {
				record.links = links;
			}
			return record;
		} );
	},

	/**
	 * Prepare records and populated associations to be consumed by Ember's DS.RESTAdapter
	 *
	 * @param {Collection} model Waterline collection object (returned from parseModel)
	 * @param {Array|Object} records A record or an array of records returned from a Waterline query
	 * @param {Associations} associations Definition of the associations, from `req.option.associations`
	 * @param {Boolean} sideload Sideload embedded records or reduce them to primary keys?
	 * @return {Object} The returned structure can be consumed by DS.RESTAdapter when passed to res.json()
	 */
	buildResponse: function ( model, records, associations, sideload, associatedRecords ) {
		sideload = sideload || false;
		var plural = Array.isArray( records ) ? true : false;

		var emberModelIdentity = _.camelCase( model.globalId );
		var modelPlural = pluralize( emberModelIdentity );
		var documentIdentifier = modelPlural; //plural ? modelPlural : emberModelIdentity;
		var json = {};

		json[ documentIdentifier ] = [];

		if ( sideload ) {
			// prepare for sideloading
			_.each( associations, function ( assoc ) {
				// only sideload, when the full records are to be included, more info on setup here https://github.com/Incom/incom-api/wiki/Models:-Defining-associations
				if ( assoc.include === "record" ) {
					var assocName = assoc.type === "collection" ? pluralize( assoc.collection ) : pluralize( assoc.model );
					// initialize jsoning object
					if ( !json.hasOwnProperty( assoc.alias ) ) {
						json[ assocName ] = [];
					}
				}
			} );
		}

		var prepareOneRecord = function ( record ) {
			// get rid of the record's prototype ( otherwise the .toJSON called in res.send would re-insert embedded records)
			record = _.create( {}, record.toJSON() );
			var links = {};

			_.each( associations, function ( assoc ) {
				var assocName = assoc.type === "collection" ? pluralize( assoc.collection ) : pluralize( assoc.model );
				var assocModel;
				if ( assoc.type === "collection" ) {
					assocModel = sails.models[ assoc.collection ];
					if ( sideload && assoc.include === "record" && record[ assoc.alias ] && record[ assoc.alias ].length > 0 ) {
						// sideload association records with links for 3rd level associations
						json[ assocName ] = json[ assocName ].concat( Ember.linkAssociations( assocModel, record[ assoc.alias ] ) );
						// reduce association on primary record to an array of IDs
						record[ assoc.alias ] = _.reduce( record[ assoc.alias ], function ( filtered, rec ) {
							filtered.push( rec.id );
							return filtered;
						}, [] );
					}
					if ( assoc.include === "index" && associatedRecords[ assoc.alias ] ) record[ assoc.alias ] = _.reduce( associatedRecords[ assoc.alias ], function ( filtered, rec ) {
						if ( rec[ emberModelIdentity ] === record.id ) filtered.push( rec.id );
						return filtered;
					}, [] );
					// @todo if assoc.include startsWith index: ... fill contents from selected column of join table
					if ( assoc.include === "link" ) {
						links[ assoc.alias ] = sails.config.blueprints.prefix + "/" + modelPlural.toLowerCase() + "/" + record.id + "/" + assoc.alias;
						delete record[ assoc.alias ];
					}
					//record[ assoc.alias ] = _.pluck( record[ assoc.alias ], 'id' );
				}
				if ( assoc.type === "model" && record[ assoc.alias ] ) {
					if ( sideload && assoc.include === "record" ) {
						assocModel = sails.models[ assoc.model ];
						var linkedRecords = Ember.linkAssociations( assocModel, record[ assoc.alias ] );
						json[ assocName ] = json[ assocName ].concat( record[ assoc.alias ] );
						record[ assoc.alias ] = linkedRecords[ 0 ].id; // reduce embedded record to id
					}
					/* if ( assoc.include === "link" ) { // while it's possible, we should not really do this
						links[ assoc.alias ] = sails.config.blueprints.prefix + "/" + modelPlural.toLowerCase() + "/" + record.id + "/" + assoc.alias;
						delete record[ assoc.alias ];
					} */
					// if "index" we're already done...
				}
			} );
			if ( _.size( links ) > 0 ) {
				record.links = links;
			}
			return record;
		};

		// many or just one?
		if ( plural ) {
			_.each( records, function ( record ) {
				json[ documentIdentifier ] = json[ documentIdentifier ].concat( prepareOneRecord( record ) );
			} );
		} else {
			json[ documentIdentifier ] = [ prepareOneRecord( records ) ];
		}

		if ( sideload ) {
			// filter duplicates in sideloaded records
			// @todo: prune empty association arrays
			_.each( json, function ( array, key ) {
				if ( key === documentIdentifier ) return;
				if ( json[ key ].length === 0 ) {
					delete json[ key ];
					return;
				}
				json[ key ] = _.uniq( array, function ( record ) {
					return record.id;
				} );
			} );

			// add *links* for relationships to sideloaded records
			_.each( json, function ( array, key ) {
				if ( key === documentIdentifier ) return;
				if ( array.length > 0 ) {
					if ( !_.isNumber( array[ 0 ] ) && !_.isString( array[ 0 ] ) ) { // this is probably an array of records
						var model = sails.models[ pluralize( key, 1 ) ];
						console.log( "Sideloaded records model: ", model.identity );
						Ember.linkAssociations( model, array );
					}
				}
			} );
		}

		return json;
	}
};

module.exports = Ember;
