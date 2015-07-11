/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function (app) {

  // Insert routes below
  app.use('/api/things', require('./api/thing'));

  /**
   * GET      /api/assets/:assetId
   *
   * parameters:
   *          - assetId - asset to lookup
   *
   * Sample response:
   *
   * {
   *   "asset_id": "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
   *   "definition_mutable": true,
   *   "definition_base64": "ewogICJhc3NldF9pZHMiOiBbCiAgICAiQVhXanpCbWRGZ0I5WWFFandSZDh0dzVXWm9Ed2RpQXFuWiIKICBdLAogICJuYW1lIjogIk1pY2hpIGlzIGNvb2wiLAogICJzaG9ydC1uYW1lIjogIm1pY2hpIgp9",
   *   "definition_reference": {
   *     "asset_ids": ["AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ"],
   *     "name": "Michi is cool",
   *     "short-name": "michi"
   *   },
   *   "definition_hash": "52b41466a6d86de44aa218ad69c928c793456d7c"
   *  }
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
   *   "raw_transaction": "0100000002ac18a7ab01c3079ab663ce62be1594a488c4e257d34af327e48b86eb41eec38c02000000d900473044022054a7db82c8f3c832dabcf6a330cf47902fd3332ee227f2352b6b035787c23748022023b0898bcb4fbac99435af35280aefb79869ed4fcf8e444b9bc3d0383ebf1aad01473044022009450906587093b17ff786e996adc3331b72519ecd2e21b50eca9ca803b9a2d102205d20e6c4e945bdba9019855899df1728e16532a3a3d0e253a34ae0c96a67f0550147522102342b195830cd7a7d99978e505d085177471ecfa52448c80875d5d23ab9f5983a210282c551ef0e397a28cf3417e39e8722826c0f6869c80f7e8ccf98f967f104c08452aeffffffff7b4eebd54ca068101264a132e9661d36e5e64d7e98644872cc2023adfe36cbef010000006f00473044022008a07c0a8d8e54057ca0d654f67e320bc4165758f6893c67c238eb15d8c7ba9c0220111cb2d16d73605647f2e2b9901cc68bce418900805a307646614e6c08a6f3f401255121035ac3628827833900f3608421021efd1aabbb40181b6a0aa5a56e9b8ad661336251aeffffffff0400000000000000000a6a084f41010002010800220200000000000017a914989eced18486efaa768203d515132b55ce53e2d887220200000000000017a914ba2aea16c445cc5565b9c27d81f150af2d7b34f187fe0f0a000000000017a914724703422702e35cf9f9adc8b0b3a869afe4f3aa8700000000"
   * }
   */
  app.use('/api/transfers', require('./api/transfers'));

  app.use('/notify', require('./api/notify'));

  app.use('/api/text', require('./api/text'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
