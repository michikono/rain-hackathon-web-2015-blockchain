/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /things              ->  index
 * POST    /things              ->  create
 * GET     /things/:id          ->  show
 * PUT     /things/:id          ->  update
 * DELETE  /things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');

// Get list of things
exports.index = function(req, res) {
  res.json([
  {
  name : 'Book Title',
  imageUrl : '/api/image',
  textUrl : '/api/text'
  }, {
  name : 'Book Title',
  imageUrl : '/api/image',
  textUrl : '/api/text'
  }, {
  name : 'Book Title',
  imageUrl : '/api/image',
  textUrl : '/api/text'
  },  {
  name : 'Book Title',
  imageUrl : '/api/image',
  textUrl : '/api/text'
  }
  ]);
};