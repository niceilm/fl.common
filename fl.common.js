angular.module('fl.common', ['ngMaterial', 'ui.router', 'fl.lazy'])
  .directive('gridResizer', ['$window', '$timeout', function($window, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        function resize() {
          var offset = parseInt(attr.gridResizer, 10) || 0;
          element.height(angular.element(document.body).height() - element.offset().top - offset);
        }

        angular.element($window).on('resize', resize);
        scope.$on('$destroy', function() {
          angular.element($window).off('resize', resize);
        });
        $timeout(resize, 0);
      }
    }
  }])
  .directive('naLoadingComplete', [function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        if(attr.loadingComplete == 'hide') {
          element.hide();
        } else {
          element.show();
        }
      }
    }
  }])
  .directive('naStopDefault', [function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        var eventType = attr.stopDefault || 'click';
        element.bind(eventType, function(event) {
          event.preventDefault();
        });
      }
    }
  }])
  .directive('naFocus', ['$timeout', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        var el = element.get(0);
        try {
          if(el && typeof el.focus == "function") {
            $timeout(function() {
              el.blur();
              $timeout(function() {
                el.focus();
              });
            });
          }
        } catch(me) {
        }
      }
    }
  }])
  .directive('naWhenActive', ['$location', function($location) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        if($location.path() === attrs.naWhenActive) {
          element.addClass("active");
        } else {

          element.removeClass("active");
        }
      }
    }
  }])
  .directive('naRedirect', function($window, $location) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        if(attrs.naRedirect) {
          var currentUrl = $location.url();
          $window.location.href = attrs.naRedirect + currentUrl;
        }
      }
    };
  })
  .directive('naLinkByLocation', ['$window', function($window) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        //  Mobile Safari in standalone mode
        if(("standalone" in $window.navigator) && $window.navigator.standalone) {
          element.click(function(event) {
            event.preventDefault();
            $window.location.href = attrs.href;
          });
        }
      }
    };
  }])
  .directive('naKeydownThanBlur', [function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        element.keydown(function($event) {
          if($event.keyCode !== 13) {
            return;
          }
          $event.preventDefault();
          $event.stopPropagation();
          $event.target.blur();
        });
      }
    }
  }])
  .provider("ModalService", function ModalServiceProvider() {
    var options = {
      toastHideDelay: 3000,
      toastPosition: "top right"
    };
    this.setOptions = function(newOptions) {
      newOptions = newOptions || {};
      options = angular.extend(options, newOptions);
    };

    this.$get = ['$mdDialog', '$mdToast', '$lazyLoadHelper', function($mdDialog, $mdToast, $lazyLoadHelper) {
      return {
        alert: alert,
        confirm: confirm,
        show: show,
        toast: toast

      };
      function alert(message, options) {
        options = options || {};
        return $mdDialog.show($mdDialog.alert()
          .title('확인')
          .content(message)
          .ariaLabel(options.okLabel || '확인')
          .ok(options.okLabel || '확인')
          .targetEvent(options.$event));
      }

      function confirm(message, options) {
        options = options || {};
        return $mdDialog.show($mdDialog.confirm()
          .title('확인')
          .content(message)
          .ariaLabel(options.okLabel || '저장')
          .ok(options.okLabel || '저장')
          .cancel(options.cancelLabel || '취소')
          .targetEvent(options.$event));
      }

      function show(option) {
        return $mdDialog.show($lazyLoadHelper.makeBundle(option));
      }

      function toast(message) {
        return $mdToast.show($mdToast.simple()
          .content(message)
          .position(options.toastPosition)
          .hideDelay(options.toastHideDelay));
      }
    }];
  })
  .factory('StateManager', ['$rootScope', '$state', function($rootScope, $state) {
    var _history = [];
    var _isFromBack = false;

    return {
      backState: backState,
      pop: pop,
      push: push,
      setFromBack: setFromBack,
      isFromBack: isFromBack
    };

    function isFromBack() {
      return _isFromBack;
    }

    function setFromBack(newFromBackState) {
      _isFromBack = newFromBackState;
    }

    function pop() {
      return _history.pop() || {};
    }

    function push(previousState) {
      _history.push(previousState);
    }

    function backState(stateName, params) {
      var previousState = pop();
      setFromBack(true);
      $state.go(previousState.name || stateName, previousState.params || params, {location: "replace"});
    }
  }])
  .factory('AgentManager', [function() {
    return {
      isAndroid: isAndroid,
      isIOS: isIOS,
      isMobile: isMobile
    };

    function isAndroid() {
      return (new UAParser()).getResult().os.name === "Android";
    }

    function isIOS() {
      return (new UAParser()).getResult().os.name === "iOS";
    }

    function isMobile() {
      return (new UAParser()).getResult().device.type === "mobile";
    }
  }])
  .factory('LoadingIndicator', ['$timeout', '$rootScope', function($timeout, $rootScope) {
    var timerPromise = null;
    $rootScope.isLoading = false;
    function start() {
      $timeout.cancel(timerPromise);
      $rootScope.isLoading = true;
      timerPromise = $timeout(function() {
        stop();
      }, 10000);
    }

    function stop() {
      $timeout.cancel(timerPromise);
      $rootScope.isLoading = false;
    }

    function isLoading() {
      return $rootScope.isLoading;
    }

    return {
      start: start,
      stop: stop,
      isLoading: isLoading
    };
  }])
  .filter('encodeURIComponent', [function() {
    return encodeURIComponent;
  }])
  .run(run);

run.$inject = ['$rootScope', 'StateManager'];

function run($rootScope, StateManager) {
  $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
    if(!from || !from.name) {
      return;
    }

    if(!StateManager.isFromBack()) {
      StateManager.push({
        name: from.name,
        params: fromParams
      });
    } else {
      StateManager.setFromBack(false);
    }
  });
}