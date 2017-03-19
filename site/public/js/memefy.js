"use strict";



function trending(){
  console.log("Here");
  $.get("/trending",loadPage, "text");
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#trendTag").addClass("active");
  $("#trendingTag").find("a").append('<span class="sr-only">(current)</span>')
}

function newTag(){
  $.get("/new",loadPage, "text");
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#newTag").addClass("active");
  $("#newTag").find("a").append('<span class="sr-only">(current)</span>')
}


function topTag(){
  $.get("/top",loadPage, "text");
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

function singlePost(postID){
  console.log("It worked");
  $.get("/post/"+postID,loadSinglePage, "text");
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
}

function loadComments(postID) {
  console.log("It worked2");
  $.get("/post/comments/"+postID,writeComments, "text");
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
}

function loadPage(data, status, xhr){
  console.log("suceeSS1");
  if (status === "success"){
    $(".post-wrap").empty();
    $(".single-post").empty();
    $(".the-comments").empty();
    $(".post-wrap").append(data);
  }
}
function writeComments(data, status, xhr){
  console.log("suceeSS3");
  if (status === "success"){
    $(".the-comments").empty();
    $(".the-comments").append(data);
    console.log("suceeSS4");
  }
}

function loadSinglePage(data, status, xhr){
  console.log("suceeSS2");
  if (status === "success"){
    $(".post-wrap").empty();
    $(".single-post").empty();
    $(".the-comments").empty();
    $(".single-post").append(data);
  }
}

function signUp(){
  var errors = false;
  var username = $("#input-username").val();
  var email = $("#input-email1").val();
  var password = $("#input-password1").val();

  if(username.length > 20 || username.length < 5){
    displayErrorSignUp(0);
    errors = true;
  }
  if(password.length > 20 || password.length < 8){
    if (!(/\d/.test(password) && /[a-zA-Z]/.test(password))) {
      displayErrorSignUp(1);
      errors = true;
    }
  }
  if(errors){

  }
  else{

  }
}

function displayErrorSignUp(error){
  switch (error) {
    case 0:
      $("#sign-up-error").empty();
      $("#sign-up-error").append("<p>username must be between 5 and 20 characters</p>")
      break;
    case 1:
      $("#sign-up-error").empty();
      $("#sign-up-error").append("<p>password must be between 8 and 20 characters and must contains letters and numbers</p>")
      break;

  }
}

$( document ).ready(trending);
