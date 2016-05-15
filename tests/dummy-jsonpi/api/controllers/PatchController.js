/**
 * PatchController
 *
 * @description :: Server-side logic for managing patches
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

"use strict";

var pluralize   = require('pluralize');
var updateBlueprint = require('../blueprints/update');

module.exports = {

  routeToUpdate: function(req, res) {

    let id = req.param('id');
    let model = pluralize.singular(req.param('model'));

    req.options.controller = model;
    req.options.model = model;
    return updateBlueprint(req, res);
  }
};
