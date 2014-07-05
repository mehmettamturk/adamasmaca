'use strict';

/* App Module */

angular.module('adamAsmaca', [ 'ngRoute' ]).config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/main.html',
            controller: 'MainCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
}]);

angular.module('adamAsmaca').controller('MainCtrl', ['$scope', function($scope) {
    $scope.sth = true;
}]);

