'use strict';

angular.module('blockchainedMelodyApp')
  .controller('ReadCtrl', function ($scope, $http, $stateParams) {
    $scope.text = '';
    $scope.asset = {
      definition_reference: {
        name: $stateParams.assetTitle
      }
    };

    $http.get('api/text').success(function (text) {
      $scope.text = text[0].text;
    });

    $http.get('/api/assets/' + $stateParams.assetId).success(function (asset) {
      $scope.asset = asset
    });

  });
