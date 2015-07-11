/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function (app) {

  // Insert routes below
  app.use('/api/things', require('./api/thing'));

  /**
   * GET      /api/assets/:assetId/issue/:bucketId
   *
   *    parameters:
   *          - assetId - asset to add *1* to
   *
   *    Sample response:
   *
   *    {
   *      "transaction_id": "d4aef079f3fe58bb40a61dc5cc4f7983d0db9e2dbaf2bd0deebd8a74b981bfcb",
   *      "raw_transaction": "0100000002ac18a7ab01c3079a..."
   *    }
   *
   *
   *
   * GET      /api/assets/:assetId
   *
   *    parameters:
   *          - assetId - asset to lookup
   *
   *    Sample response:
   *
   *    {
   *      "asset_id": "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
   *      "definition_mutable": true,
   *      "definition_base64": "ewogICJhc3NldF9pZHMiOiBbCiAgICAiQVhXanpCbWRGZ0I5WWFFandSZDh0dzVXWm9Ed2RpQXFuWiIKICBdLAogICJuYW1lIjogIk1pY2hpIGlzIGNvb2wiLAogICJzaG9ydC1uYW1lIjogIm1pY2hpIgp9",
   *      "definition_reference": {
   *        "asset_ids": ["AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ"],
   *        "name": "Michi is cool",
   *        "short-name": "michi"
   *      },
   *      "definition_hash": "52b41466a6d86de44aa218ad69c928c793456d7c"
   *     }
   */
  app.use('/api/assets', require('./api/assets'));

  /**
   * GET      /api/buckets/:bucketId/balances
   *
   * parameters:
   *          - bucketId - bucket you want to lookup to retrieve all assets inside it
   *
   * Sample response:
   *
   * [
   *   {
   *     "asset_type": "open_assets",
   *     "asset_id": "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
   *     "total": 100,
   *     "confirmed": 100
   *   }
   * ]
   *
   */
  app.use('/api/buckets', require('./api/buckets'));

  /**
   * POST     /api/transfers
   *
   * parameters:
   *          - assetId - asset ID being sent
   *          - inputBucketId - bucket asset currently lives in
   *          - outputBucketId - bucket asset should be sent to
   *
   * Sample response:
   *
   * {
   *   "transaction_id": "d4aef079f3fe58bb40a61dc5cc4f7983d0db9e2dbaf2bd0deebd8a74b981bfcb",
   *   "raw_transaction": "0100000002ac18a7ab01c3079a..."
   * }
   */
  app.use('/api/transfers', require('./api/transfers'));

  app.use('/notify', require('./api/notify'));

  app.use('/api/text', require('./api/text'));

  app.use('/images', require('express').static('server/assets'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets|images)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
