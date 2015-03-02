/**
 * Module dependencies
 */
var actionUtil = require( './_util/actionUtil' );

/**
 * Find One Record
 *
 * get /:modelIdentity/:id
 *
 * An API call to find and return a single model instance from the data adapter
 * using the specified id.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to look up *
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */

module.exports = function findOneRecord( req, res ) {

	var Model = actionUtil.parseModel( req );
	var pk = actionUtil.requirePk( req );

	var query = Model.findOne( pk );

	// Look up the association configuration and determine how to populate the query
	// @todo support request driven selection of includes/populate
	var associations = actionUtil.getAssociationConfiguration( Model, "detail" );

	query = actionUtil.populateRecords( query, associations );
	query.exec( function found( err, matchingRecord ) {
		if ( err ) return res.serverError( err );
		if ( !matchingRecord ) return res.notFound( 'No record found with the specified `id`.' );

		actionUtil.populateIndexes( Model, matchingRecord.id, associations, function ( err, associated ) {

			if ( sails.hooks.pubsub && req.isSocket ) {
				Model.subscribe( req, matchingRecord );
				actionUtil.subscribeDeep( req, matchingRecord );
			}

			res.ok( Ember.buildResponse( Model, matchingRecord, associations, true, associated ) );

		} );

	} );

};
