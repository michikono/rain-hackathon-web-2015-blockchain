'use strict';

angular.module('blockchainedMelodyApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.assets = {};

    setInterval(function() {
	    $http.get('/api/buckets/d4840e4e-4768-41db-9e57-1fe13098fb4f/balances').success(function(asset_links) {

	      	_.forEach(asset_links, function(info){
	      	  if(!$scope.assets[info.asset_id]) {
		      	$http.get('/api/assets/' + info.asset_id).success(function(asset){
		      		$scope.assets[info.asset_id] = asset;
		      	})	
		      }
	      });
	    });

	    console.log('here')
    
    }, 5000);




  });
