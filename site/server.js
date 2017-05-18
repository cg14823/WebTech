// Run a node.js web server for local development of a static web site.
// Start with "node server.js" and put pages in a "public" sub-folder.
// Visit the site at the address printed on the console.

// The server is configured to be platform independent.  URLs are made lower
// case, so the server is case insensitive even on Linux, and paths containing
// upper case letters are banned so that the file system is treated as case
// sensitive even on Windows.

// Load the library modules, and define the global constants.
// See http://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
// Start the server: change the port to the default 80, if there are no
// privilege issues and port number 80 isn't already in use.

var http = require("http");
var formidable = require('formidable');
var util = require('util');
var fs = require("fs");
var sql = require("sqlite3");
var bcrypt = require('bcryptjs');
var randomstring = require("randomstring");
var db = new sql.Database("memedatabase.db");

var postTemplate ='<div class="post" id="%postTemplate%"><span class="noshow">%TIMESTAMP% %USERID% %UPVOTES1%</span><div class="row"><a href="\\singlepost.html?p=%POSTID%"><h3>%POSTTITLE%</h3></a></div><div class="row"><span class="post-user">by %USER%</span><span class="post-date"> %DATE%</span></div><div class="row"><a href="\\singlepost.html?p=%POSTID%"><img  class="post-image" id="post-image" src="%source%" alt="%description%"/></a></div><div class="row"><div onclick="votePost(%POSTID%,1)" class="col-xs-5"><div class="col-xs-2"><img id="%VOTEDUP%" src="/images/up-arrow.svg" alt="up-arrow"></img></div><div class="col-xs-2"><span class="votes" id="%UPID%">%UPVOTES%</span></div></div><div onclick="votePost(%POSTID%,-1)" class="col-xs-5"><div class="col-xs-2"><img id="%VOTEDDOWN%" src="/images/down-arrow.svg" alt="down-arrow"></img></div><div class="col-xs-2"><span class="votes" id="%DOWNID%">%DOWNVOTES%</span></div></div><a href="\\singlepost.html?p=%POSTID%"><div id="comment-image" class="col-xs-2"><span class="glyphicon glyphicon-comment"></span></div></a></div></div>';


var commentTemplate = '<div class="next-comment" id="%commentTemplate%"><div class="user-and-date"><span class="comment-user">%USER%</span><span class="comment-date">%DATE%</span></div><div class="comment-content">%CONTENT%</div><div class="ups-n-downs"><div class="row"><div onclick="voteComment(%COMMENTID%,1)" class="col-xs-6"><div class="col-xs-2"><span id="%VOTEDUP%" class="glyphicon glyphicon-arrow-up"></span></div><div class="col-xs-2"><span class="votes" id="%UPID%">%UPVOTES%</span></div></div><div onclick="voteComment(%COMMENTID%,-1)" class="col-xs-6"><div class="col-xs-2"><span id="%VOTEDDOWN%" class="glyphicon glyphicon-arrow-down"></span></div><div class="col-xs-2"><span class="votes" id="%DOWNID%">%DOWNVOTES%</span></div></div></div></div></div>'

var newCommentTemplate = '<div class="new-comment"><textarea id="new-comment-content" placeholder="Write your comment here..."></textarea><br></br><button type="submit" class="btn btn-default" onclick="createNewComment()">Submit</button></div>'

var accountImage = '<li><a href="#" id="clickableImage"><img src="/images/account.png" alt="account icon" id ="accountIcon" onclick="account()"/></a></li>';

var signinbttn = '<li><button type="button" id="signin-btn" class="btn btn-primary" data-toggle="modal" data-target="#signin-modal">Sign In</button></li>';

var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;
start(8080);


/* TODO::
  --------------Isue list--------------------------------
- loads of comments instead od in batch
- no check for enourmous request trying to do DoS
*/

// QUERIES PREPARED STATEMENTS
var updatePassword = db.prepare("update users set password = ? where username = ?");
var signUpInsert = db.prepare("insert into users (username, userEmail, password, salt) values ( ?, ?, ?, ?)");
var uniqueUserName = db.prepare("select username from users where username=?");
var uniqueEmailName = db.prepare("select userEmail from users where userEmail =?");
var addpers = db.prepare("update users set persistentlogin=? where username=?");
var signin_query = db.prepare("select password, salt from users where username=?");

var singlePostStatement = db.prepare("select * from posts where postID=?");
var commentsStatement = db.prepare("select * from comments where postID = ? order by comUpvotes desc");
var comVotesStatement = db.prepare("select * from votesComments where commentID = ? and username = ?");
var postVotesStatement = db.prepare("select * from votesPosts where postID = ? and username = ?");

var checkUser = db.prepare("select * from users where username = ? and persistentLogin = ?");
var createComVote = db.prepare("insert into votesComments values (?,?,?)");
var updateComVote = db.prepare("update votesComments set voteState = ? where username = ? and commentID = ?");
var deleteComVote = db.prepare("delete from votesComments where username = ? and commentID = ?");
var createPostVote = db.prepare("insert into votesPosts values (?,?,?)");
var updatePostVote = db.prepare("update votesPosts set voteState = ? where username = ? and postID = ?");
var deletePostVote = db.prepare("delete from votesPosts where username = ? and postID = ?");
var retrieveComment = db.prepare("select * from comments where commentID = ?");
var retrievePost = db.prepare("select * from posts where postID = ?");
var updateComment = db.prepare("update comments set comUpvotes = ?,comDownvotes = ? where commentID = ?");
var updatePost = db.prepare("update posts set postUpvotes = ?,postDownvotes = ? where postID = ?");
var checkVotedPost = db.prepare("select * from votesPosts where postID = ? AND username = ?");
var checkVotedComment = db.prepare("select * from votesComments where commentID = ? AND username = ?");

var getmypost = db.prepare("select * from users inner join posts on users.username = posts.username where users.username = ? and users.persistentLogin = ? order by posts.postTimestamp DESC limit ?");
var getmyupost = db.prepare("select * from posts inner join votesPosts on posts.postID = votesPosts.postID where votesPosts.username = ? and votesPosts.voteState = 1 order by posts.postTimestamp DESC limit ?");

var insertPost = db.prepare("insert into posts (postTitle, imageFilename, username, postTimestamp, postTags) values (?, ?, ?, ?, ?)");

var createCommentStatement = db.prepare("insert into comments (postID, username, comTimestamp, content) values (?, ?, ?, ?)");

var searchTagsStatement = "postTags like '%#QUERY#%'";
// Start the http service.  Accept only requests from localhost, for security.
function start(port) {
    types = defineTypes();
    banned = [];
    banUpperCase("./public/", "");
    var service = http.createServer(handle);
    service.listen(port, "localhost");
    var address = "http://localhost";
    if (port != 80) address = address + ":" + port;
    console.log("Server running at", address);
}

// Serve a request by delivering a file.
function handle(request, response) {
    var url = request.url.toLowerCase();
    function dbReady(err, rows){ formatPost(response,err, rows); }
    switch (url) {
      case '/trending':
        //load trending page
        var store = '';
        request.on('data', function(data)
        {
        store += data;
        });
        request.on('end', function()
        {
          getTrendingPostsReady(store);
        });
        function getTrendingPostsReady(myData){
          db.all("select * from posts inner join users on posts.username = users.username order by postUpvotes desc limit 10", dbReady)
          function dbReady(err, rows){ formatPost(response,err,myData, rows); }
        }
        break;

      case '/new':
        // load new page
        var store = '';
        request.on('data', function(data)
        {
        store += data;
        });
        request.on('end', function()
        {
          getNewPostsReady(store);
        });
        function getNewPostsReady(myData){
          db.all("select * from posts inner join users on posts.username = users.username order by postID desc limit 10", dbReady)
          function dbReady(err, rows){ formatPost(response,err,myData, rows); }
        }
        break;

      case '/top':
        //load top page
        var store = '';
        request.on('data', function(data)
        {
        store += data;
        });
        request.on('end', function()
        {
          getTopPostsReady(store);
        });
        function getTopPostsReady(myData){
          db.all("select * from posts inner join users on posts.username = users.username order by postUpvotes desc limit 10", dbReady)
          function dbReady(err, rows){ formatPost(response,err,myData, rows); }
        }
        break;
      case '/?':
        // search
        break;

      case '/signup':
        //does signup maybe change to use formidable????
        var store = '';
        request.on('data', function(data)
        {
        store += data;
        });
        request.on('end', function()
        {
          signUpF(store);
        });
        function signUpF (data) { sign_up(data,response);}
        break;

      case '/signin':
        //does sigin maybe change to use formidable????
        var store = '';
        request.on('data', function(data)
        {
        store += data;
        });
        request.on('end', function()
        {
          signInF(store);
        });
        function signInF (data) { sign_in(data,response);}
        break;

      case '/persignin':
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          persReady(store, response);
        });

        break;

      case '/singlepost':
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          postReady();
        });
        function postReady() {accessDBPosts(store,response);}
        break;

      case '/upload':
        //upload requested use formidable to deal with input data
        var form = new formidable.IncomingForm();
        form.uploadDir =__dirname+"/public/memes"
        form.on('error', function(err) { submitionError(12,response)});
        form.parse(request, uploadReady);
        form.keepExtensions = true;
        function uploadReady(err, fields, files) { upload_step1(err, fields, files,response);}
        break;

      case '/post':
        db.all("select * from posts inner join users on posts.username = users.username where postID = ?",postID, getPost)
        function getPost(err, row){ putPost(response,err, row); }
        break;

      case '/comments':
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          commentReady();
        });
        function commentReady() {accessDBComments(store,response);}
        break;
      case '/change-password':
        console.log("Request received");
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          accountSettingsSignIn(store, response);
        });
        break;
      case '/commentvote':
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          accessDBComVotes(store,response);
        });
        break;

      case '/postvote':
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          accessDBPostVotes(store,response);
        });
        break;
      case '/getmyposts':
        console.log("Received");
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          gmpready(store, response);
        });
        break;
      case '/getmyupvoteposts':
        console.log("Received");
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          gmupready(store, response);
        });
        break;
      case '/createcomment':
        console.log("Received");
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          createCommentReady(store, response);
        });
        break;
      case '/search':
        console.log("Received");
        var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          searchReady(store, response);
        });
        break;

      case '/infiscroll-request':
      var store = '';
        request.on('data', function(data)
        {
          store += data;
        });
        request.on('end', function()
        {
          infinitescrollreq(store, response);
        });
        break;

      default:
        if (url.includes("?")){
          var qMark = url.indexOf("?");
          url = url.substring(0,qMark);
        }
        if (url.endsWith("/")) url = url + "index.html";
        if (isBanned(url)) return fail(response, NotFound, "URL has been banned");
        var type = findType(url);
        if (type == null) return fail(response, BadType, "File type unsupported");
        var file = "./public" + url;
        fs.readFile(file, ready);
        function ready(err, content) { deliver(response, type, err, content); }
        break;
    }
}

// ------ INFINITE scroll
function infinitescrollreq(data, response){
  var incData = JSON.parse(data);
  switch (incData.origin){
    case 'trending':
      db.all("select * from posts inner join users on posts.username = users.username order by postUpvotes desc limit ?",10*incData.loaded, dbReady);
      function dbReady(err, rows){
        rows = rows.slice(10*(incData.loaded-1));
        formatPost(response,err,data, rows);
      }
      break;
    case 'new':
      db.all("select * from posts inner join users on posts.username = users.username order by postID desc limit ?",10*incData.loaded, dbReady)
      function dbReady(err, rows){
        rows = rows.slice(10*(incData.loaded-1));
        formatPost(response,err,data, rows);
      }
      break;
    case 'top':
      db.all("select * from posts inner join users on posts.username = users.username order by postUpvotes desc limit ?",10*incData.loaded, dbReady)
      function dbReady(err, rows){
        rows = rows.slice(10*(incData.loaded-1));
        formatPost(response,err,data, rows);
      }
      break;
    case 'myUp':
      getmyupost.all([incData.username,10*incData.loaded],gmupostsready);
      function gmupostsready(err,row){
        row = row.slice(10*(incData.loaded-1));
        formatPost(response,err,store,row);
      }
      break;
    case 'myP':
      getmypost.all([incData.username, incData.prs,10*incData.loaded], gmpostsready);
      function gmpostsready(err,row){
        row = row.slice(10*(incData.loaded-1));
        formatPost(response,err,data,row);
      }
      break;
  }


}


//----- INFINITE SCROLL end


// --Create Comment
function createCommentReady(store,response){
  var data = JSON.parse(store);
  var username = data.username;
  var prsstring = data.prs;
  checkUser.get([username,prsstring], prsCheck);
  function prsCheck(err,row){
    if (!(row === undefined)){
      var myTimestamp = Date.now();
      createCommentStatement.get([data.postID,username,myTimestamp,data.content],insertComment);
    }
    else {
      console.log("Not Logged In");
    }
  }
  function insertComment(err){getCommentID(err,response);}
}

function getCommentID(err,response){
  db.get("SELECT last_insert_rowid()",useCommentID);
  function useCommentID(err,row){addCommentStart(err,row,response);}
}

function addCommentStart(err,row,response){
  db.get("SELECT * FROM comments where commentID=?",row['last_insert_rowid()'],addCommentToP);
  function addCommentToP(err,row){addCommentToPage(err,row,response);}
}

function addCommentToPage(err,row,response){
  var comments = '';
  var filledComment = commentTemplate.replace("%USER%",row.username);
  var date = (new Date(row.comTimestamp)).toString();
  filledComment = filledComment.replace("%DATE%",date.substring(4,24));
  filledComment = filledComment.replace("%CONTENT%",row.content);
  filledComment = filledComment.replace("%UPVOTES%",row.comUpvotes);
  filledComment = filledComment.replace("%DOWNVOTES%",row.comDownvotes);
  filledComment = filledComment.replace("%COMMENTID%",row.commentID);
  filledComment = filledComment.replace("%COMMENTID%",row.commentID);
  filledComment = filledComment.replace("%commentTemplate%",row.commentID);
  filledComment = filledComment.replace("%UPID%","comup"+row.commentID);
  filledComment = filledComment.replace("%DOWNID%","comdown"+row.commentID);
  filledComment = filledComment.replace("%VOTEDUP%","not-voted-up");
  filledComment = filledComment.replace("%VOTEDDOWN%","not-voted-down");
  comments = comments + filledComment;
  response.writeHead(OK, "text/plain");
  response.write(comments);
  response.end();
}

// Search -------------

function searchReady(store,response){
  var data = JSON.parse(store);
  var queryList = data.searchText.split("+");
  var dbQuery = "";
  if (queryList.length > 0) dbQuery = "select * from posts where ";
  for (var i=0; i<queryList.length;i++){
    if (queryList[i] != ""){
      if(i!=0) dbQuery = dbQuery + " or ";
      dbQuery = dbQuery + searchTagsStatement.replace("#QUERY#",queryList[i]);
    }
  }
  db.all(dbQuery,getResults);
  function getResults(err,rows) {formatPost(response, err, store, rows);}
}

// --------- ACOUNT STUFF --------------------------

function accountSettingsSignIn(store, response){
  console.log("Request started");
  var data = JSON.parse(store);
  if(checkPasswords(data.oldpd,data.p1, data.p2)){
    signin_query.get([data.usr], accountSettingsready);
    function accountSettingsready(err,row){ accountSettings2(err,row,data,response);}
  }
  else{
    var dataresponse = {error_code: 14, err:"<p>Password must be between 8-20 character. Password must contain characters and numbers. Make sure passwords match and that your old password is correct.</p>"};
    accountSettingsresponse(error_code);
  }
}


function checkPasswords(og, p1,p2){
  if( p1 === p2){
    if(p1 !== og){
      if(p1.length > 20 || p1.length < 8){

        return false;
      }
      else if (!(/\d/.test(p1)) || !(/[a-zA-Z]/.test(p1))) {
        return false;
      }
    }
    else{
      return false;
    }
  }
  else{
    return false;
  }
  return true;
}

function accountSettings2(err, row, data,response){
  console.log(err);
  if(err === null){
    if(row != undefined){
      bcrypt.hash(data.oldpd, row.salt, hashready);
      function hashready(err, hash){accountHashCompare(err, hash, row, data, response);}
    }
    else{
      var dataresponse = {error_code: 7, err:"<p>Incorrect password.</p>"};
      accountSettingsresponse(dataresponse,response);
    }
  }
  else{
    var dataresponse = {error_code: 1, err:"<p>We are having some issues with our database please try later.</p>"};
    accountSettingsresponse(dataresponse,response);
  }
}

function accountHashCompare(err, hash, row, data, response ){
  if (err === null){
    if(hash === row.password){
      console.log("User verified");
      bcrypt.hash(data.p1, row.salt,hashready);
      function hashready(err, hash){changepassword(err, hash, data, response);}
    }
    else{
      var dataresponse = {error_code: 8, err:"<p>Incorrect password.</p>" };
      accountSettingsresponse(dataresponse,response);
    }
  }
  else{
    var dataresponse = {error_code: 1, err:"<p>We are having some issues with our database please try later.</p>"};
    accountSettingsresponse(dataresponse,response);
  }
}

function changepassword(err, hash, data, response){
  if(err === null){
    updatePassword.run([hash, data.usr], passwordChangedReady);
    function passwordChangedReady(err) {
      passwordChanged(err,response);
    }
  }
  else{
    var dataresponse = {error_code: 1, err:"<p>We are having some issues with our database please try later.</p>"};
    accountSettingsresponse(dataresponse,response)
  }
}

function passwordChanged(err,response){
  if(err != null){
    var dataresponse = {error_code: 1, err:"<p>We are having some issues with our database please try later.</p>"};
    accountSettingsresponse(dataresponse, response);
  }
  else{
    var dataresponse = {error_code: 0};
    accountSettingsresponse(dataresponse, response);
  }
}

function accountSettingsresponse(data, response){
  var signResponse = JSON.stringify(data);
  var typeHeader = { "Content-Type": "application/json" };
  response.writeHead(OK, typeHeader);
  response.write(signResponse);
  response.end();
}

// ------------------ACCOUNT END--------------------------------

// --Load my posts-----------------------------------------
function gmpready(store, response){
  var data = JSON.parse(store);
  getmypost.all([data.username, data.pstr,10], gmpostsready);
  function gmpostsready(err,row){ formatPost(response,err,store,row);}
}

function gmupready(store, response){
  var data = JSON.parse(store);
  getmyupost.all([data.username,10],gmupostsready);
  function gmupostsready(err,row){ formatPost(response,err,store,row);}
}

function gmpost2(err,rows,response){
  if(err == null){
    if(rows != undefined){
      var posts='';
      for (var i=0; i < rows.length; i++){
        var filledPost = postTemplate.replace("%postTemplate%",rows[i].postTitle);
        filledPost = filledPost.replace("%POSTTITLE%",rows[i].postTitle);
        filledPost = filledPost.replace("%source%",rows[i].imageFilename);
        filledPost = filledPost.replace("%description%",rows[i].postTitle + '(image)');
        filledPost = filledPost.replace("%TIMESTAMP%",row[i].postTimestamp);
        var date = (new Date(rows[i].postTimestamp)).toString();
        filledPost = filledPost.replace("%DATE%",date.substring(4,21));
        filledPost = filledPost.replace("%UPVOTES%",rows[i].postUpvotes);
        filledPost = filledPost.replace("%UPVOTES1%",rows[i].postUpvotes);
        filledPost = filledPost.replace("%DOWNVOTES%",rows[i].postDownvotes);
        filledPost = filledPost.replace("%USER%",rows[i].username);
        filledPost = filledPost.replace("%USERID%",rows[i].username);
        filledPost = filledPost.replace("%POSTID%",rows[i].postID);
        filledPost = filledPost.replace("%POSTID%",rows[i].postID);
        filledPost = filledPost.replace("%UPID%","postup" + rows[i].postID);
        filledPost = filledPost.replace("%DOWNID%","postdown" + rows[i].postID);
        filledPost = filledPost.replace("%UPARROWID%","postuparrow" + rows[i].postID);
        filledPost = filledPost.replace("%DOWNARROWID%","postdownarrow" + rows[i].postID);
        filledPost = filledPost.replace("%LOADCOMMENTS%",'onclick="loadComments('+rows[i].postID+')"');
        posts = posts + filledPost;
      }
      if(posts===''){
        textResponse('<p>You have no posts :(</p>',response);
      }
      else{
        textResponse(posts,response);
      }
    }
    else{
      textResponse('<p>You have no posts :(</p>',response);
    }
  }
  else{
    textResponse('<p>Could not access database sorry.</p>',response);
  }
}

function textResponse(data,response){
  var typeHeader = { "Content-Type": "text/plain" };
  response.writeHead(OK, typeHeader);
  response.write(data);
  response.end();
}




// LOAD my posts end --------------------------------
// persistentLogin check
function persReady(store, response){
  var userData = JSON.parse(store);
  checkUser.get([userData.usr,userData.per],checkUserReady);
  function checkUserReady(err,row){ check_user_pers(err,row,userData,response);}
}

function check_user_pers(err,row,data,response){
  if(err === null && row != undefined){
    if(row.persistentLogin === data.per){
      validSignUp(response,err,data.usr);
    }
    else{
      submitionError(9,response);
    }
  }
  else{
    submitionError(1,response);
  }
}


/// END pers login check
// -------------------------------------- UPLOAD CODE -------------------------

function upload_step1(err, fields, files,response){
  if (err === null){
    if(fields.title.length > 40){
      submitionError(12,response);
      return;
    }
    checkUser.get([fields.user,fields.pstr],checkUserReady);
    function checkUserReady(err,row){ check_user_step1(err,row,fields, files,response);}
  }
  else{
    submitionError(10,response);
  }
}

function check_user_step1(err,row,fields, files,response){
  if(err === null && row != undefined){
    if(row.persistentLogin === fields.pstr){
      upload_step2(fields, files,response);
    }
    else{
      submitionError(9,response);
    }
  }
  else{
    submitionError(1,response);
  }
}

function upload_step2(fields, files,response){
  var filePath = files.image.path.slice(files.image.path.indexOf('memes'));
  var postTitleList = fields.title.split(" ");
  var postTags = "";
  for (var i=0;i<postTitleList.length;i++){
    postTags = postTags + postTitleList[i];
  }
  var descList = fields.description.split(",");
  for (var i=0;i<descList.length;i++){
    postTags = postTags + descList[i];
  }
  filePath ='\\'+ filePath;
  insertPost.run([fields.title,filePath,fields.user, Date.now(),postTags], insertPostReady);
  function insertPostReady(err){ upload_step3(err,fields,response);}
}

function upload_step3(err,fields,response){
  if(err === null){
    submitionError(0,response);
  }
  else{
    submitionError(1,response);
  }
}

//---------------------- UPLOAD END-------------------------------------------//

function accessDBPosts(data,response) {
  var incData = JSON.parse(data);
  var postID = parseInt(incData.postID);
  var myUsername = incData.username
  singlePostStatement.get([postID],getPost);
  function getPost(err, row){putPost(row,postID,myUsername,response,err); }
}

function accessDBComments(data,response) {
  var incData = JSON.parse(data);
  var postID = parseInt(incData.postID);
  var username = incData.username;
  commentsStatement.all([postID], getComments);
  function getComments(err, rows){ putComments(response,username,err, rows); }
}

function accessDBComVotes(data,response) {
  var incData = JSON.parse(data);
  var commentID = parseInt(incData.commentID);
  var username = incData.username;
  var prsstring = incData.prs;
  var voteState = parseInt(incData.voteState);
  var comUps;
  var comDowns;
  var change;
  checkUser.get([username,prsstring], prsCheck);
  function prsCheck(err,row){
    if (!(row === undefined)){
      console.log("SUCCESS :: " + commentID);
      retrieveComment.get([commentID],getCommentData);
    }
    else {
      console.log("FAIL");
      console.log(row);
      console.log(prsstring);
      console.log(username);
    }
  }
  function getCommentData(err,row){
    if (row === undefined) console.log(err);
    else {
      comUps = row.comUpvotes;
      comDowns = row.comDownvotes;
      comVotesStatement.get([commentID,username], getComVotes);
    }
  }
  function getComVotes(err, row){
    if (row === undefined){
      console.log("Undefined, Creating new entry...");
      change = "create";
      createComVote.run([username,commentID,voteState],errorOccured);
      if (voteState === 1){
        comUps++;
        updateComment.run([comUps,comDowns,commentID],errorOccured);
      }
      else{
        comDowns++;
        updateComment.run([comUps,comDowns,commentID],errorOccured);
      }
    }
    else {
      console.log("Defined");
      if (row.voteState === voteState){
        change = "delete";
        console.log("Deleting entry...")
        deleteComVote.run([username,commentID],errorOccured);
        if (voteState === 1){
          comUps--;
          updateComment.run([comUps,comDowns,commentID],errorOccured);
        }
        else{
          comDowns--;
          updateComment.run([comUps,comDowns,commentID],errorOccured);
        }
      }
      else {
        change = "update";
        console.log("Updating entry...")
        updateComVote.run([voteState,username,commentID],errorOccured);
        if (voteState === 1){
          comUps++;
          comDowns--;
          updateComment.run([comUps,comDowns,commentID],errorOccured);
        }
        else{
          comUps--;
          comDowns++;
          updateComment.run([comUps,comDowns,commentID],errorOccured);
        }
      }
    }
    var voteValues = {ups:comUps,downs:comDowns,comID:commentID,voteState:voteState,change:change};
    var voteJson = JSON.stringify(voteValues);
    var typeHeader = { "Content-Type": "application/json" };
    response.writeHead(OK, typeHeader);
    response.write(voteJson);
    response.end();
  }
}

function accessDBPostVotes(data,response) {
  var incData = JSON.parse(data);
  var postID = parseInt(incData.postID);
  var username = incData.username;
  var prsstring = incData.prs;
  var voteState = parseInt(incData.voteState);
  var postUps;
  var postDowns;
  var change;
  var postTitle;
  checkUser.get([username,prsstring], prsCheck);
  function prsCheck(err,row){
    if (row != undefined){
      console.log("SUCCESS :: " + postID);
      retrievePost.get([postID],getPostData);
    }
    else {
      console.log("FAIL");
      console.log(row);
      console.log(prsstring);
      console.log(username);
    }
  }
  function getPostData(err,row){
    if (row === undefined) console.log(err);
    else {
      postUps = row.postUpvotes;
      postDowns = row.postDownvotes;
      postTitle = row.postTitle;
      postVotesStatement.get([postID,username], getPostVotes);
    }
  }
  function getPostVotes(err, row){
    if (row === undefined){
      console.log("Undefined, Creating new entry...");
      change = "create";
      createPostVote.run([username,postID,voteState],errorOccured);
      if (voteState === 1){
        postUps++;
        updatePost.run([postUps,postDowns,postID],errorOccured);
      }
      else{
        postDowns++;
        updatePost.run([postUps,postDowns,postID],errorOccured);
      }
    }
    else {
      console.log("Defined");
      if (row.voteState === voteState){
        console.log("Deleting entry...")
        change = "delete";
        deletePostVote.run([username,postID],errorOccured);
        if (voteState === 1){
          postUps--;
          updatePost.run([postUps,postDowns,postID],errorOccured);
        }
        else{
          postDowns--;
          updatePost.run([postUps,postDowns,postID],errorOccured);
        }
      }
      else {
        console.log("Updating entry...")
        change = "update";
        updatePostVote.run([voteState,username,postID],errorOccured);
        if (voteState === 1){
          postUps++;
          postDowns--;
          updatePost.run([postUps,postDowns,postID],errorOccured);
        }
        else{
          postUps--;
          postDowns++;
          updatePost.run([postUps,postDowns,postID],errorOccured);
        }
      }
    }
    var voteValues = {ups:postUps,downs:postDowns,postID:postID,voteState:voteState,change:change,title:postTitle};
    var voteJson = JSON.stringify(voteValues);
    var typeHeader = { "Content-Type": "application/json" };
    response.writeHead(OK, typeHeader);
    response.write(voteJson);
    response.end();
  }
}

function errorOccured(err){
  //console.log(err);
}



// ----------------------- SIGN IN FUNCTIONS ----------------------------------
//-----------------------------------------------------------------------------
function sign_in(store, response){
  var data = JSON.parse(store);
  db.get("select * from users where username=?",[data.usr], sready);
  function sready(err, row){ singIn_step2(err, row, data, response);}
}

function singIn_step2(err, row, data, response){
  if(err === null){
    if(row != undefined){
      //console.log("hashing password");
      var salt = row.salt;
      var dbhash = row.password;
      bcrypt.hash(data.pwd, salt,hashready);
      function hashready(err, hash){sigIn_hashcompare(err, hash, dbhash, data, response);}
    }
    else{
      submitionError(7, response);
    }
  }
  else{
    submitionError(1 ,response);
  }
}

function sigIn_hashcompare(err, hash, dbhash, data, response){
  if(hash === dbhash){
    validSignUp(response, null, data.usr);
  }
  else{
    submitionError(8,response);
  }
}

//------------------------------------------------------------------------------

// ---------------------------- SIGNUP FUNCTIONS START ------------------------
// ----------------------------------------------------------------------------
function sign_up(store, response){
  var data = JSON.parse(store);
  var verErrors = userDataVerify(data);
  if( verErrors === 0){
    var salt = bcrypt.genSalt(12, saltready);
    function saltready(err, salt){ hashpwd(response, data, salt);}
  }
  else{
    submitionError(varErrors,response);
  }
}

function userDataVerify(data){
  var errors = 0;
  if(data.usr.length > 20 || data.usr.length < 5){
    errors = 2;
  }
  else if(data.pwd.length > 20 || data.pwd.length < 8){
    errors = 6;
  }
  else if (!(/\d/.test(data.pwd)) || !(/[a-zA-Z]/.test(data.pwd))) {
    errors = 6;

  }
  else if(!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(data.mail))){
    errors = 4;
  }
  return errors;
}

function hashpwd(response, data, salt){
  bcrypt.hash(data.pwd, salt,hashready);
  function hashready(err, hashd){ usrCheck(response, data, hashd, salt);}
}

function usrCheck(response, data, hash, salt){
  uniqueUserName.run([data.usr], ready);
  function ready(err, row) { usrCheck1(err, row, data, hash, salt, response); }
}

function usrCheck1(err, row, data, hash, salt, response){
  if (err === null){
    if (row === undefined){
      uniqueEmailName.run([data.mail], ready);
      function ready(error, erow) { emailCheck(error, erow, data, hash, salt, response); }
    }
    else{
      submitionError(3, response);
    }
  }
  else{
    submitionError(1 ,response);
  }
}

function emailCheck (err, row, data, hash, salt, response){
  if (err === null){
    if (row === undefined){
      submitSignUp(response, data, hash, salt);
    }
    else{
      submitionError(5, response);
    }
  }
  else{
    submitionError(1 ,response);
  }
}

function submitSignUp(response, data, result, salt){
  console.log("submitSignUp");
  signUpInsert.run([data.usr, data.mail, result, salt],inserted);
  function inserted(err) { validSignUp(response, err, data.usr); }
}

function validSignUp(response, err, usr){
  if (err === null){
    console.log("creating pers");
    var persLog = randomstring.generate({charset: 'alphanumeric'})
    addpers.run([persLog,usr], ready);
    function ready(err){signupprocessfinished(response, err, persLog, usr);}
  }
  else{
    submitionError(1,response);
  }
}

function signupprocessfinished(response, err, persLog, usr){
  if(err === null){
    var message = {error_code: 0, usr:usr, pers:persLog};
    var signResponse = JSON.stringify(message);
    var typeHeader = { "Content-Type": "application/json" };
    response.writeHead(OK, typeHeader);
    response.write(signResponse);
    response.end();
  }
  else{
    submitionError(1,response);
  }
}

function submitionError (errorCode, response){
  var message = {error_code: errorCode};
  var signResponse = JSON.stringify(message);
  var typeHeader = { "Content-Type": "application/json" };
  response.writeHead(OK, typeHeader);
  response.write(signResponse);
  response.end();
}

// -------- SIGNUP FUNCTIONS FINISHED ------------------------------------------
//------------------------------------------------------------------------------



// Forbid any resources which shouldn't be delivered to the browser.
function isBanned(url) {
    for (var i=0; i<banned.length; i++) {
        var b = banned[i];
        if (url.startsWith(b)) return true;
    }
    return false;
}

function progress(){}
// Find the content type to respond with, or undefined.
function findType(url) {
    var dot = url.lastIndexOf(".");
    var extension = url.substring(dot + 1);
    return types[extension];
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, err, content) {
    if (err) return fail(response, NotFound, "File not found");
    var typeHeader = { "Content-Type": type };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}

function formatPost(response, err,myData, rows){
  var incData = JSON.parse(myData);
  var myUsername = incData.username;
  console.log(myUsername);
  var posts='';
  if (!(rows === undefined)){
    if (!(rows[0] === undefined)){
      checkVotedPost.get([rows[0].postID,myUsername],function (err,row){
        var voted = 0;
        if (row === undefined) voted = 0;
        else {
          voted = row.voteState;
        }
        doOnePost(0,voted);
      });
    }
  }
  else {
    var output = {postData:posts};
    var outputJson = JSON.stringify(output);
    var typeHeader = { "Content-Type": "application/json" };
    response.writeHead(OK, typeHeader);
    response.write(outputJson);
    response.end();
  }
  function doOnePost(index,voted){

    var filledPost = postTemplate.replace("%postTemplate%","post"+rows[index].postID);
    filledPost = filledPost.replace("%POSTTITLE%",rows[index].postTitle);
    filledPost = filledPost.replace("%source%",rows[index].imageFilename);
    filledPost = filledPost.replace("%description%",rows[index].postTitle + '(image)');
    filledPost = filledPost.replace("%TIMESTAMP%",rows[index].postTimestamp);
    var date = (new Date(rows[index].postTimestamp)).toString();
    filledPost = filledPost.replace("%DATE%",date.substring(4,21));
    filledPost = filledPost.replace("%UPVOTES%",rows[index].postUpvotes);
    filledPost = filledPost.replace("%UPVOTES1%",rows[index].postUpvotes);
    filledPost = filledPost.replace("%DOWNVOTES%",rows[index].postDownvotes);
    filledPost = filledPost.replace("%USER%",rows[index].username);
    filledPost = filledPost.replace("%USERID%",rows[index].username);
    filledPost = filledPost.replace("%POSTID%",rows[index].postID);
    filledPost = filledPost.replace("%POSTID%",rows[index].postID);
    filledPost = filledPost.replace("%POSTID%",rows[index].postID);
    filledPost = filledPost.replace("%POSTID%",rows[index].postID);
    filledPost = filledPost.replace("%POSTID%",rows[index].postID);
    filledPost = filledPost.replace("%UPID%","postup" + rows[index].postID);
    filledPost = filledPost.replace("%DOWNID%","postdown" + rows[index].postID);

    if (voted === 0){
      filledPost = filledPost.replace("%VOTEDUP%","not-voted-up");
      filledPost = filledPost.replace("%VOTEDDOWN%","not-voted-down");
    }
    else if (voted === 1){
      filledPost = filledPost.replace("%VOTEDUP%","voted-up");
      filledPost = filledPost.replace("%VOTEDDOWN%","not-voted-down");
    }
    else{
      filledPost = filledPost.replace("%VOTEDUP%","not-voted-up");
      filledPost = filledPost.replace("%VOTEDDOWN%","voted-down");
    }
    posts = posts + filledPost;
    if (index === rows.length-1){
      var output = {postData:posts};
      var outputJson = JSON.stringify(output);
      var typeHeader = { "Content-Type": "application/json" };
      response.writeHead(OK, typeHeader);
      response.write(outputJson);
      response.end();
    }
    else{
      checkVotedPost.get([rows[index+1].postID,myUsername],function (err,row){
        var voted = 0;
        if (row === undefined) voted = 0;
        else {
          voted = row.voteState;
        }
        doOnePost(index+1,voted);
      });
    }
  }
}


function putPost(row,postID,username, response, err){
  var post='';
  checkVotedPost.get([postID,username],function (err,row2){
    var voted = 0;
    if (row2 === undefined) voted = 0;
    else {
      voted = row2.voteState;
    }
    doOnePost(voted);
  });
  function doOnePost(voted){
    var filledPost = postTemplate.replace("%postTemplate%","post"+row.postID);
    filledPost = filledPost.replace("%POSTTITLE%",row.postTitle);
    filledPost = filledPost.replace("%source%",row.imageFilename);
    filledPost = filledPost.replace("%description%",row.postTitle + '(image)');
    var date = (new Date(row.postTimestamp)).toString();
    filledPost = filledPost.replace("%DATE%",date.substring(4,21));
    filledPost = filledPost.replace("%UPVOTES%",row.postUpvotes);
    filledPost = filledPost.replace("%DOWNVOTES%",row.postDownvotes);
    filledPost = filledPost.replace("%USER%",row.username);
    filledPost = filledPost.replace("%POSTID%",row.postID);
    filledPost = filledPost.replace("%POSTID%",row.postID);
    filledPost = filledPost.replace("%POSTID%",row.postID);
    filledPost = filledPost.replace("%POSTID%",row.postID);
    filledPost = filledPost.replace("%UPID%","postup" + row.postID);
    filledPost = filledPost.replace("%DOWNID%","postdown" + row.postID);
    if (voted === 0){
      filledPost = filledPost.replace("%VOTEDUP%","not-voted-up");
      filledPost = filledPost.replace("%VOTEDDOWN%","not-voted-down");
    }
    else if (voted === 1){
      filledPost = filledPost.replace("%VOTEDUP%","voted-up");
      filledPost = filledPost.replace("%VOTEDDOWN%","not-voted-down");
    }
    else{
      filledPost = filledPost.replace("%VOTEDUP%","not-voted-up");
      filledPost = filledPost.replace("%VOTEDDOWN%","voted-down");
    }
    post = post + filledPost;
    var output = {postData:post,postID:postID};
    var outputJson = JSON.stringify(output);
    var typeHeader = { "Content-Type": "application/json" };
    response.writeHead(OK, typeHeader);
    response.write(outputJson);
    response.end();
  }
}

function putComments(response,username, err, rows){
  var comments='';
  if (rows.length > 0){
    checkVotedComment.get([rows[0].commentID,username],function (err,row){
      var voted = 0;
      if (row === undefined) voted = 0;
      else {
        voted = row.voteState;
      }
      doOneComment(0,voted);
    });
  }
  else {
    response.writeHead(OK, "text/plain");
    response.write(comments);
    response.end();
  }
  function doOneComment(index,voted){
    var filledComment = commentTemplate.replace("%USER%",rows[index].username);
    var date = (new Date(rows[index].comTimestamp)).toString();
    filledComment = filledComment.replace("%DATE%",date.substring(4,24));
    filledComment = filledComment.replace("%CONTENT%",rows[index].content);
    filledComment = filledComment.replace("%UPVOTES%",rows[index].comUpvotes);
    filledComment = filledComment.replace("%DOWNVOTES%",rows[index].comDownvotes);
    filledComment = filledComment.replace("%COMMENTID%",rows[index].commentID);
    filledComment = filledComment.replace("%COMMENTID%",rows[index].commentID);
    filledComment = filledComment.replace("%commentTemplate%",rows[index].commentID);
    filledComment = filledComment.replace("%UPID%","comup"+rows[index].commentID);
    filledComment = filledComment.replace("%DOWNID%","comdown"+rows[index].commentID);
    if (voted === 0){
      filledComment = filledComment.replace("%VOTEDUP%","not-voted-up");
      filledComment = filledComment.replace("%VOTEDDOWN%","not-voted-down");
    }
    else if (voted === 1){
      filledComment = filledComment.replace("%VOTEDUP%","voted-up");
      filledComment = filledComment.replace("%VOTEDDOWN%","not-voted-down");
    }
    else{
      filledComment = filledComment.replace("%VOTEDUP%","not-voted-up");
      filledComment = filledComment.replace("%VOTEDDOWN%","voted-down");
    }

    comments = comments + filledComment;

    if (index === rows.length-1){
      response.writeHead(OK, "text/plain");
      response.write(comments);
      response.end();
    }
    else{
      checkVotedComment.get([rows[index+1].commentID,username],function (err,row){
        var voted = 0;
        if (row === undefined) voted = 0;
        else {
          voted = row.voteState;
        }
        doOneComment(index+1,voted);
      });
    }
  }



}


// Give a minimal failure response to the browser
function fail(response, code, text) {
    var textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
}

// Check a folder for files/subfolders with non-lowercase names.  Add them to
// the banned list so they don't get delivered, making the site case sensitive,
// so that it can be moved from Windows to Linux, for example. Synchronous I/O
// is used because this function is only called during startup.  This avoids
// expensive file system operations during normal execution.  A file with a
// non-lowercase name added while the server is running will get delivered, but
// it will be detected and banned when the server is next restarted.
function banUpperCase(root, folder) {
    var folderBit = 1 << 14;
    var names = fs.readdirSync(root + folder);
    for (var i=0; i<names.length; i++) {
        var name = names[i];
        var file = folder + "/" + name;
        if (name != name.toLowerCase()) banned.push(file.toLowerCase());
        var mode = fs.statSync(root + file).mode;
        if ((mode & folderBit) == 0) continue;
        banUpperCase(root, file);
    }
}

// The most common standard file extensions are supported, and html is
// delivered as xhtml ("application/xhtml+xml").  Some common non-standard file
// extensions are explicitly excluded.  This table is defined using a function
// rather than just a global variable, because otherwise the table would have
// to appear before calling start().  NOTE: for a more complete list, install
// the mime module and adapt the list it provides.
function defineTypes() {
    var types = {
        html : "application/xhtml+xml",
        css  : "text/css",
        js   : "application/javascript",
        png  : "image/png",
        gif  : "image/gif",    // for images copied unchanged
        jpeg : "image/jpeg",   // for images copied unchanged
        jpg  : "image/jpeg",   // for images copied unchanged
        svg  : "image/svg+xml",
        json : "application/json",
        pdf  : "application/pdf",
        txt  : "text/plain",
        ttf  : "application/x-font-ttf",
        woff : "application/font-woff",
        aac  : "audio/aac",
        mp3  : "audio/mpeg",
        mp4  : "video/mp4",
        webm : "video/webm",
        ico  : "image/x-icon", // just for favicon.ico
        xhtml: undefined,      // non-standard, use .html
        htm  : undefined,      // non-standard, use .html
        rar  : undefined,      // non-standard, platform dependent, use .zip
        doc  : undefined,      // non-standard, platform dependent, use .pdf
        docx : undefined,      // non-standard, platform dependent, use .pdf
    }
    return types;
}
