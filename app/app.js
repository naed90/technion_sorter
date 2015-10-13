'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [])
    .controller('DemoCntl', ['$scope', function($scope){
      $scope.yourName = "dean";
    }])

    .controller('View1Cntrl', ["$scope",function($scope) {
      $scope.number_of_courses = 1;
      $scope.course_data = [];

      for(var i = 0; i < $scope.number_of_courses;i++)
      {
          $scope.course_data.push({course_name:"", course_num:"", checkAv:false});
      }

      $scope.increment = function()
      {if($scope.number_of_courses<$scope.course_limit)

      {
        $scope.number_of_courses++
        $scope.course_data.push({course_name:"", course_num:"", checkAv:false});
      }

       };

      $scope.course_limit = 12;
      //$scope.inputData = [];

      $scope.courses_to_read = {};

      $scope.readInput = function()
      {

        $scope.courses_to_read = {};//clear

        var course_data = $scope.course_data;
        for(var i = 0; i < course_data.length;i++)
        {
          var dat = course_data[i];
          $scope.courses_to_read[dat.course_num] = dat;
        }

        doSomething.test2();
        //doSomething.test();
        console.log(JSON.stringify($scope.courses_to_read));
        doSomething.setCoursesToRead($scope.courses_to_read);
        doSomething.test2();
        doSomething.executeMatching();

      }
      $scope.toggleN = function(n)
      {
        $scope.course_data[n].checkAv = !$scope.course_data[n].checkAv;
      }
    }])

    .directive('view1', function() {
      return {
        restrict: 'E',
        templateUrl: 'view1/view1.html',
        link: function(scope, element, attrs) {
          scope.n = scope.$eval(attrs.n);
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
    }).directive("limitTo", [function() {
      return {
        restrict: "A",
        link: function(scope, elem, attrs) {
          var limit = parseInt(attrs.limitTo);
          angular.element(elem).on("keydown", function() {
            var alwaysAcceptable = [46, 8, 9, 27, 13, 110, 190, 35, 36, 37, 38, 39, 40];
            var acceptableWhenUnder6 = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57];

            if(alwaysAcceptable.indexOf(event.which)!=-1)return true;
            if(event.which==65 &&(event.ctrlKey || event.metaKey))return true;//CTRL+A or Command+A
            if(this.value.length<limit)
            return acceptableWhenUnder6.indexOf(event.which)!=-1;
            return false;
          });
        }
      }
    }])
    .directive('view2', function() {
      return {
        restrict: 'E',
        templateUrl: 'view2/view2.html',
        link: function(scope, element, attrs) {

          scope.schedules = scope.$eval(attrs.schedules);
        }
      };
    })