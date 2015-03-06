/**
 * Module dependencies
 */
var actionUtil = require( './_util/actionUtil' );

/**
 * Find Records
 *
 *  get   /:modelIdentity
 *   *    /:modelIdentity/find
 *
 * An API call to find and return model instances from the data adapter
 * using the specified criteria.  If an id was specified, just the instance
 * with that unique id will be returned.
 *
 * Optional:
 * @param {Object} where       - the find criteria (passed directly to the ORM)
 * @param {Integer} limit      - the maximum number of records to send back (useful for pagination)
 * @param {Integer} skip       - the number of records to skip (useful for pagination)
 * @param {String} sort        - the order of returned records, e.g. `name ASC` or `age DESC`
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findRecords( req, res ) {

	// Look up the model
	var Model = actionUtil.parseModel( req );

	// parse criteria from request
	var criteria = actionUtil.parseCriteria( req );
	var limit = actionUtil.parseLimit( req );

	// Look up the association configuration and determine how to populate the query
	// @todo support request driven selection of includes/populate
	var associations = actionUtil.getAssociationConfiguration( Model, "list" );

	async.parallel( {
			count: function ( done ) {
				Model.count( criteria ).exec( done );
			},
			records: function ( done ) {
				// Lookup for records that match the specified criteria
				var query = Model.find()
					.where( criteria )
					.skip( actionUtil.parseSkip( req ) )
					.sort( actionUtil.parseSort( req ) );

				if ( limit ) query.limit( limit );

				// populate associations according to our model specific configuration...
				query = actionUtil.populateRecords( query, associations );
				query.exec( done );
			}
		},
		function ( err, results ) {
			if ( err ) return res.serverError( err );

			var matchingRecords = results.records;
			var ids = _.pluck( matchingRecords, 'id' );

			actionUtil.populateIndexes( Model, ids, associations, function ( err, associated ) {

				if ( err ) return res.serverError( err );

				// Only `.watch()` for new instances of the model if
				// `autoWatch` is enabled.
				if ( req._sails.hooks.pubsub && req.isSocket ) {
					Model.subscribe( req, matchingRecords );
					if ( req.options.autoWatch ) {
						Model.watch( req );
					}
					// Also subscribe to instances of all associated models
					// @todo this might need an update to include associations included by index only
					_.each( matchingRecords, function ( record ) {
						actionUtil.subscribeDeep( req, record );
					} );
				}

				var emberizedJSON = Ember.buildResponse( Model, results.records, associations, true, associated );

				emberizedJSON.meta = {
					total: results.count
				};
				res.ok( emberizedJSON );

			} );
		} );

	/*async.reduce( associations, {}, function ( associatedRecords, association, next ) {
				if ( association.include === "index" ) {
					var assocModel = null;
					var assocCriteria = {};

					if ( association.through ) {
						assocModel = sails.models[ association.through ];
						assocCriteria[ Model.identity ] = ids;
						assocModel.find( assocCriteria ).exec( function ( err, recs ) {
							associatedRecords[ association.alias ] = recs;
							next( err, associatedRecords );
						} );
					} else if ( association.collection ) {
						assocModel = sails.models[ association.collection ];
						assocCriteria[ association.via ] = ids;
						assocModel.find( assocCriteria ).exec( function ( err, recs ) {
							associatedRecords[ association.alias ] = recs;
							next( err, associatedRecords );
						} );
					} else if ( association.model ) {
						// belongs-To associations should already have the index
						assocModel = sails.models[ association.model ];
						next( null, associatedRecords );
					}
					if ( assocModel === null ) return next( new Error( "Could not find associated model for: " + association.alias ) );
				} else {
					return next( err, associatedRecords );
				}
			}, function ( err, associated ) {


} );*/

};
