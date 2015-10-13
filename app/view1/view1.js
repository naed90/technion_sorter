'use strict';


var app = angular.module('myApp');


app.controller('View1Cntrl', ["$scope",function($scope) {
        $scope.greeting = { text: 'Hello' };
    }])

    .directive('view1', function() {
      return {
        restrict: 'E',
        templateUrl: 'view1.html',
        link: function(scope) {

        }
      };
    })
    .filter('range', function() {
        return function(input, total) {
            total = parseInt(total);

            for (var i=0; i<total; i++) {
                input.push(i);
            }

            return input;
        };
    });