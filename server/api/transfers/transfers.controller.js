/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /transfers              ->  index
 * POST    /transfers              ->  create
 * GET     /transfers/:id          ->  show
 * PUT     /transfers/:id          ->  update
 * DELETE  /transfers/:id          ->  destroy
 */

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

chain.keyStore.add(new Chain.Xpub(
  "xpub6BWmELteKsnQRFrvBSmWDicHEy7qomg6eskwHK7U7DjygqqciPux3WreuhN1wsKAAygez1CejaU2phLmPdA9U8JUinTEyVT1XixJAoNPUkz",
  true
));

//chain.issueAsset(
//  "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
//  [
//    {
//      bucket_id: "d4840e4e-4768-41db-9e57-1fe13098fb4f",
//      amount: 100
//    }
//  ],
//  function(err, response){}
//);

chain.transferAsset(
  [{
    asset_id: "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
    bucket_id: "d4840e4e-4768-41db-9e57-1fe13098fb4f",
    min_confirmations: 0,
    amount: 1
  }],
  [{
    asset_id: "AXWjzBmdFgB9YaEjwRd8tw5WZoDwdiAqnZ",
    bucket_id: "aecbc268-2ed2-4143-b69c-da89c1bb9a99",
    amount: 1
  }],
  function (err, response) {
    console.log(err)
    console.log(response);
  }
);

chain.getBucketAssetBalance('aecbc268-2ed2-4143-b69c-da89c1bb9a99', function(err, response){
  console.log('####');
  console.log(err)
  console.log(response)
});

// Get list of things
//exports.index = function (req, res) {
//  res.json([
//    {
//      name: 'Development Tools',
//      info: 'Integration with popular tools such as Bower, Grunt, Karma, Mocha, JSHint, Node Inspector, Livereload, Protractor, Jade, Stylus, Sass, CoffeeScript, and Less.'
//    }, {
//      name: 'Server and Client integration',
//      info: 'Built with a powerful and fun stack: MongoDB, Express, AngularJS, and Node.'
//    }, {
//      name: 'Smart Build System',
//      info: 'Build system ignores `spec` files, allowing you to keep tests alongside code. Automatic injection of scripts and styles into your index.html'
//    }, {
//      name: 'Modular Structure',
//      info: 'Best practice client and server structures allow for more code reusability and maximum scalability'
//    }, {
//      name: 'Optimized Build',
//      info: 'Build process packs up your templates as a single JavaScript payload, minifies your scripts/css/images, and rewrites asset names for caching.'
//    }, {
//      name: 'Deployment Ready',
//      info: 'Easily deploy your app to Heroku or Openshift with the heroku and openshift subgenerators'
//    }
//  ]);
//};