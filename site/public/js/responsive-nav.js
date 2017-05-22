"use strict";

$(window).resize( beresponsivem8);
$(window).ready(beresponsivem8);

function beresponsivem8(){
  var width = $(document).width();
  if (width < 750){ change2logo(); changesmalldropmenu();}
  else if (width < 920) {change2logo();changebigdropmenu();}
  else if (width >= 920) bigscreen();


}

function change2logo(){
  $("#homelogo").attr("src", "/images/logo50x50.svg");
}

function change2band(){
  $("#homelogo").attr("src", "/images/banner-logo.svg");
}

function changesmalldropmenu(){
  $("#upload").empty();
  $("#account-btn").remove();
  $("#dropdown-account").remove();
  $("#account-list-el").empty();
  $("#account-list-el").append(smallAccount);
  $("#upTag").remove()
  $("#tabs").append(smallUp);
  inlineSearch();
}
function changebigdropmenu(){
  $("#upTag").remove();
  $("#upload").empty();
  $("#upload").append(fullUp);
  $("#dropdown-account").remove();
  $("#account-btn").remove();
  $("#account-list-el").empty();
  $("#account-list-el").append(fullaccount);
  fullSearch();
}

function inlineSearch(){
  $("#search-nav").empty();
  $("#search-nav").append(smallSearch);
}

function fullSearch(){
  $("#search-nav").empty();
  $("#search-nav").append(bigSearch);
}

function bigscreen(){
  change2band();
  changebigdropmenu();
}

var fullUp = '<a id="ref-wrap" href ="/upload.html"><button type="button" id ="upload-button" class="btn btn-default">Upload</button></a>';
var smallUp = '<li id="upTag"><a href="/upload.html">Upload</a></li>';
var fullaccount = '<div class="btn-group" id="account-btn"><button type="button"  class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Account <span class="caret"></span></button><ul class="dropdown-menu"><li><a href="/myupvoteposts.html">Upvoted</a></li><li><a href="/myposts.html">My posts</a></li><li><a href="/account.html">Change password</a></li><li role="separator" class="divider"></li><li onclick="signout()"><a href="#">Sign out</a></li></ul></div>';
var bigSearch='<div id ="nav-search"><span class="search-form"><input type="text" class="form-control" id="searchInput" placeholder="Search"/></span><span class="search-button"><button type="submit" class="btn btn-default">Search</button></span></div>';
var smallAccount ='<a class="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false" id="dropdown-account"> Account <span class="caret"></span></a><ul class="dropdown-menu"> <li><a href="/myupvoteposts.html">Upvoted</a></li><li><a href="/myposts.html">My posts</a></li><li><a href="/account.html">Change password</a></li> <li role="separator" class="divider"></li><li onclick="signout()"><a href="#">Sign out</a></li></ul>';
var smallSearch='<div class="row" id="inline-search"><div class="col-xs-8"><input class="form-control" type="text" id="searchInput" placeholder="Search"/></div><div class="cl-xs-3"><button type="submit" class="btn btn-default">Search</button></div></div>';
