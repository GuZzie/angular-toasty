angular.module('angular-toasty').directive('toasty', ['toasty', '$timeout', '$sce', function(toasty, $timeout, $sce) {
	return {
		replace: true,
		restrict: 'EA',
		scope: true,
		link: function(scope, element, attrs) {

			// Init the counter
			var uniqueCounter = 0;

			// Allowed themes
			var themes = ['default', 'material', 'bootstrap'];

			// Init the position
			scope.position = '';

			// Init the toasty store
			scope.toasty = [];

			// On new rootScope toasty-new broadcast
			scope.$on('toasty-new', function(event, data) {
				var config = data.config;
				var options = data.options;

				if (!scope.position)
					scope.position = 'toasty-position-' + config.position;

				add(config, options);
			});

			// On new rootScope toasty-clear broadcast
			scope.$on('toasty-clear', function(event, data) {
				clear(data.id);
			});

			// On ng-click="close", remove the specific toast
			scope.close = function(id) {
				clear(id);
			};

			// On ng-click="close", remove the specific toast
			scope.clickToasty = function(toast) {
				scope.$broadcast('toasty-clicked', toast);
				if (toast.onClick && angular.isFunction(toast.onClick))
					toast.onClick.call(toast);
				if (toast.clickToClose)
					clear(toast.id);
			};

			// Clear all, or indivudally toast
			function clear(id) {
				if (!id) {
					angular.forEach(scope.toasty, function(value, key) {
						if (value.onRemove && angular.isFunction(value.onRemove))
							value.onRemove.call(scope.toasty[key]);
					});
					scope.toasty = [];
					scope.$broadcast('toasty-cleared');
				} else
					angular.forEach(scope.toasty, function(value, key) {
						if (value.id == id) {
							scope.$broadcast('toasty-cleared', scope.toasty[key]);
							if (value.onRemove && angular.isFunction(value.onRemove))
								value.onRemove.call(scope.toasty[key]);
							scope.toasty.splice(key, 1);
							if(!scope.$$phase)
								scope.$digest();
						}
					});
			}

			// Custom setTimeout function for specific
			// setTimeouts on individual toasts
			function setTimeout(toasty, time) {
				toasty.timeout = $timeout(function() {
					clear(toasty.id);
				}, time);
			}

			// Checks whether the local option is set, if not,
			// checks the global config
			function checkConfigItem(config, options, property) {
				if (options[property] == false) return false;
				else if (!options[property]) return config[property];
				else return true;
			}

			// Add a new toast item
			function add(config, options) {
				// Set a unique counter for an id
				uniqueCounter++;

				// Set the local vs global config items
				var sound = checkConfigItem(config, options, 'sound');
				var showClose = checkConfigItem(config, options, 'showClose');
				var clickToClose = checkConfigItem(config, options, 'clickToClose');
				var html = checkConfigItem(config, options, 'html');
				var shake = checkConfigItem(config, options, 'shake');

				// If we have a theme set, make sure it's a valid one
				var theme;
				if (options.theme)
					theme = themes.indexOf(options.theme) > -1 ? options.theme : config.theme;
				else
					theme = config.theme;

				// If we've gone over our limit, remove the earliest 
				// one from the array
				if (scope.toasty.length >= config.limit)
					scope.toasty.shift();

				// If sound is enabled, play the audio tag
				if (sound)
					document.getElementById('toasty-sound').play();

				var toast = {
					id: uniqueCounter,
					title: html ? $sce.trustAsHtml(options.title) : options.title,
					msg: html ? $sce.trustAsHtml(options.msg) : options.msg,
					showClose: showClose,
					clickToClose: clickToClose,
					sound: sound,
					shake: shake ? 'toasty-shake' : '',
					html: html,
					type: 'toasty-type-' + options.type,
					theme: 'toasty-theme-' + theme,
					onAdd: options.onAdd && angular.isFunction(options.onAdd) ? options.onAdd : null,
					onRemove: options.onRemove && angular.isFunction(options.onRemove) ? options.onRemove : null,
					onClick: options.onClick && angular.isFunction(options.onClick) ? options.onClick : null
				};

				// Push up a new toast item
				scope.toasty.push(toast);

				// If we have a onAdd function, call it here
				if (options.onAdd && angular.isFunction(options.onAdd))
					options.onAdd.call(toast);

				// Broadcast that the toasty was added
				scope.$broadcast('toasty-added', toast);

				// If there's a timeout individually or globally,
				// set the toast to timeout
				if (options.timeout != false) {
					if (options.timeout || config.timeout)
						setTimeout(scope.toasty[scope.toasty.length - 1], options.timeout || config.timeout);	
				}
	
			}
		},
		template: '<div id="toasty" ng-class="[position]">'
			        	+ '<audio id="toasty-sound" ng-src="{{toastyWavSound}}" preload="auto"></audio>'
						+ '<div class="toast" ng-repeat="toast in toasty" ng-class="[toast.type, toast.interact, toast.shake, toast.theme]" ng-click="clickToasty(toast)">'
					    	+ '<div ng-click="close(toast.id)" class="close-button" ng-if="toast.showClose"></div>'
							+ '<div ng-if="toast.title || toast.msg" class="toast-text">'
								+ '<span class="toast-title" ng-if="!toast.html && toast.title" ng-bind="toast.title"></span>'
								+ '<span class="toast-title" ng-if="toast.html && toast.title" ng-bind-html="toast.title"></span>'
								+ '<br ng-if="toast.title && toast.msg" />'
								+ '<span class="toast-msg" ng-if="!toast.html && toast.msg" ng-bind="toast.msg"></span>'
								+ '<span class="toast-msg" ng-if="toast.html && toast.msg" ng-bind-html="toast.msg"></span>'
							+ '</div>'
						+'</div>'
				  + '</div>'
		}
}]);