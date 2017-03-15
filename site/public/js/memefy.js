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

function loadPage(data, status, xhr){
  if (status === "success"){
    $(".post-wrap").empty();
    $(".post-wrap").append(data);
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
  else if(password.length > 20 || password.length < 8){
    displayErrorSignUp(1);
    errors = true;
  }
  else if (!(/\d/.test(password)) || !(/[a-zA-Z]/.test(password))) {
    displayErrorSignUp(2);
    errors = true;
  }
  else if(!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))){
    errors = true;
  }

  if(errors){

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
  console.log("SIGUNPDONE");
  switch (data.error_code){
    case 0:
      $("#signin-modal").modal("toggle");
      break;
    case 1:
      console.log("error1: WRONG EMAIL USERNAME OR PASSWORD");
      break;
    case 2:
      console.log("error2 USER ALREADY EXIST OR EMAIL ALREADY IN USE");
      break;
    case 3:
      console.log("error3: PROBLEM IN SERVER");
      break;
    default:
      break;
  }

}

function displayErrorSignUp(error){
  switch (error) {
    case 0:
      $("#sign-up-error").empty();
      $("#sign-up-error").append("<p>Username must be between 5 and 20 characters</p>")
      break;
    case 1:
      $("#sign-up-error").empty();
      $("#sign-up-error").append("<p>Password must be between 8 and 20 characters</p>")
      break;
    case 2:
      $("#sign-up-error").empty();
      $("#sign-up-error").append("<p>Password must contain characters and digits</p>")
      break;
  }
}

$( document ).ready(trending);
