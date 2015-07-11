'use strict';

angular.module('blockchainedMelodyApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.assets = [];

    setInterval(function() {
	    $http.get('/api/things').success(function(assets) {
	      $scope.assets = assets;
	    });

	    // _.forEach($scope.assets, function(asset) {
	    	// $http.get(asset.textUrl).success(function(text) {
	    		// console.log(text);
	    	// })
	    // });
    
    }, 500);




  });
