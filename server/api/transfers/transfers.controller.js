'use strict';

var _ = require('lodash');
var Chain = require('../../lib/index');

var chain = new Chain.Client({
  keyId: "27f7fd9312eef78ec54dfbb92324e471",
  keySecret: "b06c1485c198c748d72920678e33e32b"
});

chain.keyStore.add(new Chain.Xprv(
  "xprv9s21ZrQH143K3fdfzBVQrgiFMr3Y4QDWr5PwXAURN87aC5GWdzhoH3MiQyYUMqm8PnGSwpxfSiToeLgssb5F4iyeMApGFLS6oXogGbwWWiv",
  true
));

exports.index = function (req, res) {
  console.log(req.body)
  chain.transferAsset(
    [{
      asset_id: req.param('assetId'), // "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
      bucket_id: req.param('inputBucketId'), // "d4840e4e-4768-41db-9e57-1fe13098fb4f",
      min_confirmations: 0,
      amount: 1
    }],
    [{
      asset_id: req.param('assetId'), // "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
      bucket_id: req.param('outputBucketId'), // "aecbc268-2ed2-4143-b69c-da89c1bb9a99",
      amount: 1
    }],
    function (err, response) {
      res.setHeader('Content-Type', 'application/json');
      if (response) {
        res.json(response);
      } else {
        res.json(err.resp.body);
      }
    }
  );
};



//
//chain.issueAsset(
//  "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
//  [
//    {
//      bucket_id: "d4840e4e-4768-41db-9e57-1fe13098fb4f",
//      amount: 10
//    }
//  ],
//  function(err, response){
//    console.log(err && err.resp.body);
//    console.log(response);
//  }
//);

//chain.transferAsset(
//  [{
//    asset_id: "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
//    bucket_id: "d4840e4e-4768-41db-9e57-1fe13098fb4f",
//    min_confirmations: 0,
//    amount: 1
//  }],
//  [{
//    asset_id: "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
//    bucket_id: "aecbc268-2ed2-4143-b69c-da89c1bb9a99",
//    amount: 1
//  }],
//  function (err, response) {
//    console.log(err && err.resp.body);
//    console.log(response);
//  }
//);

