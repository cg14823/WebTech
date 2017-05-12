"use strict";

var lastScroll = 0;
var sensitivity = 10;
$( document ).scroll(infi_scroll)

function infi_scroll(){
  var scrollTop = $(document).scrollTop();
  var windowHeight = $(window).height();
  var bodyHeight = $(document).height() - windowHeight;
  var scrollPercentage = (scrollTop / bodyHeight);
  if(scrollPercentage > 0.9 && scrollTop > lastScroll && $(".infiloader").length===0) {
    console.log($("#post-wrap").children().length);
    //post loaded in 10s so if the number of post is not a mulyiple of ten do not do request
    if($("#post-wrap").children().length % 10 === 0){

      var loadId = $(".identifer").attr("id");
      console.log(loadId);
      switch (loadId){
        case 'trending':
          var posts = $("#post-wrap").children();
          var posts =$(posts[posts.length-1]).children()[1];
          console.log(posts);
          break;
        case 'new':
          break;
        case 'top':
          break;
        case 'myUp':
          break;
        case 'myP':
          break;
        case 'search':
          break;
      }
    }
  }
  lastScroll =scrollTop;
}
