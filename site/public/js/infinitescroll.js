"use strict";

var lastScroll = 0;
var sensitivity = 10;
var loading = false;

$( document ).scroll(infi_scroll)

function infi_scroll(){
  var scrollTop = $(document).scrollTop();
  var windowHeight = $(window).height();
  var bodyHeight = $(document).height() - windowHeight;
  var scrollPercentage = (scrollTop / bodyHeight);
  if(scrollPercentage > 0.9 && scrollTop > lastScroll && (lastScroll/bodyHeight) < 0.9 && $(".infiloader").length >= 0) {
    //post loaded in 10s so if the number of post is not a mulyiple of ten do not do request
    if($("#post-wrap").children().length % 10 === 0){
      $("#loader-text").attr("class","centeredShow");
      var loadId = $(".identifier").attr("id");
      var posts = $("#post-wrap").children();
      var detail =$($(posts[posts.length-1]).children()[0]).text().split(" ");
      switch (loadId){
        case 'trending':
          var data = {origin:loadId, upvotes:parseInt(detail[2]),loaded:$("#post-wrap").children().length,username:usr};
          requestMorePosts(JSON.stringify(data));
          break;
        case 'new':
          var data = {origin:loadId, timestamp:parseInt(detail[0]),loaded:$("#post-wrap").children().length,username:usr};
          requestMorePosts(JSON.stringify(data));
          break;
        case 'top':
          var data = {origin:loadId, upvotes:parseInt(detail[2]),loaded:$("#post-wrap").children().length,username:usr};
          requestMorePosts(JSON.stringify(data));
          break;
        case 'myUp':
          var val = $("#filter").val();
          var data = {origin:loadId, timestamp:parseInt(detail[2]), user:detail[1],loaded:$("#post-wrap").children().length,username:usr,filter:val};
          requestMorePosts(JSON.stringify(data));
          break;
        case 'myP':
          var val = $("#filter").val();
          var data = {origin:loadId, user:detail[1],loaded:$("#post-wrap").children().length,username:usr,prs:prsstring,filter:val};
          requestMorePosts(JSON.stringify(data));
          break;
      }
    }
    else {
      $("#loader-text").text("NO MORE POSTS");
      $("#loader-text").attr("class","centeredShow");
    }
  }
  lastScroll = scrollTop;
}

function requestMorePosts(data){
  $.ajax({
    type:"POST",
    url:"/infiscroll-request",
    data:data,
    success:loadnewposts,
    dataType: "text"
  });
}
function loadnewposts(data){
  var posts = JSON.parse(data);
  if (posts.postData != ""){
    $("#loader-text").attr("class","noShow");
    $("#post-wrap").append(posts.postData);
  }
  else {
    $("#loader-text").text("NO MORE POSTS");
    $("#loader-text").attr("class","centeredShow");
  }

}
