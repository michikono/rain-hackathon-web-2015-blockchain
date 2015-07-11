'use strict';

angular.module('blockchainedMelodyApp')
  .config(function ($stateProvider) {
    $stateProvider
  	  .state('read', {
        url: '/read',
        templateUrl: 'app/read/read.html',
        controller: 'ReadCtrl'
      });
  });