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
  if(req.body && req.body.payload) {
    var payload = req.body.payload
    //if(payload.inputs[0] && payload.inputs[0].bucket_id) {
    //
    //}
  }
  res.send(req.body)
};

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