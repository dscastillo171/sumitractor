"use strict";
angular.module('sumiApp',['ui.router', 'ui.bootstrap', 'ngCookies', 'base64', 'angularFileUpload'])
.config(['$httpProvider', '$stateProvider', '$urlRouterProvider', function($httpProvider, $stateProvider, $urlRouterProvider) {
	// Support cross browser requests.settings
	delete $httpProvider.defaults.headers.common["X-Requested-With"];
	
	// Define app routes.
	$stateProvider

	// Route for the home page
	.state('home', {
		templateUrl : 'templates/home.html',
		controller: 'homeController'
	})

	// Route for the repairs page
	.state('home.repairs', {
		templateUrl : 'templates/repairs.html',
		controller: 'repairsController'
	})

	// Route for the mechanics page
	.state('home.mechanics', {
		templateUrl : 'templates/mechanics.html'
	})

	// Route for the settings page
	.state('home.settings', {
		templateUrl : 'templates/settings.html'
	})

	// Route for the login page.
	.state('login', {
		templateUrl : 'templates/login.html',
		controller: 'loginController'
	});
}]);