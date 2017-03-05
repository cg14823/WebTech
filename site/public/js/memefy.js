"use strict";

function trending(){
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#trendTag").addClass("active");
  $("#trendingTag").find("a").append('<span class="sr-only">(current)</span>')
}

function newTag(){
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#newTag").addClass("active");
  $("#newTag").find("a").append('<span class="sr-only">(current)</span>')
}


function topTag(){
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#topTag").addClass("active");
  $("#topTag").find("a").append('<span class="sr-only">(current)</span>')
}

function memeCreator(){
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#memeCreatorTag").addClass("active");
  $("#memeCreatorTag").find("a").append('<span class="sr-only">(current)</span>')
}
