//
// Front end Angular application
//

var chatApp = angular.module('chatApp', ['ngResource','ui.bootstrap']);
var checkLoginState;      // Required by FB SDK - ensure it's in scope at all times

//
// Write to the console if we have one and debug is TRUE.
//
function log(items) {
  if (environment.debug && console.log) {
    console.log(Array.prototype.slice.call(arguments));
  }
}

//
// Enable our bearer token (e.g. session id) to be sent on every $http request
//
chatApp.service('Authorization', ['$http', function($http) {
  this.setSessionId = function(sessionId) {
    log('setting Bearer token to header: ', sessionId);
    //
    // Set session ID in $http headers for all future requests
    //
    $http.defaults.headers.common.Authorization = 'Bearer ' + sessionId;
  }    
}]);

//
// Utility functions
//
chatApp.service('GlobalFunctions', function() {
  this.isUrl = function(url) {
    // useful variations: http://mathiasbynens.be/demo/url-regex
    var urlRegex = /(((http|https):\/{2})+(([0-9a-z_-]+\.)+(aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|org|pro|tel|travel|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mn|mn|mo|mp|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|nom|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ra|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw|arpa)(:[0-9]+)?((\/([~0-9a-zA-Z\#\+\%@\.\/_-]+))?(\?[0-9a-zA-Z\+\%@\/&\[\];=_-]+)?)?))\b/gi;
    return urlRegex.test(url);
  };
});

//
// Resource to load comments from the server
//
chatApp.factory('Comment', ['$resource', function($resource) {
  return $resource('/api/v1/comments/:id');
}]);

//
// Resource to manage the user
//
chatApp.factory('User', ['$http', 'Authorization', function($http, Authorization) {
  return {
    FBAuthResponse: null,
    info: null,
    login: function(callback) {
      $http.post(environment.host + '/loginfb', {
        FBAuthResponse: this.FBAuthResponse,
        info: this.info
      }).
        success(function(data, status, headers, config) {
          Authorization.setSessionId(data.sessionId);
          callback(null, data.sessionId);
        }).
        error(function(data, status, headers, config) {
          log('error: ', data, status);
          callback('sorry, login error');
        });
    }
  };
}]);

//
// App entry point.  Most code here is copied from the Facebook SDK sample
// page, with some minor Angular-izing. 
//
chatApp.run(['$rootScope', '$window', 'User', '$http',
  function($rootScope, $window, User, $http) {

    function setPageState(state) {
      $rootScope.$broadcast('pageState', state);
    }

    log('app started!');

    //
    // FB SDK stuff
    //
    // This is called with the results from from FB.getLoginStatus().
    function statusChangeCallback(response) {

      // todo: solve flashing messages issue in UI when user is already logged in (easy)
      
      //$rootScope.$apply(function() {
      //  User.checkingLoggedIn = false;
      //});

      log('statusChangeCallback');
      log(response);
      
      // The response object is returned with a status field that lets the
      // app know the current login status of the person.
      // Full docs on the response object can be found in the documentation
      // for FB.getLoginStatus().
      if (response.status === 'connected') {
        // Logged into your app and Facebook.
        User.FBAuthResponse = response.authResponse;
        continueLogin();
      } else if (response.status === 'not_authorized') {
        // The person is logged into Facebook, but not your app.
        setPageState('showHomepage');
      } else {
        // The person is not logged into Facebook, so we're not sure if
        // they are logged into this app or not.
        setPageState('showHomepage');
      }
    }

    // This function is called when someone finishes with the Login
    // Button.  See the onlogin handler attached to it in the sample
    // code below.
    checkLoginState = function() {
      setPageState('checkingLoggedIn');
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
    function continueLogin() {
      log('Welcome!  Fetching your information.... ');
      FB.api('/me', function(response) {
        log('Successful FB response for: ' + response.name);

        User.info = response;
        log('Got user info!: ', User);

        User.login(function(err, sessionId) {
          if (err) {
            log('got error! ', err);
          } else {
            User.sessionId = sessionId;
            log('good login! session id: ' + User.sessionId);
            $rootScope.$broadcast('userLoggedIn');
          }
        })
      });
    }

    setPageState('checkingLoggedIn');
  }
]);

//
// Angular controller for the main screen
//
chatApp.controller('chatCtrl', ['$scope', 'Comment', 'User', 'GlobalFunctions', 
  function($scope, Comment, User, GlobalFunctions) {
    
    //
    // todo: Understand why these coding gymnastics are required - Angular is usually not this finicky 
    //

    function setScopeVar(scopeVar, state) {
      if(!$scope.$$phase) {
        $scope.$apply(function() {
          $scope[scopeVar] = state;
        })
      } else {
        setTimeout(function() {
          setScopeVar(scopeVar, state);
        }, 100);
      }
    }
    
    function setPageState(state) {
      setScopeVar('pageState', state);
    }

    $scope.setAuxPage = function(state) {
      $scope.mainPageState = $scope.pageState;
      setPageState(state);
    };
    
    $scope.restoreMainPage = function() {
      setPageState($scope.mainPageState || 'showHomepage');
    };
    
    //
    // Listen for broadcasted events from any other module 
    // (e.g. FB module)
    //
    $scope.$on('pageState', function(event, state) {
      setPageState(state);
    });
    
    $scope.$on('userLoggedIn', function() {
      log('got broadcasted login event!');
      $scope.user = User.info;

      setPageState('isLoggedIn');
      getUserComments();
      setUpSocket();
    });
    
    $scope.comments = [];
    
    $scope.commentType = function(comment) {
      if (GlobalFunctions.isUrl(comment.value)) {
        return "url"
      } else {
        return "text"
      }
    };
    
    function getUserComments() {
      //
      // Get current comments from the server on initial page load
      //
      log('getting comments...');
      
      var serverComments = Comment.query(function success() {
        $scope.comments = serverComments;
      }, function error(err) {
        log('error! ', err);
      });
    }
  
    function deleteCommentById(id) {
      if(!$scope.$$phase) {
        $scope.$apply(function() {
          var indexToDelete, loop = 0;
          angular.forEach($scope.comments, function(comment) {
            if (comment.timestamp === id) {
              indexToDelete = loop;
            }
            loop++;
          });
          if (indexToDelete >= 0) {
            $scope.comments.splice(indexToDelete, 1);
          } else {
            log('no index to delete!');
          }
        });
      } else {
        log('no phase!');
        setTimeout(function() {
          deleteCommentById(id);
        }, 100);
      }
    };

    function setUpSocket() {
      //
      // Connect a socket to the server
      //
      $scope.connectionStatus = "pending";
      
      var namespaceId = environment.host + '/' + User.sessionId;
      var ioMangagerOptions = {
        reconnectionDelay: 1000,        // increase delay by 1 second each attempt
        reconnectionDelayMax: 30000     // max wait time 30 seconds
      };
      
      log('connecting to NS: ' + namespaceId);
      var socket = io.connect(namespaceId, ioMangagerOptions);
      
      // 
      // If we get a response, let's add it to the comments list
      //
      socket.on('addedComment', function (data) {
        if(!$scope.$$phase) {
          $scope.$apply(function() {
            $scope.comments.unshift(data);
          })
        }
      });
  
      socket.on('deletedComment', function(id) {
        deleteCommentById(id);
      });

      // todo: set UI elements based on status
      
      socket.on('connect', function() {
        log('got connect!');
        setScopeVar('connectionStatus', 'ok');
      });
      
      socket.on('reconnect', function(data) {
        log('got reconnect: ', data);
        setScopeVar('connectionStatus', 'restored');
        setTimeout(function() {
          setScopeVar('connectionStatus', 'ok');
        }, 4000);
      });
      
      socket.on('connect_error', function(err) {
        log('got connect_error error: ', err);
        // $scope.connectionStatus = "error";
        setScopeVar('connectionStatus', 'error');
      });
      
      //socket.on('reconnect_error', function(err) {
      //  log('got reconnect_error error: ', err);
      //});
      
      //
      // The user has submitted a new comment
      //
      $scope.submitComment = function() {
        
        if (!$scope.comment) {
          return;
        }
        
        // 
        // Build data packet to send to the server.  This defines the app's objects!
        //
        var data = { 
          type: 'text/plain', 
          value: $scope.comment 
        };
  
        //
        // Send the comment
        //
        socket.emit('addComment', data);
  
        $scope.comment = '';
      };
      
      $scope.deleteSelected = function() {
        angular.forEach($scope.comments, function(comment) {
          if (comment.selected) {
            var id = comment.timestamp;
            socket.emit('deleteComment', id);
          }
        });
      }
    }

    setPageState('checkingLoggedIn');
}]);