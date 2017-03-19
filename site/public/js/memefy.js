"use strict";

var usr = null;
var prsstring = null;

function trending(){
  console.log("Here");
  $.get("/trending",loadPage, "text");
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#trendTag").addClass("active");
  $("#trendingTag").find("a").append('<span class="sr-only">(current)</span>');
}

function newTag(){
  $.get("/new",loadPage, "text");
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#newTag").addClass("active");
  $("#newTag").find("a").append('<span class="sr-only">(current)</span>');
}


function topTag(){
  $.get("/top",loadPage, "text");
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#topTag").addClass("active");
  $("#topTag").find("a").append('<span class="sr-only">(current)</span>');
}

function memeCreator(){
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#memeCreatorTag").addClass("active");
  $("#memeCreatorTag").find("a").append('<span class="sr-only">(current)</span>');
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


function submitSignUp(){
  var username = $("#input-username").val();
  var email = $("#input-email1").val();
  var password = $("#input-password1").val();
  var err_message = "<p>"
  if(username.length > 20 || username.length < 5){
    err_message.concat("Username must be between 5-20 characters. ");
  }
  else if(password.length > 20 || password.length < 8){

    err_message.concat("Password must be between 8-20 characters. ");
  }
  else if (!(/\d/.test(password)) || !(/[a-zA-Z]/.test(password))) {
    err_message.concat("Password must contain at least one letter and one number. ");
  }
  else if(!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))){
    err_message.concat("Invalid email.");
  }

  if(err_message != "<p>"){
    err_message.concat("</p>");
    displayErrorSignUp(err_message);
  }
  else{
    var data = {usr: username, mail: email, pwd:password};
    var datajson = JSON.stringify(data);
    $("#sign-up-error").empty();
    $('#signUp-btn').attr('disabled', true);
    $.ajax({
      type:"POST",
      url:"/signup",
      data:datajson,
      success: signUpDone,
      dataType: "json"
    });
  }
}

function signUpDone(data){
  switch (data.error_code){
    case 0:
      console.log(data);
      $("#signin-modal").modal("toggle");
      usr = data.usr;
      prsstring = data.pers;
      break;
    case 1:
      displayErrorSignUp('<p>Sorry we are having problems connecting to the database.</p>');
      break;
    case 2:
      displayErrorSignUp('<p>Invalid usernme, username must be between 5-20 characters.</p>');
      break;
    case 3:
      displayErrorSignUp('<p>Username already in use.</p>');
      break;
    case 4:
      displayErrorSignUp('<p>Invalid email.</p>');
      break;
    case 5:
      displayErrorSignUp('<p>Email already associated with an account</p>');
      break;
    default:
      displayErrorSignUp('<p>Unknown Error</p>');
      break;
  }
}

function displayErrorSignUp(message){
  $("#sign-up-error").empty();
  $("#sign-up-error").append(message);
}

$( document ).ready(trending);
