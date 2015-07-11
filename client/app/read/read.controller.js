'use strict';

angular.module('blockchainedMelodyApp')
  .controller('ReadCtrl', function ($scope, $http) {
    $scope.text = '';

	$http.get('api/text').success(function(text) {
		$scope.text = text[0].text;
	});


  });
