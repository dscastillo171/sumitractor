angular.module('sumiApp').controller('settingsController', ['$scope', '$rootScope', '$modal', '$filter', '$q', 'sumiAPI',
	function($scope, $rootScope, $modal, $filter, $q, sumiAPI){
		// Data containers.
		$scope.templates;

		// Load the templares when the controller is initiated.
		$scope.init = function(){
			$scope.templates = null;
			$q(function(resolve, reject){
				sumiAPI.loadProcesses(null, true).then(function(templates){
					$scope.templates = templates;
					angular.forEach(templates, function(template){
						// Load the stages.
						sumiAPI.loadStages(template._id).then(function(stages){
							// For each stage load the steps.
							var promises = [];
							angular.forEach(stages, function(stage){
								promises.push($q(function(resolve, reject){
									sumiAPI.loadSteps(stage._id).then(function(steps){
										stage.steps = steps.sort(function(a, b){
											return a.order - b.order;
										});
										resolve();
									}, reject);
								}));
							});

							// Wait for the steps to load.
							$q.all(promises).then(function(){
								template.stages = stages.sort(function(a, b){
									return a.order - b.order;
								});
							}, reject);
						}, reject);
					});
				}, reject);
			}).then(null, function(){
				// Retry loading the processes.
				setTimeout(function() {
					$scope.init();
				}, 5000);
			});
		};

		// Add a new template.
		$scope.addTemplate = function(){
			// Open the modal dialog.
			var modalInstanceController = function($scope, $modalInstance){
				$scope.newName = '';

				$scope.create = function(){
					$scope.loading = true;
					$scope.error = false;
					sumiAPI.pushProcess($scope.newName, true).then(function(){
						$scope.loading = false;
						$modalInstance.close();
					}, function(){
						$scope.error = true;
					});
				}

				$scope.dismiss = function(){
					$modalInstance.dismiss();
				};
			};

			// Display the instance.
			var modalInstance = $modal.open({
				'templateUrl': 'templates/modals/newTemplate.html',
				'controller': modalInstanceController,
				'size': 'sm'
			});

			// Process the result.
			modalInstance.result.then(function(process){
				$scope.init();
			});
		};

		// Delete the given template.
		$scope.deleteTemplate = function(template){
			$scope.showWarning('Usted esta apunto de borrar esta plantilla, esta acción no se puede deshacer, desea continuar?').then(function(){
				sumiAPI.deleteProcess(template._id).then(function(){
					$scope.init();
				})
			});
		};

		// Save the template' name.
		$scope.saveTemplateName = function(template){
			template.name = template.name.length > 0? template.name: '-';
			sumiAPI.pushProcess(template).then(null, $scope.init);
		};

		// Add a new stage.
		$scope.addStage = function(template){
			template.stages = template.stages || [];
			var stageNumber = template.stages.length + 1;
			sumiAPI.pushStage(template._id, stageNumber, 'Paso ' + stageNumber, '').then(function(stage){
				template.stages = template.stages || [];
				template.stages.push(stage);
			});
		};

		// Save a stage's state.
		$scope.saveStage = function(stage){
			sumiAPI.pushStage(stage).then(null, $scope.init)
		};

		// Move a stage.
		$scope.moveStage = function(template, stage, up){
			var index = template.stages.indexOf(stage);
			if(index >= 0){
				if(up && index !== 0){
					// Swap the orders.
					var stageOrder = stage.order;
					stage.order = template.stages[index - 1].order;
					template.stages[index - 1].order = -1;

					// Save.
					$q(function(resolve, reject){
						sumiAPI.pushStage(template.stages[index - 1]).then(function(){
							sumiAPI.pushStage(stage).then(function(){
								template.stages[index - 1].order = stageOrder;
								sumiAPI.pushStage(template.stages[index - 1]).then(null, reject);
							}, reject);
						}, reject);
					}).then(null, $scope.init);
				} else if(!up && index !== template.stages.length - 1){
					// Swap the orders.
					var stageOrder = stage.order;
					stage.order = template.stages[index + 1].order;
					template.stages[index + 1].order = -1;

					// Save.
					$q(function(resolve, reject){
						sumiAPI.pushStage(template.stages[index + 1]).then(function(){
							sumiAPI.pushStage(stage).then(function(){
								template.stages[index + 1].order = stageOrder;
								sumiAPI.pushStage(template.stages[index + 1]).then(null, reject);
							}, reject);
						}, reject);
					}).then(null, $scope.init);
				}
			}
		};

		// Delete the given stage.
		$scope.deleteStage = function(template, stage){
			sumiAPI.deleteStage(stage).then(function(){
				var index = template.stages.indexOf(stage);
				if(index >= 0){
					template.stages.splice(index, 1);
				}
			});
		};

		// Expand the given stage.
		$scope.expand = function(template, stage){
			for(var i = 0; i < template.stages.length; i++){
				if(template.stages[i]._id === stage._id){
					template.stages[i].expand = !template.stages[i].expand;
				} else if(template.stages[i].expand){
					template.stages[i].expand = false;
				}
			}
		};

		// Add a step to the given stage.
		$scope.addStep = function(stage){
			stage.steps = stage.steps || [];
			var stepNumber = stage.steps.length + 1;
			sumiAPI.pushStep(stage._id, stepNumber, 'Subpaso ' + stepNumber).then(function(step){
				stage.steps = stage.steps || [];
				stage.steps.push(step);
			});
		};

		// Move the given step.
		$scope.moveStep = function(stage, step, up){
			var index = stage.steps.indexOf(step);
			if(index >= 0){
				if(up && index !== 0){
					var stepName = step.name;
					step.name = stage.steps[index - 1].name;
					stage.steps[index - 1].name = stepName;
				} else if(!up && index !== stage.steps.length - 1){
					var stepName = step.name;
					step.name = stage.steps[index + 1].name;
					stage.steps[index + 1].name = stepName;
				}

				// Reorder the array.
				stage.steps.sort(function(a, b){
					return a.order - b.order;
				});
			}
		};

		// Save the steps.
		$scope.saveSteps = function(stage){
			$q(function(resolve, reject){
				angular.forEach(stage.steps, function(step){
					if(step.deleted){
						sumiAPI.deleteStep(step).then(null, reject);
					} else{
						sumiAPI.pushStep(step).then(null, reject);
					}
				});
			}).then(null, function(){
				setTimeout(function() {
					$scope.init();
				}, 5000);
			});
		};

		// Show a warning message.
		$scope.showWarning = function(text){
			// Open the modal dialog.
			var modalInstanceController = function($scope, $modalInstance, params){
				$scope.text = params.text;
				$scope.close = function(){
					$modalInstance.close();
				}
				$scope.dismiss = function(){
					$modalInstance.dismiss();
				};
			};

			// Display the instance.
			var modalInstance = $modal.open({
				'templateUrl': 'templates/modals/warning.html',
				'controller': modalInstanceController,
				'size': 'sm',
				'resolve':{
					params: function(){
						return {text: text};
					}
				}
			});

			// Process the result.
			return modalInstance.result;
		};
	}
]).filter('order', function() {
	return function(items) {
		return items? items.slice().sort(function(a, b){
			return typeof(a.order) !== 'undefined' && typeof(b.order) !== 'undefined'? a.order - b.order: 0;
		}): [];
	};
});