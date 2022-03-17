'use strict';
/* global angular */
var app = angular.module('cors', ['ionic']);

app.controller('OptionsCtrl', ['$scope', "$http", function ($scope, $http) {
  var $backgroundPage = chrome.extension.getBackgroundPage();

  $scope.active = false;

  $scope.urls = [];
  $scope.exposedHeaders = '';

  chrome.storage.local.get({
    'active': $scope.active,
    'urls': [],
    'exposedHeaders': ''
  }, function (result) {
    $scope.active = result.active;
    $scope.urls = result.urls;
    $scope.exposedHeaders = result.exposedHeaders;
    $scope.$apply();

    $scope.$watch('active', function () {
      chrome.storage.local.set({
        'active': $scope.active
      });
      $backgroundPage.reload();
    });

    $scope.$watch('exposedHeaders', function () {
      console.info('exposedHeaders', arguments, this);
      chrome.storage.local.set({
        'exposedHeaders': $scope.exposedHeaders
      });
      $backgroundPage.reload();
    });

    $scope.$watch('urls', function () {
      console.info('watch urls ',arguments, this);
      chrome.storage.local.set({
        'urls': $scope.urls
      });
      $backgroundPage.reload();
    }, true);
  });

  $scope.openInNewTab = function (url) {
    chrome.tabs.create({
      url: url
    });
  };

  $scope.addUrl = function () {
    if ($scope.url && $scope.urls.indexOf($scope.url, $scope.urls) === -1) {
      $scope.urls.unshift($scope.url);
      $scope.url = '';
    }
  };

  $scope.removeUrl = function (index) {
    $scope.urls.splice(index, 1);
  };
}]);

app.controller('CookiesCtrl', ['$scope', "$http", function ($scope, $http) {
  var $backgroundPage = chrome.extension.getBackgroundPage();

  $scope.tab_url = '';

  $scope.cookies = [];

  chrome.tabs.getSelected(null, function(tab){
    var link = document.createElement('a');
    link.href = tab.url;
    $scope.tab_url = link.hostname;

    $scope.$watch('cookies', function () {
      $backgroundPage.reload();
    }, true);

    chrome.cookies.getAll({domain: $scope.tab_url}, function(cookies) {
      $scope.$apply(function () {
        $scope.cookies = cookies;
      });
      chrome.cookies.onChanged.addListener(function(changedInfo)
      {
        
      });
    });
  });
}]);

app.directive('textOption', function () {
  return {
    restrict: 'E',
    scope: {
      option: '=',
      placeholder: '@'
    },
    templateUrl: '../components/text-option.html',
    controller: function ($scope) {
      $scope.editing = false;

      $scope.onEdit = function () {
        $scope.editableOption = $scope.option;
        $scope.editing = true;
      };

      $scope.onCancel = function () {
        $scope.editing = false;
      };

      $scope.onSave = function () {
        $scope.option = $scope.editableOption;
        $scope.editing = false;
      };
    }
  };
});

app.directive('submitOnEnter', function () {
  return {
    restrict: 'A',
    scope: {
      methodName: '&submitOnEnter'
    },
    link: function (scope, element) {
      angular.element(element).on('keydown', function (e) {
        if (e.keyCode === 13) {
          scope.methodName();
          scope.$apply();
        }
      });
    }
  };
});

app.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('tabs', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })
    .state('tabs.options', {
      url: "/options",
      views: {
        'options-tab': {
          templateUrl: "templates/options.html",
        }
      }
    })
    .state('tabs.cookies', {
      url: "/cookies",
      views: {
        'cookies-tab': {
          templateUrl: "templates/cookies.html"
        }
      }
    })

   $urlRouterProvider.otherwise("/tab/cookies");

});
