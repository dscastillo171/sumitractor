angular.module('sumiApp').factory('sumiAPI', ['$http', '$q', function($http, $q){

	// Load the list of processes.
	var loadProcesses = function(searchQuery, isTemplate){
		return $q(function(resolve, reject){
			var query = isTemplate? '?isTemplate=true&': '?';
			if(searchQuery && searchQuery.length > 0){
				query += 'name=' + encodeURIComponent(searchQuery);
			}

			$http.get('https://sumitractor2.herokuapp.com/processes' + query, {responseType: 'json'}).then(function(result){
				resolve(result.data);
			}, function(){
				reject();
			});
		});
	};

	// Create a new process.
	var pushProcess = function(arg1, template){
		if(typeof(arg1) === 'string'){
			return $q(function(resolve, reject){
				$http.post('https://sumitractor2.herokuapp.com/processes', {name: arg1, isTemplate: template}).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		} else{
			return $q(function(resolve, reject){
				$http.put('https://sumitractor2.herokuapp.com/processes/' + encodeURIComponent(arg1._id), arg1).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		}
		
	};

	// Delete process.
	var deleteProcess = function(processId){
		return $http.delete('https://sumitractor2.herokuapp.com/processes/' + encodeURIComponent(processId));
	};

	// Load the stages for the given process.
	var loadStages = function(processId){
		return $q(function(resolve, reject){
			$http.get('https://sumitractor2.herokuapp.com/stages?process=' + encodeURIComponent(processId), {responseType: 'json'}).then(function(result){
				resolve(result.data);
			}, function(){
				reject();
			});
		});
	};

	// Create a new stage for the given process.
	var pushStage = function(arg1, order, name, description){
		if(typeof(arg1) === 'string'){
			return $q(function(resolve, reject){
				$http.post('https://sumitractor2.herokuapp.com/stages', {process: arg1, order: order, name: name, description: description}).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		} else{
			return $q(function(resolve, reject){
				$http.put('https://sumitractor2.herokuapp.com/stages/' + encodeURIComponent(arg1._id), arg1).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		}
	};

	// Delete a stage.
	var deleteStage = function(stage){
		return $http.delete('https://sumitractor2.herokuapp.com/stages/' + encodeURIComponent(stage._id), stage);
	};

	// Load the steps for the given stage.
	var loadSteps = function(stageId){
		return $q(function(resolve, reject){
			$http.get('https://sumitractor2.herokuapp.com/steps?stage=' + encodeURIComponent(stageId), {responseType: 'json'}).then(function(result){
				resolve(result.data);
			}, function(){
				reject();
			});
		});
	};

	// Create a new step for the given stage.
	var pushStep = function(arg1, order, name){
		if(typeof(arg1) === 'string'){
			return $q(function(resolve, reject){
				$http.post('https://sumitractor2.herokuapp.com/steps', {stage: arg1, order: order, name: name}).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		} else{
			return $q(function(resolve, reject){
				$http.put('https://sumitractor2.herokuapp.com/steps/' + encodeURIComponent(arg1._id), arg1).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		}
	};

	// Delete a step.
	var deleteStep = function(step){
		return $http.delete('https://sumitractor2.herokuapp.com/steps/' + encodeURIComponent(step._id), step);
	};

	// Load the publications for a given step.
	var loadPublications = function(stepId){
		return $q(function(resolve, reject){
			$http.get('https://sumitractor2.herokuapp.com/publications?step=' + encodeURIComponent(stepId), {responseType: 'json'}).then(function(result){
				resolve(result.data);
			}, function(){
				reject();
			});
		});
	};

	// Add a publication to the given step.
	var pushPublication = function(arg1, text, images, title, private, date){
		if(typeof(arg1) === 'string'){
			return $q(function(resolve, reject){
				$http.post('https://sumitractor2.herokuapp.com/publications', {step: arg1, text: text, images: images, title: title, isPrivate: private, date: date}).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		} else {
			return $q(function(resolve, reject){
				$http.put('https://sumitractor2.herokuapp.com/publications/' + encodeURIComponent(arg1._id), arg1).then(function(result){
					resolve(result.data);
				}, function(){
					reject();
				});
			});
		}
	};

	// Delete a publication.
	var deletePublication = function(publicationId){
		return $http.delete('https://sumitractor2.herokuapp.com/publications/' + encodeURIComponent(publicationId));
	};

	// Return the instance.
	var properties = {
		"loadProcesses": {
			value: loadProcesses
		},
		"pushProcess": {
			value: pushProcess
		},
		"deleteProcess": {
			value: deleteProcess
		},
		"loadStages": {
			value: loadStages
		},
		"pushStage": {
			value: pushStage
		},
		"deleteStage": {
			value: deleteStage
		},
		"loadSteps": {
			value: loadSteps
		},
		"pushStep": {
			value: pushStep
		},
		"deleteStep": {
			value: deleteStep
		},
		"loadPublications": {
			value: loadPublications
		},
		"pushPublication": {
			value: pushPublication
		},
		"deletePublication": {
			value: deletePublication
		}
	};
	return Object.create({}, properties);
}]);