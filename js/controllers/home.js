angular.module('sumiApp').controller('homeController', ['$scope', '$rootScope', '$cookieStore', '$http', '$state', '$modal', '$q',
	function($scope, $rootScope, $cookieStore, $http, $state, $modal, $q){
		// Return true if the given substate matches the current one.
		$scope.subStateIs = function(substate){
			return $state.is('home.' + substate);
		};

		$scope.logOut = function(){
			// Go to the login page.
			$state.go('login');

			// Delete account data.
			$cookieStore.remove('com.sumi.ag');
			$cookieStore.remove('com.sumi.ts');
			delete $http.defaults.headers.common["apikey"];
		};
	}
]);