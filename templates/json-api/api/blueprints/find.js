/**
 * Module dependencies
 */
var util = require( 'util' ),
  actionUtil = require( './_util/actionUtil' );

/**
 * Find Records
 *
 *  get   /:modelIdentity
 *
 * An API call to find and return model instances from the data adapter
 * using the specified criteria.
 *
 */

module.exports = function findRecords(req, res) {

  // Look up the model
  var Model = actionUtil.parseModel(req);

  // Lookup for records that match the specified criteria
  var query = Model.find();

  query.exec((err, matchingRecords) => {

    if (err) return res.serverError(err);

    return res.ok({
      data: matchingRecords
    });
  });
};
