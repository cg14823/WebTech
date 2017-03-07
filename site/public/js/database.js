"use strict";
var sql = require("sqlite3");
var db = new sql.Database("../../memedatabase.db");
var postTemplate = '<div class="post" id="%postTemplate%"><div class="row"><h3>%POSTTITLE%</h3></div><div class="row"><img class="img-responsive" src="%source%" alt="%description%"/></div><div class="row"><div class="col-xs-4"><h4>UPVOTE</h4></div><div class="col-xs-4"><h4>DOWNVOTE</h4></div><div class="col-xs-4"><h4>COMMENT</h4></div></div></div>';

function get10Post(){
  console.log("getData reached");
  db.all("select top 10 * from posts order by postTimestamp asc", format10post);
}

function format10post(err, rows){
  console.log("putData reached");
  for (var entry in rows){
    var filledPost = postTemplate.replace("%postTemplate%",entry.postID);
    filledPost = filledPost.replace("%POSTTITLE%",entry.postTitle);
    filledPost = filledPost.replace("%source%",entry.imageFilename);
    filledPost = filledPost.replace("%description%",entry.postTitle + '(image)');
    append(append10Post);
  }
}

function append10Post(post){
  console.log("appenPost reached");
  $(".post-wrap").append(post);
}

function show(err, rows) {
  if (err) throw err;
  for (var i = 0;i<rows.length;i++){
    console.log(rows[i].postTitle);
  }
}


function get10Post(content,responses){
  db.all("select top 10 * from posts order by postTimestamp asc", dataload);
  function dataload(err, rows){ format10post(err,rows,content, responses)}
}

function format10post(err, rows, content, responses){
  var posts='';
  for (var entry in rows){
    var filledPost = postTemplate.replace("%postTemplate%",entry.postID);
    filledPost = filledPost.replace("%POSTTITLE%",entry.postTitle);
    filledPost = filledPost.replace("%source%",entry.imageFilename);
    filledPost = filledPost.replace("%description%",entry.postTitle + '(image)');
    post = post + filledPost;
  }
  var loadingPoint = content.search('post-wrap">') + 11;
  content = content.substring(0,loadingPoint) + post + content.substring(loadingPoint);
}
