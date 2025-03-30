var app = angular.module('catsvsdogs', []);

// Decide which namespace to use, but always use the /result/socket.io path
var namespace = '/'; // default namespace
if (window.location.pathname.indexOf('/result') === 0) {
  namespace = '/result';  // /result namespace
}

// Connect using the chosen namespace, but ALWAYS path: '/result/socket.io'
var socket = io(namespace, {
  path: '/result/socket.io',
  transports: ['websocket', 'polling']
});

var bg1 = document.getElementById('background-stats-1');
var bg2 = document.getElementById('background-stats-2');

app.controller('statsCtrl', function($scope) {
  $scope.aPercent = 50;
  $scope.bPercent = 50;

  var updateScores = function() {
    socket.on('scores', function (json) {
      var data = JSON.parse(json);
      var a = parseInt(data.a || 0);
      var b = parseInt(data.b || 0);

      var percentages = getPercentages(a, b);
      bg1.style.width = percentages.a + "%";
      bg2.style.width = percentages.b + "%";

      $scope.$apply(function () {
        $scope.aPercent = percentages.a;
        $scope.bPercent = percentages.b;
        $scope.total = a + b;
      });
    });
  };

  var init = function() {
    document.body.style.opacity = 1;
    updateScores();
  };

  // "message" is just an example event to signal readiness
  socket.on('message', function(data) {
    init();
  });
});

function getPercentages(a, b) {
  if (a + b > 0) {
    var percA = Math.round(a / (a + b) * 100);
    return { a: percA, b: 100 - percA };
  }
  return { a: 50, b: 50 };
}
