angular.module('sumiApp').controller('loginController', ['$scope', '$http', '$q', '$state', '$cookieStore', '$base64',
	function($scope, $http, $q, $state, $cookieStore, $base64){
		$scope.submit = function(){
			$scope.error = false;
			$scope.loading = true;
			if($scope.user && $scope.user.length > 0 && $scope.password && $scope.password.length > 0){
				// Make the request.
				var agent = $scope.user + ':' + $scope.password;
				$http.defaults.headers.common.Authorization = 'Basic ' + $base64.encode(agent);
				$http.head('https://sumitractor2.herokuapp.com/processes').then(function(){
					// Save the cookie.
					$cookieStore.put('com.sumi.ts', new Date().getTime());
					$cookieStore.put('com.sumi.ag', agent);

					// Go to the home page.
					$scope.loading = false;
					$state.go('home.repairs');
				}, function(){
					$scope.error = true;
					$scope.loading = false;
				});
			} else{
				$scope.error = true;
				$scope.loading = false;
			}
		};
	}	
]);