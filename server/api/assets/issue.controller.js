/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /transfers              ->  index
 */

'use strict';

var _ = require('lodash');
var Chain = require('../../lib/index');

var chain = new Chain.Client({
  keyId: "27f7fd9312eef78ec54dfbb92324e471",
  keySecret: "b06c1485c198c748d72920678e33e32b"
});

exports.index = function (req, res) {
  console.log('issuing');
  chain.issueAsset(req.params.assetId,
    [
      {
        bucket_id: req.params.bucketId,
        amount: 1
      }
    ],
    function (err, response) {
      res.setHeader('Content-Type', 'application/json');
      if (err) {
        console.log(err.resp)
        res.json(err.resp.body);
      } else {
        res.json(response);
      }
    });
};
