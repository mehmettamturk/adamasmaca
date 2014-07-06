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


angular.module('adamAsmaca').controller('MainCtrl', ['$scope', 'WordService', function($scope, WordService) {
    $scope.alphabet = "abcçdefghıijklmnoöprsştuüvyz".split('');
    $scope.points = {
        easy: 10,
        normal: 20,
        hard: 30
    };

    WordService.getWord('easy', function(data) {
        $scope.showWord(data.word, data.category);
    });

    $scope.showWord = function(word, category) {
        $scope.word = word.toLowerCase();
        $scope.result = '';
        $scope.userChoices = [];
        $scope.trial = 6;
        $scope.wordPoint = $scope.points[category];

        for (var i = 0; i < $scope.word.length; i++) {
            if ($scope.word[i] == ' ' || $scope.word[i] == '?')
                $scope.result += $scope.word[i];
            else
                $scope.result += '_';
        }
    };

    $scope.check = function(char) {
        char = char.toLowerCase();
        var isFound = false;
        $scope.userChoices.push(char);
        angular.forEach($scope.word, function(wordChar, index) {
            if (wordChar == char) {
                $scope.result = $scope.result.substr(0, index) + char + $scope.result.substr(index + 1);
                isFound = true;

                if ($scope.word == $scope.result)
                    alert('Aferin.');
            }
        });

        if (!isFound) {
            $scope.trial--;
            $scope.wordPoint--;
            if ($scope.trial == 0)
                alert('Malesef bilemedin.');
        }
    };

}]);


angular.module('adamAsmaca').controller('UserCtrl', ['$scope', '$route', '$http', 'UserService', function($scope, $route, $http, UserService) {
    $scope.username = $route.current.params.username;

    UserService.getUser($scope.username, function(data) {
        $scope.userData = data;
    });
}]);


angular.module('adamAsmaca').factory('WordService', function($http) {
    var WordService = {};

    WordService.getWord = function(category, callback) {
        $http.get('/words/' + category).success(function(data) {
            callback(data);
        })
    };

    return WordService;
});


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
