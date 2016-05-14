/**
 * Module dependencies
 */
var util = require( 'util' ),
  actionUtil = require( './_util/actionUtil' ),
  pluralize = require('pluralize');

/**
 * Create Record
 *
 * post /:modelIdentity
 *
 * An API call to create and return a single model instance from the data adapter
 * using the specified criteria.
 *
 */
module.exports = function createRecord(req, res) {

  var Model = actionUtil.parseModel(req);
  var data = actionUtil.parseValues(req, Model);

  // Create new instance of model using data from params
  Model.create(data)
    .exec( (err, newInstance) => {

      var Q = Model.findOne(newInstance.id);
      Q.exec( (err, newRecord) => {

        var id = newRecord.id;
        delete newRecord.id;

        res.status(201);
        return res.json({
          data: {
            id: id.toString(),
            type: pluralize(req.options.model || req.options.controller),
            attributes: newRecord
          }
        });
      });
    });
};
