angular.module('sumiApp').controller('homeController', ['$scope', '$rootScope', '$cookieStore', '$state', '$q', '$http',
	function($scope, $rootScope, $cookieStore, $state, $q, $http){
		// Return true if the given substate matches the current one.
		$scope.subStateIs = function(substate){
			return $state.is('home.' + substate);
		};

		// Logout
		$scope.logout = function(){console.log('out');
			// Delete account data.
			$cookieStore.remove('com.sumi.ag');
			$cookieStore.remove('com.sumi.ts');
			$http.defaults.headers.common.Authorization = 'Basic -';

			// Go to the login page.
			$state.go('login');
		};
	}
]);