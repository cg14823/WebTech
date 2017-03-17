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
var fs = require("fs");
var sql = require("sqlite3");
var bcrypt = require('bcryptjs');
var db = new sql.Database("memedatabase.db");

var postTemplate = '<div class="post" id="%postTemplate%"><div class="row"><h3>%POSTTITLE%</h3></div><div class="row"><span class="post-user">by %USER%</span><span class="post-date"> %DATE%</span></div><div class="row"><img class="post-image" id="post-image" src="%source%" alt="%description%"/></div><div class="row"><div class="col-xs-5"><div class="col-xs-2"><span class="glyphicon glyphicon-arrow-up"></span></div><div class="col-xs-10"><span class="votes">%UPVOTES%</span></div></div><div class="col-xs-5"><div class="col-xs-2"><span class="glyphicon glyphicon-arrow-down"></span></div><div class="col-xs-10"><span class="votes">%DOWNVOTES%</span></div></div><div class="col-xs-2"><span class="glyphicon glyphicon-comment"></span></div></div></div>';

var OK = 200, NotFound = 404, BadType = 415, Error = 500;
var types, banned;
start(8080);


// QUERIES PREPARED STATEMENTS
var signUpInsert = db.prepare("insert into users (username, userEmail, password, salt, persistentlogin) values ( ?, ?, ?, ?, ?)");

var uniqueUserName = db.prepare("select username from users where username =?");
var uniqueEmailName = db.prepare("select userEmail from users where userEmail =?");

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
    switch (url) {
      case '/trending':
        //load trending page
        db.all("select * from posts inner join users on posts.userID = users.userID order by postUpvotes desc limit 10", dbReady)
        function dbReady(err, rows){ formatPost(response,err, rows); }
        break;

      case '/new':
        // load new page
        db.all("select * from posts inner join users on posts.userID = users.userID order by postID desc limit 10", dbReady)
        function dbReady(err, rows){ formatPost(response,err, rows); }
        break;

      case '/top':
        //load top page
        db.all("select * from posts inner join users on posts.userID = users.userID order by postUpvotes desc limit 10", dbReady)
        function dbReady(err, rows){ formatPost(response,err, rows); }
        break;
      case '/?':
        // search
        break;
      case '/signup':
        var store = '';
        console.log("signup case");
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
      case '/home':
        break;

      default:
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

function sign_up(store, response){
  console.log("sign _up ");
  var data = JSON.parse(store);
  console.log(store);

  var verErrors = userDataVerify(data);
  if( verErrors === 0){
    var salt = bcrypt.genSaltSync(12);
    bcrypt.hash(data.pwd, salt,ready);
    function ready(err, hashd){ usrCheck(response, data, hashd, salt);}
  }
  else{
    submitionError(varErrors,response);
  }
}

function usrCheck(response, data, hash, salt){
  console.log("usrCheck");
  uniqueUserName.run([data.usr], ready);
  function ready(err, row) { usrCheck1(err, row, data, hash, salt, response); }
}

function usrCheck1(err, row, data, hash, salt, response){
  if (err === null){
    console.log("usrCheck1");
    if (row === undefined){
      console.log("usrCheck1.1");
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
  function inserted(err) { validInsert(response, err); }

}

function submitionError (errorCode, response){
  var message = {error_code: errorCode};
  var signResponse = JSON.stringify(message);
  console.log(signResponse);
  var typeHeader = { "Content-Type": "application/json" };
  response.writeHead(OK, typeHeader);
  response.write(signResponse);
  response.end();
}

function validSignUp(respose){
  
}

function validInsert(response, error){
  if(error === null){
    submitionError(0,response);
  }
  else{
    submitionError(1,response);
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

function formatPost(response, err, rows){
  var posts='';
  for (var i=0; i < rows.length; i++){
    var filledPost = postTemplate.replace("%postTemplate%",rows[i].postTitle);
    filledPost = filledPost.replace("%POSTTITLE%",rows[i].postTitle);
    filledPost = filledPost.replace("%source%",rows[i].imageFilename);
    filledPost = filledPost.replace("%description%",rows[i].postTitle + '(image)');
    var date = (new Date(rows[i].postTimestamp)).toString();
    filledPost = filledPost.replace("%DATE%",date.substring(4,21));
    filledPost = filledPost.replace("%UPVOTES%",rows[i].postUpvotes);
    filledPost = filledPost.replace("%DOWNVOTES%",rows[i].postDownvotes);
    filledPost = filledPost.replace("%USER%",rows[i].username);
    posts = posts + filledPost;
  }
  response.writeHead(OK, "text/plain");
  response.write(posts);
  response.end();
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
