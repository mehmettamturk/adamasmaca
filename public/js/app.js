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
    $scope.alphabet = "abcçdefgğhıijklmnoöprsştuüvyz".split('');
    $scope.totalPoints = 0;
    $scope.questionShown = false;
    $scope.resultShown = false;
    $scope.currentCategory = 'easy';
    $scope.isCorrect = false;
    $scope.points = {
        easy: 10,
        normal: 20,
        hard: 30
    };
    $scope.mouthClass = 'happy';

    $scope.start = function() {
        $scope.totalPoints = 0;
        $scope.trial = 6;
        WordService.getWord('easy', function(data) {
            $scope.questionShown = true;
            $scope.showWord(data.word, data.category);
        });
    };

    $scope.nextQuestion = function() {
        $scope.isCorrect = false;
        $scope.resultShown = false;
        if ($scope.currentCategory == 'easy')
            $scope.currentCategory = 'normal';
        else if ($scope.currentCategory == 'normal')
            $scope.currentCategory = 'hard';

        WordService.getWord($scope.currentCategory, function(data) {
            $scope.questionShown = true;
            $scope.showWord(data.word, data.category);
        });
    };

    $scope.showWord = function(word, category) {
        $scope.resultShown = false;
        $scope.word = word.toLowerCase();
        $scope.result = '';
        $scope.userChoices = [];
        $scope.trial = 6;
        $scope.wordPoint = $scope.points[category];
        $scope.mouthClass = 'happy';

        for (var i = 0; i < $scope.word.length; i++) {
            if ($scope.word[i] == ' ' || $scope.word[i] == '?')
                $scope.result += $scope.word[i];
            else
                $scope.result += '_';
        }

        $scope.drawStickman('happy');
    };

    $scope.check = function(char) {
        char = char.toLowerCase();
        var isFound = false;
        $scope.userChoices.push(char);
        angular.forEach($scope.word, function(wordChar, index) {
            if (wordChar == char) {
                $scope.result = $scope.result.substr(0, index) + char + $scope.result.substr(index + 1);
                isFound = true;

                if ($scope.word == $scope.result) {
                    $scope.totalPoints += ($scope.points[$scope.currentCategory] - (6 - $scope.trial));
                    $scope.resultShown = true;
                    $scope.isCorrect = true;
                    $scope.mouthClass = 'happy';
                }
            }
        });

        switch ($scope.trial) {
            case 5: $scope.mouthClass = 'happy'; break;
            case 4: $scope.mouthClass = 'middle'; break;
            case 3: $scope.mouthClass = 'middle'; break;
            case 2: $scope.mouthClass = 'sad'; break;
            case 1: $scope.mouthClass = 'last'; break;
            case 0: $scope.mouthClass = 'dead'; break;
        }

        if ($scope.word == $scope.result)
            $scope.mouthClass = 'won';
        $scope.drawStickman($scope.mouthClass);

        if (!isFound) {
            $scope.trial--;
            $scope.wordPoint--;

            if ($scope.trial == 0) {
                $scope.resultShown = true;
                $scope.totalPoints = 0;
                $scope.drawStickman('dead');
                $scope.result = $scope.word;
                $scope.animateCanvas();
            }
        }
    };

    setTimeout(function() { // Run draw method after all template load.
        $scope.drawStickman('happy');
    }, 0);

    $scope.animateCanvas = function() {
        var a = 0;
        var interval = setInterval(function() {
            a++;
            $scope.drawStickman('dead', a);
            if (a == 10)
                clearInterval(interval);
        }, 20);
    };

    function clearCanvas(context, canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        var w = canvas.width;
        canvas.width = 1;
        canvas.width = w;
    }

    $scope.drawStickman = function(smile, addPixel) {
        var add = addPixel || 0;
        var canvas = document.getElementById('canvas');
        var context = canvas.getContext('2d');
        clearCanvas(context, canvas);
        context.fillStyle = "#EFA77A";
        context.lineWidth = 2;
        context.strokeStyle = 'black';

        drawFulArc(context, 50, 50 + add, 20, 0, 2 * Math.PI); // Drawing the Head
        drawArc(context, 50, 50 + add, 20, Math.PI, 0, false, 4); // Drawing the Hair

        if (smile == 'dead') {
            context.fillStyle = 'blue';
            context.fillText("x    x", 42, 48 + add); // Dead eyes.
            context.fillStyle = "#EFA77A";
        } else
            drawEyes(context);

        // Drawing Mouth
        if (smile == 'happy')
            drawArc(context, 50, 55 + add, 10, Math.PI, 0, true, 2);
        else if (smile == 'middle')
            drawLine(context, [40, 60 + add], [60, 60 + add], 'black', 2);
        else if (smile == 'sad')
            drawArc(context, 50, 65 + add, 10, Math.PI, 0, false, 2);
        else if (smile == 'last')
            drawEllipse(context, 40, 58 + add, 20, 5);
        else if (smile == 'dead') {
            drawEllipse(context, 40, 58 + add, 20, 5);
            drawLine(context, [50, 60 + add], [53, 68 + add], 'red', 5);
        } else if (smile == 'won')
            drawArc(context, 50, 50 + add, 14, Math.PI, 1, true, 2);

        // Stickman Body
        drawLine(context, [50, 70 + add], [50, 120 + add], 'black', 2); // Drawing the stick body
        drawLine(context, [50, 80 + add], [30, 110 + add], 'black', 2); // Drawing the left arm
        drawLine(context, [50, 80 + add], [70, 110 + add], 'black', 2); // Drawing the right arm
        drawLine(context, [50, 120 + add], [30, 160 + add], 'black', 2); // Drawing the left limb
        drawLine(context, [30, 160 + add], [25, 155 + add], 'black', 2); // Drawing the left foot
        drawLine(context, [50, 120 + add], [70, 160 + add], 'black', 2); // Drawing the right limb
        drawLine(context, [70, 160 + add], [75, 155 + add], 'black', 2); // Drawing the right foot

        // Dar agaci :)
        drawLine(context, [120, 0], [120, 200], '#B22705', 4); // Right Wood
        drawLine(context, [20, 2], [120, 2], '#B22705', 4); // Top Wood
        drawLine(context, [50, 4], [50, 30 + add], 'black', 1); // Rope
        drawLine(context, [10, 200], [140, 200], 'green', 4); // Ground
        if (smile != 'dead') {
            drawLine(context, [15, 161], [85, 161], 'red', 3); // Top Taboret
            drawLine(context, [20, 161], [20, 198], 'red', 3); // Left Taboret
            drawLine(context, [80, 161], [80, 198], 'red', 3); // Right Taboret
        }

    };

    // Canvas Methods
    function drawLine(ctx, from, to, color, lineWidth) {
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.lineTo(to[0], to[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }

    function drawArc(ctx, x, y, r, sAngle, eAngle, counterclockwise, lineWidth) {
        ctx.beginPath();
        ctx.arc(x, y, r, sAngle, eAngle, counterclockwise);
        ctx.lineWidth = lineWidth;
        ctx.stroke();
        ctx.closePath();
    }

    function drawFulArc(ctx, x, y, r, sAngle, eAngle, counterclockwise) {
        ctx.beginPath();
        ctx.arc(x, y, r, sAngle, eAngle, counterclockwise);
        ctx.closePath();
        ctx.fill();
    }

    function drawEllipse(ctx, x, y, w, h) {
        var kappa = .5522848,
            ox = (w / 2) * kappa,
            oy = (h / 2) * kappa,
            xe = x + w,
            ye = y + h,
            xm = x + w / 2,
            ym = y + h / 2;

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        ctx.stroke();
        ctx.closePath();
    }

    function drawEyes(ctx) {
        /*Drawing right the Eyes*/
        ctx.beginPath();
        ctx.arc(44, 45, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();

        /*Drawing left the Eyes*/
        ctx.beginPath();
        ctx.arc(56, 45, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'blue';
        ctx.fill();
        ctx.closePath();
    }
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
