/**
 * Module dependencies
 */
var util = require( 'util' ),
    actionUtil = require( './_util/actionUtil' ),
    pluralize = require('pluralize');


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
 */

module.exports = function findOneRecord(req, res) {

  var Model = actionUtil.parseModel(req);
  var pk = actionUtil.requirePk(req);

  var query = Model.findOne(pk);
  query.exec((err, matchingRecord) => {
    if ( err ) return res.serverError( err );

    if ( !matchingRecord ) return res.notFound( 'No record found with the specified `id`.' );

    delete matchingRecord.id;
    return res.ok({
      data: {
        id: pk,
        type: pluralize(req.options.model || req.options.controller),
        attributes: matchingRecord
      }
    });
  });
};
