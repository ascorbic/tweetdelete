var connect = require('connect');
var MemoryStore = require('connect/middleware/session/memory');
var util = require('connect/utils');

var OAuth= require('oauth').OAuth;
var url = require("url");
var RedisStore = require('connect-redis');
var redis = new RedisStore({ maxAge: 300000 })

var tt = "https://api.twitter.com/1/";


try {
  var keys= require('./keys_file');
  for(var key in keys) {
    global[key] = keys[key];
  }
}
catch(e) {
  //console.log('Unable to locate the keys_file.js file.  Please copy and ammend the example_keys_file.js as appropriate');
/*  return;*/
}


var checkSession = function(req) {
	if(req && 'session' in req && req.session != null && 'access_token' in req.session && 'oauth_token' in req.session.access_token && 'oauth_token_secret' in req.session.access_token) {
		return true;
	}
	return false;
}

var getOAuth = function() {
	return new OAuth("http://api.twitter.com/oauth/request_token",
                      "http://api.twitter.com/oauth/access_token",
                      twitterConsumerKey,
                      twitterConsumerSecret,
                      "1.0",
                      twitterCallback,
                      "HMAC-SHA1");	
}

function routes(app) {
	app.get('/dump', function(req, res, params) {
		res.writeHead(200, {'Content-Type': 'text/plain'})
        res.end(JSON.stringify(req.session))
	}),
  app.get ('/get_tweets', function(req, res, params) {	
		if(!checkSession(req)) {
            res.writeHead(403, {'Content-Type': 'text/html'})
			res.end("Forbidden");
			return;
		}
	
        var oa= getOAuth();

		var tok = req.session.access_token.oauth_token;
		var sec = req.session.access_token.oauth_token_secret;
		
		oa.get(tt + 'account/verify_credentials.json', tok, sec, function (error, data) {
			if(error) {
				if(error.statusCode == 401) {
		            res.writeHead(403, {'Content-Type': 'text/html'})
					res.end("Forbidden");
					return;
				}
	            res.writeHead(500, {'Content-Type': 'application/json'});
				res.end(JSON.stringify(error));
	
			}
			data = JSON.parse(data);
			
			req.session.user = {
				screen_name: data.screen_name, 
				name: data.name,
				profile_image_url: data.profile_image_url 
			}
			
			var tweets = [];
			
			var getMoreTweets = function(page) {
				oa.get(tt + 'statuses/user_timeline.json?count=200&trim_user=1&page=' + page, tok, sec, function (err, data) {
					//console.log('page: ' + page);
					if(err) {
			            res.writeHead(500, {'Content-Type': 'application/json'});
						res.end(JSON.stringify(err));
					} else {
						data = JSON.parse(data);
						
						var c = data.length;
						//console.log(JSON.stringify(c));
						if (c && c > 1) {
							
							tweets = tweets.concat(data);
							
							if(page > 20) {
					            res.writeHead(400, {'Content-Type': 'text/plain'});
								res.end("Too many requests");
							}
							getMoreTweets(++page);
						} else {
							var t = [];
							for(var i=0; i< tweets.length; i++) {
								t.push(tweets[i].id_str);
							}
							req.session.tweets = t;
							
							var nonce = oa._getNonce(56);
							req.session.nonce = nonce;
							
							var result = {
								tweets: t.length,
								user: req.session.user,
								nonce: nonce
							}
							res.writeHead(200, {'Content-Type': 'application/json'});

							res.end(JSON.stringify(result));
				            
							
						}
					}
				});
				
			}
			
			getMoreTweets(1);			

			
			
		});
	    
  }),
  app.get ('/send_tweet', function(req, res, params) {	
		
		var parsedUrl= url.parse(req.url, true);
		var args = parsedUrl.query;
	
	
		if(!args.nonce || args.nonce != req.session.nonce || !checkSession(req)) {
			console.log(JSON.stringify([args, req.session]))
            res.writeHead(403, {'Content-Type': 'text/html'})
			res.end("Forbidden");
			return;
		}
		delete req.session.nonce;
		
		
		var tweet = "I just deleted " + (parseInt(args.deleted)) + " old tweet" + (args.deleted == 1 ? '' : 's') + " at http://tweetd.lt";
	
        var oa= getOAuth();

		var tok = req.session.access_token.oauth_token;
		var sec = req.session.access_token.oauth_token_secret;
		
		
		oa.post(tt + 'statuses/update.json', tok, sec, {status: tweet, trim_user: true}, null, function(err, data) {
			if(err) {
				if(err.statusCode == 401) {
		            res.writeHead(403, {'Content-Type': 'text/html'})
					res.end("Forbidden");
					return;
				}
	            res.writeHead(500, {'Content-Type': 'application/json'});
				res.end(JSON.stringify(err));
	
			}
            res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({sent: tweet}));

		}
	)
}),
app.get ('/clearsession', function(req, res, params) {
	delete req.session.user;
	delete req.session.auth;
	delete req.session.access_token;
	res.writeHead(403, {'Content-Type': 'text/html'})
	res.end("Forbidden");
	return;
    
	
}),
app.get ('/redirect', function(req, res, params) {
	var oa = getOAuth();
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, oauth_authorize_url, additionalParameters ) {
		if(!error) {
			req.session.auth = {
				"oauth_token": oauth_token,
				"oauth_token_secret": oauth_token_secret
			};
            res.writeHead(200, {'Content-Type': 'application/json'})
			res.end(JSON.stringify({
				redirect: "http://twitter.com/oauth/authenticate?oauth_token=" + oauth_token,
				session: req.session
				}));
			} else {
	            res.writeHead(500, {'Content-Type': 'text/html'})
				res.end(error);
			}
			});


		}),
app.get ('/callback', function(req, res, params) {
	var oa = getOAuth();
	var parsedUrl= url.parse(req.url, true);
    

    if( parsedUrl.query && parsedUrl.query.oauth_token && req.session.auth && req.session.auth.oauth_token_secret && parsedUrl.query.oauth_verifier) {
	
		oa.getOAuthAccessToken(parsedUrl.query.oauth_token, req.session.auth.oauth_token_secret, parsedUrl.query.oauth_verifier,
			function( error, oauth_token, oauth_token_secret, additionalParameters ) {
				if( !error ) {
					req.session.access_token = {
						"oauth_token_secret": oauth_token_secret,
						"oauth_token": oauth_token,
						"user_id": additionalParameters.user_id,
                        "screen_name": additionalParameters.screen_name
					}
					req.session.auth = {};
					
					res.writeHead(303, {'Location': '/'})
		            res.end('');
					
    			} else {
			            res.writeHead(500, {'Content-Type': 'text/html'})
						res.end(error);
				}
				
			}
		);
	} else {
		res.writeHead(500, {'Content-Type': 'text/html'})
        res.end(JSON.stringify([req.session, parsedUrl]))
	}
	


})
}



var server= connect.createServer( 
                      connect.cookieDecoder(), 
                      connect.session({ store: redis}),
                      connect.staticProvider(__dirname + '/public'),

					  connect.router(routes)
                    
);
server.listen(3000);


var io = require('socket.io'); 
var socket = io.listen(server); 

socket.on('connection', function(client){ 
	// helper function that goes inside your socket connection
	
	var sid = null;
	
	client.connectSession = function(fn) {
		var cookie = client.request.headers.cookie;
		var cookies = util.parseCookie(cookie);
		sid = cookies['connect.sid'];

		redis.get(sid, function(err, data) {		
				fn(err,data);
			}
		);
	};
	
	

	client.connectSession(function(err, data) {
	  //console.log('sesison: ' + JSON.stringify(data));
	});
	client.on('message', function(message){ 
		client.connectSession(function(err, session) {		
		try {
			var params = JSON.parse(message);
			switch(params.method) {
				case 'delete':
					//console.log('deleting');
					var args = params.args;
					if(args.nonce && args.nonce == session.nonce) {
						session.nonce = null;
						//console.log('atched nonce');
						
						//console.log(JSON.stringify([args, session]));
						
						if(session.tweets && args.skip < session.tweets.length) {
							//console.log('doing it');
							var oa= getOAuth();

							var tok = session.access_token.oauth_token;
							var sec = session.access_token.oauth_token_secret;
							
						    for (var i = args.skip; i < session.tweets.length ; i++) { 
								//console.log('doing ' + i);
							
						        
								oa.post(tt + 'statuses/destroy.json', tok, sec, {id: session.tweets[i], trim_user: true}, null, function(err, data) {
									if(err) {
										//console.log('err: ' + JSON.stringify(err));
										
									} else {
										var ret = {
											done: i - args.skip,
											of: session.tweets.length - args.skip
										}
										if (ret.done == ret.of) {
											var nonce = oa._getNonce(56);
											ret.nonce = nonce;
											session.nonce = nonce;
											redis.set(sid, session);
										}
										client.send(JSON.stringify(ret));
									}
								});
						    }


						}


					}
					break;
				
				default:
					//console.log('unknown method: ' + params.method);
			}
		} catch(e) {
			//console.log('err: ' + JSON.stringify(args));
		}
		});

	});
	
	
});




