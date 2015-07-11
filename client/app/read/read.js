'use strict';

angular.module('blockchainedMelodyApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('read', {
        url: '/read/:assetId',
        templateUrl: 'app/read/read.html',
        controller: 'ReadCtrl'
      })
      .state('readWithTitle', {
        url: '/read/:assetId/:assetTitle',
        templateUrl: 'app/read/read.html',
        controller: 'ReadCtrl'
      });
  });