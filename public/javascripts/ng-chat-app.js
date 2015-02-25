
var chatApp = angular.module('chatApp', ['ngResource']);
var checkLoginState;

//
// Resource to load comments from the server
//
chatApp.factory('Comment', ['$resource', function($resource) {
  return $resource('/api/v1/comments');
}]);

chatApp.factory('User', ['$http', function($http) {
  var sessionId;
  return {
    FBAuthResponse: null,
    info: null,
    login: function(callback) {
      console.log('this: ', this);

      $http.post(environment.host + '/loginfb', {
        FBAuthResponse: this.FBAuthResponse,
        info: this.info
      }).
        success(function(data, status, headers, config) {
          console.log('good: ', data, status);
          callback();
        }).
        error(function(data, status, headers, config) {
          console.log('error: ', data, status);
          callback('some error! ');
        });
    }
  };
}]);

chatApp.run(['$rootScope', '$window', 'User', '$http',
  function($rootScope, $window, User, $http) {

    $rootScope.$apply(function() {
      User.checkingLoggedIn = true;
    });
    
    console.log('app started!');

    //
    // FB SDK stuff
    //
    // This is called with the results from from FB.getLoginStatus().
    function statusChangeCallback(response) {

      // todo: solve flashing messages issue in UI (easy)
      
      $rootScope.$apply(function() {
        User.checkingLoggedIn = false;
      });
      
      console.log('statusChangeCallback');
      console.log(response);
      // The response object is returned with a status field that lets the
      // app know the current login status of the person.
      // Full docs on the response object can be found in the documentation
      // for FB.getLoginStatus().
      if (response.status === 'connected') {
        // Logged into your app and Facebook.
        User.FBAuthResponse = response.authResponse;
        testAPI();
      } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
      } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
      }
    }

    // This function is called when someone finishes with the Login
    // Button.  See the onlogin handler attached to it in the sample
    // code below.
    checkLoginState = function() {
      FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
      });
    }

    window.fbAsyncInit = function() {
      FB.init({
        appId      : environment.FBAppId,   // localhost dev
        cookie     : true,  // enable cookies to allow the server to access 
                            // the session
        xfbml      : true,
        version    : 'v2.2'
      });

      // Now that we've initialized the JavaScript SDK, we call 
      // FB.getLoginStatus().  This function gets the state of the
      // person visiting this page and can return one of three states to
      // the callback you provide.  They can be:
      //
      // 1. Logged into your app ('connected')
      // 2. Logged into Facebook, but not your app ('not_authorized')
      // 3. Not logged into Facebook and can't tell if they are logged into
      //    your app or not.
      //
      // These three cases are handled in the callback function.

      FB.getLoginStatus(function(response) {
        statusChangeCallback(response);
      });


    };

    // Load the SDK asynchronously
    (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Here we run a very simple test of the Graph API after login is
    // successful.  See statusChangeCallback() for when this call is made.
    function testAPI() {
      console.log('Welcome!  Fetching your information.... ');
      FB.api('/me', function(response) {
        console.log('Successful login for: ' + response.name);
        console.log('got response: ', response);
        
        
        $rootScope.$apply(function() {
          User.info = response;
          console.log('Got user info!: ', User);
          
          User.login(function(err) {
            if (err) {
              console.log('got error! ', err);
            } else {
              console.log('good login!');
            }
          })
        });
        
        
        
      });
    }


  }
]);

chatApp.controller('chatCtrl', function($scope, Comment, User) {

  $scope.$watch(function() {
    return User;
  }, function() {
    $scope.checkingLoggedIn = User.checkingLoggedIn;
    $scope.isLoggedIn = !!User.info;
    $scope.user = User.info;
  }, true);
  
  $scope.comments = [];
  
  //
  // Get current comments from the server on initial page load
  //
  var serverComments = Comment.query(function success() {
    $scope.comments = serverComments;
  }, function error(err) {
    console.log('error! ', err);
  });
  

  //
  // Connect a socket to the server
  //
  console.log('environment.host: ' + environment.host);
  var socket = io.connect(environment.host);
  
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
    // Build data packet to send to the server.  This defines the app's objects!
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
});