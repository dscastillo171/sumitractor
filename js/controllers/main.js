angular.module('sumiApp').controller('mainController', ['$scope', '$rootScope', '$state', '$http', '$cookieStore', '$q', '$base64',
	function($scope, $rootScope, $state, $http, $cookieStore, $q, $base64){
		// Initialize the client according to the credentials availability.
		$scope.initMain = function(){
			// Check if the login information was stored.
			var agent = $cookieStore.get('com.sumi.ag');
			var timeStamp = $cookieStore.get('com.sumi.ts');
			
			// Make sure the session didn't exipre yet.
			if((agent && (new Date().getTime()) - timeStamp < 86400000)){
				// Set the http headers.
				$http.defaults.headers.common.Authorization = 'Basic ' + $base64.encode(agent);

				// Reset the expiration date.
				$cookieStore.put('com.sumi.ts', new Date().getTime());

				// Go to the actual client.
				$state.go('home.repairs');
			} else{
				// Go to the login page.
				$state.go('login');
			}
		};
	}
]);