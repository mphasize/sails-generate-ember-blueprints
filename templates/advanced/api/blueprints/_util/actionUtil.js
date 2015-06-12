/**
 * Module dependencies
 */

var _ = require( 'lodash' ),
	util = require( 'util' );

// Parameter used for jsonp callback is constant, as far as
// blueprints are concerned (for now.)
var JSONP_CALLBACK_PARAM = 'callback';

/**
 * Utility methods used in built-in blueprint actions.
 *
 * @type {Object}
 */
module.exports = {

	/**
	 * Extend the model's `associations` property with the presentation configuration (taken from the Model's attributes `includeIn` option or from Sails configuration)
	 * @param  {Waterline Collection}  Model
	 * @return {Array}                 Extended version of the Model.associations with `includeIn` defintions
	 */
	getAssociationConfiguration: function ( Model, style ) {
		// get configured defaults or always embed full records
		var presentationDefaults = sails.config.models.associations || {
			list: "record",
			detail: "record"
		};
		var associations = Model.associations;
		var attributes = Model._attributes;
		_.each( associations, function ( assoc ) {
			assoc.include = _.extend( {}, presentationDefaults, attributes[ assoc.alias ].includeIn )[ style ]; // extend association object with presentation configuration
			if ( attributes[ assoc.alias ].through ) {
				assoc.through = attributes[ assoc.alias ].through;
			}
		} );
		return associations;
	},

	/**
	 * helper function to populate a record with an array for indexes for associated models, running various Waterline queries on the join tables if neccessary ( defined as: include -> index )
	 * @param  {Waterine Collection}   parentModel  [description]
	 * @param  {Array|Integer}   ids          [description]
	 * @param  {[type]}   associations [description]
	 * @param  {Function} done         [description]
	 */
	populateIndexes: function ( parentModel, ids, associations, done ) {

		async.reduce( associations, {}, function ( associatedRecords, association, next ) {
			if ( association.include === "index" ) {
				var assocModel = null;
				var assocCriteria = {};

				if ( association.through ) {
					assocModel = sails.models[ association.through ];
					assocCriteria[ parentModel.identity ] = ids;
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
				return next( null, associatedRecords );
			}
		}, done );

	},

	/**
	 * helper function to populate a Waterline query according to the model definition include -> record
	 * @param  {[type]} query        [description]
	 * @param  {[type]} associations [description]
	 * @return {[type]}              [description]
	 */
	populateRecords: function ( query, associations ) {
		_.each( associations, function ( assoc ) {
			// if the associations is to be populated with the full records...
			if ( assoc.include === "record" ) query.populate( assoc.alias );
		} );
		return query;
	},

	/**
	 * Given a Waterline query, populate the appropriate/specified
	 * association attributes and return it so it can be chained
	 * further ( i.e. so you can .exec() it )
	 *
	 * @param	{Query} query				[waterline query object]
	 * @param	{Request} req
	 * @return {Query}
	 */
	populateEach: function ( query, req ) {
		var DEFAULT_POPULATE_LIMIT = sails.config.blueprints.defaultLimit || 30;
		var _options = req.options;
		var aliasFilter = req.param( 'populate' );
		var shouldPopulate = _options.populate;

		// Convert the string representation of the filter list to an Array. We
		// need this to provide flexibility in the request param. This way both
		// list string representations are supported:
		//	/model?populate=alias1,alias2,alias3
		//	/model?populate=[alias1,alias2,alias3]
		if ( typeof aliasFilter === 'string' ) {
			aliasFilter = aliasFilter.replace( /\[|\]/g, '' );
			aliasFilter = ( aliasFilter ) ? aliasFilter.split( ',' ) : [];
		}

		return _( _options.associations ).reduce( function populateEachAssociation( query, association ) {

			// If an alias filter was provided, override the blueprint config.
			if ( aliasFilter ) {
				shouldPopulate = _.contains( aliasFilter, association.alias );
			}

			// Only populate associations if a population filter has been supplied
			// with the request or if `populate` is set within the blueprint config.
			// Population filters will override any value stored in the config.
			//
			// Additionally, allow an object to be specified, where the key is the
			// name of the association attribute, and value is true/false
			// (true to populate, false to not)
			if ( shouldPopulate ) {
				var populationLimit =
					_options[ 'populate_' + association.alias + '_limit' ] ||
					_options.populate_limit ||
					_options.limit ||
					DEFAULT_POPULATE_LIMIT;

				return query.populate( association.alias, {
					limit: populationLimit
				} );
			} else return query;
		}, query );
	},

	/**
	 * Subscribe deep (associations)
	 *
	 * @param	{[type]} associations	[description]
	 * @param	{[type]} record			[description]
	 * @return {[type]}					[description]
	 */
	subscribeDeep: function ( req, record ) {
		_.each( req.options.associations, function ( assoc ) {

			// Look up identity of associated model
			var ident = assoc[ assoc.type ];
			var AssociatedModel = sails.models[ ident ];

			if ( req.options.autoWatch ) {
				AssociatedModel.watch( req );
			}

			// Subscribe to each associated model instance in a collection
			if ( assoc.type === 'collection' ) {
				_.each( record[ assoc.alias ], function ( associatedInstance ) {
					AssociatedModel.subscribe( req, associatedInstance );
				} );
			}
			// If there is an associated to-one model instance, subscribe to it
			else if ( assoc.type === 'model' && record[ assoc.alias ] ) {
				AssociatedModel.subscribe( req, record[ assoc.alias ] );
			}
		} );
	},

	/**
	 * Parse primary key value for use in a Waterline criteria
	 * (e.g. for `find`, `update`, or `destroy`)
	 *
	 * @param	{Request} req
	 * @return {Integer|String}
	 */
	parsePk: function ( req ) {

		var pk = req.options.id || ( req.options.where && req.options.where.id ) || req.param( 'id' );

		// TODO: make this smarter...
		// (e.g. look for actual primary key of model and look for it
		//	in the absence of `id`.)
		// See coercePK for reference (although be aware it is not currently in use)

		// exclude criteria on id field
		pk = _.isPlainObject( pk ) ? undefined : pk;
		return pk;
	},

	/**
	 * Parse primary key value from parameters.
	 * Throw an error if it cannot be retrieved.
	 *
	 * @param	{Request} req
	 * @return {Integer|String}
	 */
	requirePk: function ( req ) {
		var pk = module.exports.parsePk( req );

		// Validate the required `id` parameter
		if ( !pk ) {

			var err = new Error(
				'No `id` parameter provided.' +
				'(Note: even if the model\'s primary key is not named `id`- ' +
				'`id` should be used as the name of the parameter- it will be ' +
				'mapped to the proper primary key name)'
			);
			err.status = 400;
			throw err;
		}

		return pk;
	},

	/**
	 * Parse `criteria` for a Waterline `find` or `update` from all
	 * request parameters.
	 *
	 * @param	{Request} req
	 * @return {Object}						the WHERE criteria object
	 */
	parseCriteria: function ( req ) {

		// Allow customizable blacklist for params NOT to include as criteria.
		req.options.criteria = req.options.criteria || {};
		req.options.criteria.blacklist = req.options.criteria.blacklist || [ 'limit', 'skip', 'sort', 'populate' ];

		// Validate blacklist to provide a more helpful error msg.
		var blacklist = req.options.criteria && req.options.criteria.blacklist;
		if ( blacklist && !_.isArray( blacklist ) ) {
			throw new Error( 'Invalid `req.options.criteria.blacklist`. Should be an array of strings (parameter names.)' );
		}

		// Look for explicitly specified `where` parameter.
		var where = req.params.all().where;

		// If `where` parameter is a string, try to interpret it as JSON
		if ( _.isString( where ) ) {
			where = tryToParseJSON( where );
		}

		// If `where` has not been specified, but other unbound parameter variables
		// **ARE** specified, build the `where` option using them.
		if ( !where ) {

			// Prune params which aren't fit to be used as `where` criteria
			// to build a proper where query
			where = req.params.all();

			// Omit built-in runtime config (like query modifiers)
			where = _.omit( where, blacklist || [ 'limit', 'skip', 'sort' ] );

			// Omit any params w/ undefined values
			where = _.omit( where, function ( p ) {
				if ( _.isUndefined( p ) ) return true;
			} );

			// Transform ids[ .., ..] request
			if ( where.ids ) {
				where.id = where.ids;
				delete where.ids;
			}

			// Omit jsonp callback param (but only if jsonp is enabled)
			var jsonpOpts = req.options.jsonp && !req.isSocket;
			jsonpOpts = _.isObject( jsonpOpts ) ? jsonpOpts : {
				callback: JSONP_CALLBACK_PARAM
			};
			if ( jsonpOpts ) {
				where = _.omit( where, [ jsonpOpts.callback ] );
			}
		}

		// Merge w/ req.options.where and return
		where = _.merge( {}, req.options.where || {}, where ) || undefined;

		return where;
	},

	/**
	 * Parse `values` for a Waterline `create` or `update` from all
	 * request parameters.
	 *
	 * @param	{Request} req
	 * @return {Object}
	 */
	parseValues: function ( req, model ) {
		// Create data object (monolithic combination of all parameters)
		// Omit the blacklisted params (like JSONP callback param, etc.)

		// Allow customizable blacklist for params NOT to include as values.
		req.options.values = req.options.values || {};
		req.options.values.blacklist = req.options.values.blacklist;

		// Validate blacklist to provide a more helpful error msg.
		var blacklist = req.options.values.blacklist;
		if ( blacklist && !_.isArray( blacklist ) ) {
			throw new Error( 'Invalid `req.options.values.blacklist`. Should be an array of strings (parameter names.)' );
		}

		// Get values using the model identity as resource identifier
		var values = req.param( _.kebabCase( model.globalId ) ) || {};

		// Omit built-in runtime config (like query modifiers)
		values = _.omit( values, blacklist || [] );

		// Omit any params w/ undefined values
		values = _.omit( values, function ( p ) {
			if ( _.isUndefined( p ) ) return true;
		} );

		// Omit jsonp callback param (but only if jsonp is enabled)
		var jsonpOpts = req.options.jsonp && !req.isSocket;
		jsonpOpts = _.isObject( jsonpOpts ) ? jsonpOpts : {
			callback: JSONP_CALLBACK_PARAM
		};
		if ( jsonpOpts ) {
			values = _.omit( values, [ jsonpOpts.callback ] );
		}

		return values;
	},

	/**
	 * Determine the model class to use w/ this blueprint action.
	 * @param	{Request} req
	 * @return {WLCollection}
	 */
	parseModel: function ( req ) {

		// Ensure a model can be deduced from the request options.
		var model = req.options.model || req.options.controller;
		if ( !model ) throw new Error( util.format( 'No "model" specified in route options.' ) );

		var Model = req._sails.models[ model ];
		if ( !Model ) throw new Error( util.format( 'Invalid route option, "model".\nI don\'t know about any models named: `%s`', model ) );

		return Model;
	},

	/**
	 * @param	{Request} req
	 */
	parseSort: function ( req ) {
		return req.param( 'sort' ) || req.options.sort || undefined;
	},

	/**
	 * @param	{Request} req
	 */
	parseLimit: function ( req ) {
		var DEFAULT_LIMIT = sails.config.blueprints.defaultLimit || false;
		var limit = req.param( 'limit' ) || ( typeof req.options.limit !== 'undefined' ? req.options.limit : DEFAULT_LIMIT );
		if ( limit ) {
			limit = +limit;
		}
		return limit;
	},

	/**
	 * @param	{Request} req
	 */
	parseSkip: function ( req ) {
		var DEFAULT_SKIP = 0;
		var skip = req.param( 'skip' ) || ( typeof req.options.skip !== 'undefined' ? req.options.skip : DEFAULT_SKIP );
		if ( skip ) {
			skip = +skip;
		}
		return skip;
	}
};

// TODO:
//
// Replace the following helper with the version in sails.util:

// Attempt to parse JSON
// If the parse fails, return the error object
// If JSON is falsey, return null
// (this is so that it will be ignored if not specified)
function tryToParseJSON( json ) {
	if ( !_.isString( json ) ) return null;
	try {
		return JSON.parse( json );
	} catch ( e ) {
		return e;
	}
}
