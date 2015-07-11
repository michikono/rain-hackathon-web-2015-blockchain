'use strict';

angular.module('blockchainedMelodyApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.assets = {};

    var activate = function () {
      $http.get('/api/buckets/d4840e4e-4768-41db-9e57-1fe13098fb4f/balances').success(function (asset_links) {
        var cache = $scope.assets;
        _.forEach(asset_links, function (info) {
          if (!cache[info.asset_id]) {
            $http.get('/api/assets/' + info.asset_id).success(function (asset) {
              if (asset.definition_reference.name_short === "BOOK") {
                $scope.assets[info.asset_id] = asset;
              }
            })
          } else {
            $scope.assets[info.asset_id] = cache[info.asset_id];
          }
        });
      });

      console.log('here')
    };

    activate();
    setInterval(activate, 5000);


  });
