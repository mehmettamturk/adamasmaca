'use strict';

/* App Module */
angular.module('adamAsmaca', [ 'ngRoute' ]).config(['$routeProvider', function($routeProvider) {
    $routeProvider.
        when('/', {
            templateUrl: 'partials/main.html',
            controller: 'MainCtrl'
        }).
        when('/user/:username', {
            templateUrl: 'partials/user.html',
            controller: 'UserCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
}]);


angular.module('adamAsmaca').controller('MainCtrl', ['$scope', function($scope) {
    $scope.alphabet = "abcçdefghıijklmnoöprsştuüvyz".split('');
    $scope.word = 'esra';
    $scope.result = '';
    $scope.userChoices = [];
    $scope.trial = 6;

    for (var i=0; i<$scope.word.length; i++) {
        $scope.result += '_';
    }

    $scope.check = function(char) {
        var isFound = false;
        $scope.userChoices.push(char);
        angular.forEach($scope.word, function(wordChar, index) {
            if (wordChar == char) {
                $scope.result = $scope.result.substr(0, index) + char + $scope.result.substr(index + 1);
                isFound = true;

                if ($scope.word == $scope.result)
                    alert('Dogru.');
            }
        });

        if (!isFound) {
            $scope.trial--;
            if ($scope.trial == 0)
                alert('Yanlis');
        }
    };

}]);


angular.module('adamAsmaca').controller('UserCtrl', ['$scope', '$route', '$http', 'UserService', function($scope, $route, $http, UserService) {
    $scope.username = $route.current.params.username;

    UserService.getUser($scope.username, function(data) {
        $scope.userData = data;
    });
}]);


angular.module('adamAsmaca').factory('UserService', function($http) {
    var UserService = {};

    UserService.getUser = function(username, callback) {
        $http.get('/user/' + username).success(function(data) {
            callback(data);
        })
    };

    return UserService;
});


angular.module('adamAsmaca').filter('capitalize', function() {
    return function(input, scope) {
        if (input == null)
            return '';
        return input.substring(0,1).toUpperCase() + input.substring(1);
    }
});
