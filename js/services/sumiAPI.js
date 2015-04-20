angular.module('sumiApp').factory('sumiAPI', ['$http', '$q', function($http, $q){
	var moc_p = [
		{'_id': 'p1', 'name': '346-34567-345'},
		{'_id': 'p2', 'name': '874-45863-763'},
		{'_id': 'p3', 'name': '127-82359-762'}
	];
	var step_p = {
		'p1': [{_id: 'p11', order: 1, name: 'Step 1'}, {_id: 'p12', order: 2, name: 'Step 2'}],
		'p2': [{_id: 'p21', order: 1, name: 'Step 1'}, {_id: 'p22', order: 2, name: 'Step 2'}, {_id: 'p23', order: 3, name: 'Step 3'}],
		'p3': [{_id: 'p31', order: 1, name: 'Step 1'}, {_id: 'p32', order: 2, name: 'Step 2'}]
	};
	var pub_p = {};

	// Load the list of processes.
	var loadProcesses = function(searchQuery){
		return $q(function(resolve, reject){
			$http.get('https://sumitractor2.herokuapp.com/processes' + (searchQuery && searchQuery.length > 0? '?name=' + encodeURIComponent(searchQuery): ''), {responseType: 'json'}).then(function(result){
				resolve(result.data);
			}, function(){
				reject();
			});
		});
	};
	var loadProcesses_moc = function(searchQuery){
		return $q(function(resolve, reject){
			if(searchQuery){
				if(searchQuery.length <= 0){
					resolve([]);
				} else if(searchQuery.length > 0 && searchQuery.length < 4){
					resolve(moc_p);
				} else{
					resolve([moc_p[0]])
				}
			} else{
				resolve(moc_p);
			}
		});
	};

	// Create a new process.
	var pushProcess = function(arg1){
		if(typeof(arg1) === 'string'){
			return $q(function(resolve, reject){
				$http.post('https://sumitractor2.herokuapp.com/processes', {name: arg1}).then(function(result){
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
	var pushProcess_moc = function(arg1){
		return $q(function(resolve, reject){
			if(typeof(arg1) === 'string'){
				var p = {'_id': 'p' + (moc_p.lenght + 1), 'name': arg1};
				 moc_p.push(p);
				 resolve(p);
			}
			resolve();
		});
	};

	// Delete process.
	var deleteProcess = function(processId){
		return $http.delete('https://sumitractor2.herokuapp.com/processes/' + encodeURIComponent(processId));
	};

	// Load the steps for the given process.
	var loadSteps = function(processId){
		return $q(function(resolve, reject){
			$http.get('https://sumitractor2.herokuapp.com/steps?process=' + encodeURIComponent(processId), {responseType: 'json'}).then(function(result){
				resolve(result.data);
			}, function(){
				reject();
			});
		});
	};
	var loadSteps_moc = function(processId){
		return $q(function(resolve, reject){
			resolve(step_p[processId] || []);
		});
	};

	// Create a new step for the given process.
	var pushStep = function(arg1, order, name){
		if(typeof(arg1) === 'string'){
			return $q(function(resolve, reject){
				$http.post('https://sumitractor2.herokuapp.com/steps', {process: arg1, order: order, name: name}).then(function(result){
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
	var pushStep_moc = function(arg1, order, name){
		return $q(function(resolve, reject){
			if(typeof(arg1) === 'string'){
				var steps = step_p[arg1] || [];
				steps.push({_id: arg1 + (steps.lenght + 1), order: order, name: name});
				step_p[arg1] = steps;
			}
			resolve();
		});
	}

	// Delete a step.
	var deleteStep = function(step){
		return $http.delete('https://sumitractor2.herokuapp.com/steps/' + encodeURIComponent(step._id), step);
	};
	var deleteStep_moc = function(step){
		return $q(function(resolve){
			step_p['p1'] = [step_p['p1'][0]];
			resolve();
		});
	}

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
	var loadPublications_moc = function(stepId){
		return $q(function(resolve, reject){
			if(stepId.indexOf('p1') >= 0 || stepId.indexOf('p2') >= 0 || stepId.indexOf('p3') >= 0){
				resolve([
					{title: 'Title 1', text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.',
					images: ['images/placeholder.png', 'images/login.jpg', 'url3'], date: new Date()},
					{title: 'Title two', text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat.',
					images: [], date: new Date()}
				]);
			} else{
				resolve(pub_p[stepId] || []);
			}
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
	var createPublication_moc = function(stepId, text, images){
		return $q(function(resolve, reject){
			var pubs = pub_p[stepId] || [];
			pubs.push({text: text, images: images});
			pub_p[stepId] = pubs;
			resolve();
		});
	}

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