/**
 * Module dependencies
 */

var actionUtil  = require( './_util/actionUtil' );
var util        = require( 'util' );
var pluralize   = require('pluralize');

/**
 * Update One Record
 *
 * An API call to update a model instance with the specified `id`,
 * treating the other unbound parameters as attributes.
 *
 * @param {Integer|String} id  - the unique id of the particular record you'd like to update  (Note: this param should be specified even if primary key is not `id`!!)
 * @param *                    - values to set on the record
 *
 */
module.exports = function updateOneRecord(req, res) {

  // Look up the model
  var Model = actionUtil.parseModel(req);

  // Locate and validate the required `id` parameter.
  var pk = actionUtil.requirePk(req);

  // Create `values` object (monolithic combination of all parameters)
  // But omit the blacklisted params (like JSONP callback param, etc.)
  var values = actionUtil.parseValues(req, Model);

  // Find and update the targeted record.
  Model.update( pk, values ).exec((err, records) => {

    // Differentiate between waterline-originated validation errors
    // and serious underlying issues. Respond with badRequest if a
    // validation error is encountered, w/ validation info.
    if (err) return res.negotiate(err);

    // Because this should only update a single record and update
    // returns an array, just use the first item.  If more than one
    // record was returned, something is amiss.
    if ( !records || !records.length || records.length > 1 ) {
      req._sails.log.warn(
        util.format( 'Unexpected output from `%s.update`.', Model.globalId )
      );
    }

    var updatedRecord = records[0];

    if (updatedRecord === undefined) {
      return res.notFound();
    }

    delete updatedRecord.id;
    res.status(200);
    return res.ok({
      data: {
        id: pk.toString(),
        type: pluralize(req.options.model || req.options.controller),
        attributes: updatedRecord
      }
    });
  });
};
