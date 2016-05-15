/**
 * Module dependencies
 */
var util = require( 'util' ),
  actionUtil = require( './_util/actionUtil' );

/**
 * Destroy One Record
 *
 * delete  /:modelIdentity/:id
 *
 * Destroys the single model instance with the specified `id` from
 * the data adapter for the given model if it exists.
 *
 * Required:
 * @param {Integer|String} id  - the unique id of the particular instance you'd like to delete
 *
 */
module.exports = function destroyOneRecord(req, res) {

  var Model = actionUtil.parseModel(req);
  var pk = actionUtil.requirePk(req);

  var query = Model.findOne(pk);
  query.exec((err, record) => {

    if (err) return res.serverError(err);
    if (!record) return res.notFound('No record found with the specified `id`.');

    return Model.destroy(pk).exec((err) => {

      if (err) return res.negotiate(err);

      return res.json({'meta':{}});
    });
  });
};
