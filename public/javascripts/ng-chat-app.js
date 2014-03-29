
var chatApp = angular.module('chatApp', ['ngResource']);

//
// Resource to load comments from the server
//
chatApp.factory('Comment', ['$resource', function($resource) {
  return $resource('/api/v1/comments');
}]);

chatApp.controller('chatCtrl', function($scope, Comment) {

  //
  // Get current comments from the server
  //
  var serverComments = Comment.query(function success() {
    $scope.comments = serverComments;
  }, function error(err) {
    console.log('error! ', err);
  });
  

  //
  // Connect a socket to ther server
  //
  var socket = io.connect('http://localhost:3000');
  
  //
  // If we get a response, let's add it to the comments list
  //
  socket.on('addedComment', function (data) {
    if(!$scope.$$phase) {
      $scope.$apply(function() {
        $scope.comments.push(data);
      })
    }
  });

  //
  // The user has submitted a new comment
  //
  $scope.submitComment = function() {
    // 
    // Build data packet to send to the server
    //
    var data = { text: $scope.comment };
    
    //
    // Send the comment
    //
    socket.emit('addComment', data);

    //
    // Add our own comment directly to our comment list
    //
    $scope.comments.push(data);
    $scope.comment = '';

  }
})