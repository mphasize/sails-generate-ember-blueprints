/**
 * Module dependencies
 */
var util = require( 'util' ),
	actionUtil = require( './_util/actionUtil' );

/**
 * Destroy One Record
 *
 * delete  /:modelIdentity/:id
 *    *    /:modelIdentity/destroy/:id
 *
 * Destroys the single model instance with the specified `id` from
 * the data adapter for the given model if it exists.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to delete
 *
 * Optional:
 * @param {String} callback - default jsonp callback param (i.e. the name of the js function returned)
 */
module.exports = function destroyOneRecord( req, res ) {

	var Model = actionUtil.parseModel( req );
	var pk = actionUtil.requirePk( req );

	var query = Model.findOne( pk );

	query = actionUtil.accessControl( Model, "beforeDestroy", {
		query: query,
		user: req.user
	} );

	// Look up the association configuration and determine how to populate the query
	// @todo support request driven selection of includes/populate
	var associations = actionUtil.getAssociationConfiguration( Model, "list" );


	query = actionUtil.populateEach( query, req );
	query.exec( function foundRecord( err, record ) {
		if ( err ) return res.serverError( err );
		if ( !record ) return res.notFound( 'No record found with the specified `id`.' );

		Model.destroy( pk ).exec( function destroyedRecord( err ) {
			if ( err ) return res.negotiate( err );

			if ( sails.hooks.pubsub ) {
				Model.publishDestroy( pk, !sails.config.blueprints.mirror && req, {
					previous: record
				} );
				if ( req.isSocket ) {
					Model.unsubscribe( req, record );
					Model.retire( record );
				}
			}

			// @todo --- if neccessary, destroy related records

			return res.ok( null ); // Ember Data REST Adapter expects NULL after DELETE
		} );
	} );
};