angular.module('sumiApp').controller('mainController', ['$scope', '$rootScope', '$state', '$http', '$cookieStore', '$q',
	function($scope, $rootScope, $state, $http, $cookieStore, $q){
		// Initialize the client according to the credentials availability.
		$scope.initMain = function(){
			// Check if the login information was stored.
			var agent = $cookieStore.get('com.sumi.ag');
			var timeStamp = $cookieStore.get('com.sumi.ts');
			
			// Make sure the session didn't exipre yet.
			if(agent && (new Date().getTime()) - timeStamp < 86400000){
				// Set the http headers.
				$http.defaults.headers.common['apikey'] = agent.apikey;

				// Reset the expiration date.
				$cookieStore.put('com.sumi.ts', new Date().getTime());

				// Go to the actual client.
				$state.go('home.repairs');
			} else{
				// Go to the login page.
				//$state.go('login');
				$state.go('home.repairs');
			}
		};
	}
]);