angular.module('sumiApp').controller('repairsController', ['$scope', '$rootScope', '$modal', '$filter', '$q', '$upload', 'sumiAPI',
	function($scope, $rootScope, $modal, $filter, $q, $upload, sumiAPI){
		// Editing states.
		$scope.EDIT = {
			STILL: 0,
			EDITING: 1,
			LOADING: 2
		};

		// Data containers.
		$scope.processes, $scope.activeProcess, $scope.activeSteps, $scope.publicationsCount;
		$scope.editName = $scope.EDIT.STILL; $scope.nameDraft;
		$scope.editSteps = $scope.EDIT.STILL; $scope.stepsDraft = {};

		// Safe apply a change.
		$scope.safeApply = function(fn) {
			var phase = this.$root.$$phase;
			if(phase == '$apply' || phase == '$digest') {
				if(fn && (typeof(fn) === 'function')) {
					fn();
				}
			} else {
				this.$apply(fn);
			}
		};

		// Load the processes when the controller is initiated.
		$scope.init = function(){
			$scope.processes = null;
			sumiAPI.loadProcesses($scope.searchQuery).then(function(processes){
				$scope.processes = processes;
				if(!$scope.activeProcess && processes.length > 0){
					$scope.setAsActiveProcess(processes[0]);
				}
			}, function(){
				// Retry loading the processes.
				setTimeout(function() {
					$scope.init();
				}, 5000);
			});
		};

		// Add a new process.
		$scope.addProcess = function(){
			// Open the modal dialog.
			var modalInstanceController = function($scope, $modalInstance){
				$scope.newName = '';

				$scope.create = function(){
					$scope.loading = true;
					$scope.error = false;
					sumiAPI.pushProcess($scope.newName).then(function(newProcess){
						$scope.loading = false;
						$modalInstance.close(newProcess);
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
				'templateUrl': 'templates/modals/newProcess.html',
				'controller': modalInstanceController,
				'size': 'sm'
			});

			// Process the result.
			modalInstance.result.then(function(process){
				$scope.init();
				$scope.setAsActiveProcess(process);
			});
		};

		// Save the process' name.
		$scope.saveName = function(){
			if($scope.nameDraft.length > 0){
				var process = angular.copy($scope.activeProcess);
				process.name = $scope.nameDraft;
				sumiAPI.pushProcess(process).then(function(){
					$scope.activeProcess.name = process.name;
					$scope.editName = $scope.EDIT.STILL;
					$scope.nameDraft = null;
				}, function(){
					$scope.editName = $scope.EDIT.EDITING;
				});
			} else{
				$scope.editName = $scope.EDIT.STILL;
			}
		};

		// Delete the active process.
		$scope.deleteProcess = function(){
			$scope.showWarning('Usted esta apunto de borrar esta reparación, esta acción no se puede deshacer, desea continuar?').then(function(){
				sumiAPI.deleteProcess($scope.activeProcess._id).then(function(){
					$scope.activeProcess = null;
					$scope.init();
				})
			});
		};

		// Sort the steps.
		$scope.sortSteps = function(){
			if($scope.activeSteps && $scope.activeSteps.length > 0){
				$scope.activeSteps = $scope.activeSteps.sort(function(step1, step2){
					return step1.order - step2.order;
				});
			}
		};

		// Start editing the steps.
		$scope.startEditSteps = function(){
			angular.forEach($scope.activeSteps, function(step){
				$scope.stepsDraft[step._id] = step.name;
			});
			$scope.editSteps = $scope.EDIT.EDITING;
		};

		// Save the steps names.
		$scope.saveSteps = function(){
			var promises = [];
			var deleteSteps = [];
			angular.forEach($scope.activeSteps, function(step){
				var newName = $scope.stepsDraft[step._id];
				if(newName && newName.length > 0 && newName !== step.name){
					var editingStep = angular.copy(step);
					editingStep.name = newName;
					promises.push($q(function(resolve){
						sumiAPI.pushStep(editingStep).then(function(){
							step.name = newName;
							resolve();
						}, function(){
							resolve();
						});
					}));
				} else if(!newName || newName.length === 0){
					deleteSteps.push(step);
				}
			});

			// Check if a step should be deleted.
			var confirmationPromise;
			if(deleteSteps.length > 0){
				var requiresConfirmation = [];
				var deletedPublications = 0;
				angular.forEach(deleteSteps, function(step){
					// Check if the step has publications.
					if(step.publications && step.publications.length > 0){
						requiresConfirmation.push(step);
						deletedPublications += step.publications.length;
					} else{
						promises.push(sumiAPI.deleteStep(step));
					}
				});

				if(requiresConfirmation.length > 0){
					confirmationPromise = $q(function(resolve){
						$scope.showWarning('Usted esta apunto de borrar ' + (requiresConfirmation.length === 1? 'un paso': requiresConfirmation.lengt + ' pasos')  
							+ ' y ' + (deletedPublications === 1? 'una publicación': deletedPublications + ' publicaciones') + ', desea continuar?').then(function(){
							angular.forEach(requiresConfirmation, function(confirmedStep){
								promises.push(sumiAPI.deleteStep(confirmedStep));
							});
							resolve();
						}, function(){
							resolve();
						});
					});
				}
			}
			confirmationPromise = confirmationPromise || $q.when();


			// Check if any name changed.
			confirmationPromise.then(function(){
				if(promises.length > 0){
					$q.all(promises).then(function(){
						$scope.setAsActiveProcess($scope.activeProcess, true);
						$scope.editSteps = $scope.EDIT.STILL;
					});
				} else{
					$scope.editSteps = $scope.EDIT.STILL;
				}
			});
		};

		// Move the step's position.
		$scope.moveStep = function(step, up){
			// Start the edition.
			$scope.editSteps = $scope.EDIT.LOADING;

			// Copy the steps array.
			var activeSteps = angular.copy($scope.activeSteps);
			var editingStep = activeSteps[$scope.activeSteps.indexOf(step)];
			var editedIndex = -1;

			// Modify the order property.
			if(!up && editingStep.order < activeSteps.length){
				// Look for the step above.
				for(var i = 0; i < activeSteps.length; i++){
					if(activeSteps[i].order === editingStep.order + 1){
						activeSteps[i].order = editingStep.order;
						editingStep.order = editingStep.order + 1;
						editedIndex = i;
						break;
					}
				}
			} else if(up && editingStep.order > 1){
				// Look for the step below.
				for(var i = 0; i < activeSteps.length; i++){
					if(activeSteps[i].order === editingStep.order - 1){
						activeSteps[i].order = editingStep.order;
						editingStep.order = editingStep.order - 1;
						editedIndex = i;
						break;
					}
				}
			}

			// Save the changes.
			if(editedIndex >= 0){
				var promises = [];
				promises.push(sumiAPI.pushStep(editingStep));
				promises.push(sumiAPI.pushStep(activeSteps[editedIndex]));
				$q.all(promises).then(function(){
					// Merge the array of steps.
					$scope.activeSteps = activeSteps;
					$scope.sortSteps();
					$scope.editSteps = $scope.EDIT.EDITING;
				}, function(){
					$scope.editSteps = $scope.EDIT.EDITING;
				});
			} else{
				$scope.editSteps = $scope.EDIT.EDITING;
			}
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

		// Add a new step.
		$scope.addStep = function(){
			// Open the modal dialog.
			var modalInstanceController = function($scope, $modalInstance, params){
				$scope.newName = '';

				$scope.create = function(){
					$scope.loading = true;
					$scope.error = false;
					sumiAPI.pushStep(params.activeProcess._id, params.activeSteps.length + 1, $scope.newName).then(function(){
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
				'templateUrl': 'templates/modals/newStep.html',
				'controller': modalInstanceController,
				'size': 'sm',
				'resolve': {
					'params': function(){
						return {activeProcess: $scope.activeProcess, activeSteps: $scope.activeSteps}
					}
				}
			});

			// Process the result.
			modalInstance.result.then(function(process){
				$scope.setAsActiveProcess($scope.activeProcess, true);
			});
		};

		// Publication modal controller..
		var modalInstanceController = function($scope, $modalInstance, params){
			$scope.loading = false;
			$scope.errorText = null;
			$scope.editing = params.post;

			$scope.activeSteps = params.activeSteps;

			$scope.selectedStep = params.currentStep || $scope.activeSteps[$scope.activeSteps.length - 1];
			$scope.today = (params.post && params.post.date) || new Date();
			$scope.private = (params.post && params.post.isPrivate) || false;
			$scope.title = (params.post && params.post.title) || '';
			$scope.text = (params.post && params.post.text) || '';
			$scope.images = (params.post && params.post.images) || [];
			$scope.files = [];

			$scope.imageFromFile = function(file){
				if(!file.image_src){
					file.image_src = URL.createObjectURL(file)
				}
				return file.image_src;
			};

			$scope.removeFile = function(file){
				var index = $scope.files.indexOf(file);
				if (index > -1) {
					$scope.files.splice(index, 1);
				}
			};

			$scope.removeImage = function(image){
				var index = $scope.images.indexOf(image);
				if (index > -1) {
					$scope.images.splice(index, 1);
				}
			};

			$scope.selectStep = function(step){
				$scope.selectedStep = step;
			}

			$scope.openDatePicker = function($event) {
				$event.preventDefault();
				$event.stopPropagation();
				$scope.opened = true;
			};

			$scope.setPrivate = function(private){
				$scope.private = private;
			}

			$scope.uploadedFiles = function($files){
				angular.forEach($files, function(file){
					$scope.files.push(file);
				});
			};

			$scope.create = function(){
				$scope.loading = true;

				// Start by uploading the images.
				var imagesPromise;
				if($scope.files.length > 0){
					var promises = [];
					angular.forEach($scope.files, function(file){
						promises.push($q(function(resolve, reject){
							params.$upload.upload({
								url: "https://api.cloudinary.com/v1_1/" + 'dn1kyafab' + "/upload",
								fields: {upload_preset: 'zurvxzb2'},
								file: file,
								transformRequest: function(data, headersGetter) {
									var headers = headersGetter();
									delete headers['Authorization'];
									return headers;
								}
							}).success(function(data){
								resolve(data.secure_url);
							}).error(function(error){
								reject();
							});
						}));
					});

					// Resolve the upload promises.
					imagesPromise = $q.all(promises);
				} else {
					imagesPromise = $q.when();
				}

				// Create the publication.
				imagesPromise.then(function(images){
					if(params.post){
						// A post is being edited.
						images = images || [];
						images = images.concat($scope.images);
						params.post.step = $scope.selectedStep._id;
						params.post.date = $scope.date || $scope.today;
						params.post.title = $scope.title || '';
						params.post.isPrivate = $scope.private;
						params.post.text = $scope.text || '';
						params.post.images = images;

						// Upload the changes.
						sumiAPI.pushPublication(params.post).then(function(){
							$modalInstance.close();
						}, function(){
							$scope.loading = false;
							$scope.errorText = 'Ocurrió un error, por favor intente de nuevo más tarde.';
						});
					} else{
						// A new post is being created.
						sumiAPI.pushPublication($scope.selectedStep._id, $scope.text || '', images || [], $scope.title || '', $scope.private, $scope.date || $scope.today).then(function(){
							$modalInstance.close();
						}, function(){
							$scope.loading = false;
							$scope.errorText = 'Ocurrió un error, por favor intente de nuevo más tarde.';
						});
					}
				}, function(){
					$scope.loading = false;
					$scope.errorText = 'Ocurrió un error, por favor intente de nuevo más tarde.';
				});
			}

			$scope.dismiss = function(){
				$modalInstance.dismiss();
			};
		};

		// Add a publication.
		$scope.addPublication = function(){
			// Display the instance.
			var modalInstance = $modal.open({
				'templateUrl': 'templates/modals/newPublication.html',
				'controller': modalInstanceController,
				'resolve': {
					'params': function(){
						return {
							$upload: $upload,
							activeSteps: $scope.activeSteps
						}
					}
				}
			});

			// Process the result.
			modalInstance.result.then(function(process){
				$scope.setAsActiveProcess($scope.activeProcess, true);
			});
		};

		// Edit the given post.
		$scope.editPost = function(post){
			// Search for the corresponding step.
			var currentStep;
			angular.forEach($scope.activeSteps, function(step){
				if(step._id === post.step){
					currentStep = step;
				}
			});

			// Display the instance.
			var modalInstance = $modal.open({
				'templateUrl': 'templates/modals/newPublication.html',
				'controller': modalInstanceController,
				'resolve': {
					'params': function(){
						return {
							$upload: $upload,
							activeSteps: $scope.activeSteps,
							currentStep: currentStep,
							post: post
						}
					}
				}
			});

			// Process the result.
			modalInstance.result.then(function(process){
				$scope.setAsActiveProcess($scope.activeProcess, true);
			});
		};

		// True if the given process is active.
		$scope.processIsActive = function(processId){
			return $scope.activeProcess && $scope.activeProcess._id === processId;
		};

		// Set the given process as the active process.
		$scope.setAsActiveProcess = function(process, reload){
			if(!$scope.processIsActive(process._id) || !$scope.activeSteps || reload){
				$scope.activeProcess = process;

				// Reset all data.
				$scope.activeSteps = null;
				$scope.publicationsCount = null;
				$scope.editName = $scope.EDIT.STILL; 
				$scope.nameDraf = null;
				$scope.editSteps = $scope.EDIT.STILL;
				$scope.stepsDraft = {};

				// Load the process steps.
				var currentProcess = $scope.activeProcess._id;
				sumiAPI.loadSteps(process._id).then(function(steps){
					// Load the publications for each step.
					var promises = [];
					var publicationsCount = 0;
					angular.forEach(steps, function(step){
						promises.push($q(function(resolve, reject){
							sumiAPI.loadPublications(step._id).then(function(result){
								step.publications = result;
								publicationsCount += result.length;
								resolve();
							}, function(){
								reject();
							});
						}));
					});

					// Wait for all promises to resolve.
					$q.all(promises).then(function(){
						if(currentProcess === $scope.activeProcess._id){
							$scope.activeSteps = steps;
							$scope.sortSteps();
							$scope.publicationsCount = publicationsCount;
						}
					}, function(){
						// Try again.
						setTimeout(function(){
							$scope.setAsActiveProcess(process);
						}, 5000);
					});
				}, function(){
					// Try again.
					setTimeout(function(){
						$scope.setAsActiveProcess(process);
					}, 5000);
				});
			}
		};

		// Delete the publication.
		$scope.deletePublication = function(publicationId){
			$scope.showWarning('Usted esta apunto de borrar esta publicación, esta acción no se puede deshacer, desea continuar?').then(function(){
				sumiAPI.deletePublication(publicationId).then(function(){
					$scope.setAsActiveProcess($scope.activeProcess, true);
				})
			});
		};

		// Open the given image.
		$scope.openImage = function(imageSRC){
			var modalInstanceController = function($scope, $modalInstance, params){
				$scope.imageSRC = params.imageSRC;

				$scope.dismiss = function(){
					$modalInstance.dismiss();
				};
			};

			// Display the instance.
			var modalInstance = $modal.open({
				'templateUrl': 'templates/modals/modalImage.html',
				'controller': modalInstanceController,
				'size': 'lg',
				'resolve': {
					'params': function(){
						return {
							imageSRC: imageSRC
						}
					}
				}
			});
		};

		$scope.downloadReport = function(){
			// Start loading.
			$scope.loadingReport = true;

			// Copy the active process and steps.
			var activeProcess = $scope.activeProcess;
			var activeSteps = $scope.activeSteps;

			// Start by downloading all images.
			var imageData = {};
			var promises = [];
			angular.forEach(activeSteps, function(step){
				angular.forEach(step.publications, function(publication){
					if(!publication.isPrivate){
						angular.forEach(publication.images, function(imageURL){
							promises.push($q(function(resolve, reject){
								var img = new Image();
								img.setAttribute('crossOrigin', 'anonymous');
								img.src = imageURL;
								img.onload = function(){
									// Draw the image into the canvas.
									var canvas = document.createElement("canvas");
									canvas.width =this.width;
									canvas.height =this.height;
									var ctx = canvas.getContext("2d");
									ctx.drawImage(this, 0, 0);

									// Extract the data url.
									var dataURL = canvas.toDataURL("image/png");
									imageData[imageURL] = {url: dataURL, width: canvas.width, height: canvas.height};
									resolve();
								};
								img.onerror = function(){
									resolve();
								};
							}));
						});
					}
				});
			});

			$q.all(promises).then(function(){
				// Create a new pdf.
				var doc = new jsPDF();

				// Increment verical offset.
				var verticalOffset = 0;
				var incrementVerticalOffset = function(increment){
					verticalOffset += increment
					if(verticalOffset > 230){
						doc.addPage();
						verticalOffset= 20;
					}
				}

				// Draw the tittle.
				doc.setFontSize(22);
	    		doc.text(20, 25, activeProcess.name);
				doc.line(20, 30, 190, 30);
				doc.setTextColor(150);
				doc.setFontSize(14);
				doc.text(160, 24, $filter('date')((new Date()), 'MMM dd, yyyy'));
				verticalOffset = 45;
				
				angular.forEach(activeSteps, function(step){
					// Step title.
					doc.setTextColor(0);
		            doc.setFontSize(18);
		            doc.text(20, verticalOffset, step.name);
		            incrementVerticalOffset(15);

		            angular.forEach(step.publications, function(publication){
		            	if(!publication.isPrivate){
		            		// Publication tittle.
			            	doc.setTextColor(0);
			            	doc.setFontSize(16);
				            doc.text(20, verticalOffset, publication.title);
				            doc.setTextColor(150);
				    		doc.setFontSize(14);
							doc.text(160, verticalOffset, $filter('date')(publication.date, 'MMM dd, yyyy'));
							incrementVerticalOffset(10);

							// Publication text.
							doc.setTextColor(0);
							doc.setFontSize(14);
							var lines = doc.splitTextToSize(publication.text, 170);
							doc.text(20, verticalOffset, lines);
							incrementVerticalOffset(((lines.length + 0.5) * 14) / 2.5);

							// Draw the images.
							angular.forEach(publication.images, function(imageURL){
								var imageObj = imageData[imageURL];
								var ratio = imageObj.height / imageObj.width;
								var height = 170 * ratio;
								if(verticalOffset + height > 230){
									doc.addPage();
									verticalOffset = 20;
								}
								doc.addImage(imageObj.url, 'PNG', 20, verticalOffset, 170, 0);
								incrementVerticalOffset(height + 10);
							});

							// End of publication.
							incrementVerticalOffset(15);
		            	}
		            });

				});

				// Save the pdf.
				doc.save();
				$scope.loadingReport = false;
			});

			
		};

		// Watch the search term filter.
		$scope.$watch('searchQuery', function(newValue, oldValue) {
			if(newValue !== oldValue){
				$scope.init();
			}
		});
	}
]).filter('reverse', function() {
	return function(items) {
		return items? items.slice().reverse(): [];
	};
});