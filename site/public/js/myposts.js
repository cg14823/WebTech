"use strict";

var usr = null;
var prsstring = null;

$( document ).ready(documentready);

function documentready(){
  $('#account-list-el').hide();
  checkLogged();
}

function filter_changed(){
  var val = $("#filter").val();
  $("#post-wrap").empty();
  var datajson = JSON.stringify({username:usr, pstr:prsstring,filter:val});
  $.ajax({
    type:"POST",
    url:"/getmyposts",
    data:datajson,
    success:loadMyposts,
    dataType: "text"
  });
}

function requestMyposts(){
  console.log("REQUESTING");
  var val = $("#filter").val();
  var datajson = JSON.stringify({username:usr, pstr:prsstring,filter:val});
  $.ajax({
    type:"POST",
    url:"/getmyposts",
    data:datajson,
    success:loadMyposts,
    dataType: "text"
  });
}

function loadMyposts(data){
  var posts = JSON.parse(data);
  $("#post-wrap").append(posts.postData);
}

function checkPersistent(data){
  if(data.error_code==0){
    usr = data.usr;
    prsstring = data.pers;
    var pstrcookie ="pstr=" +prsstring+";"
    document.cookie = pstrcookie;
    $('#signin-list-el').hide();
    $('#account-list-el').show();
    $('#upload-button').prop('disabled', false);
    if($("#post-wrap").is(":empty")){
      requestMyposts();
      $("#no-posts").empty();
    }
  }
}

function checkLogged(){
  console.log("CHECKING...");
  if( usr === null || prsstring === null){
    var usrCookie = readCookie("username");
    var pstr = readCookie("pstr");
    if(usrCookie != "" && pstr != ""){
      console.log("Checking user");
      var data ={usr:usrCookie, per: pstr};
      var datajson = JSON.stringify(data);
      $.ajax({
        type:"POST",
        url:"/persignin",
        data:datajson,
        success:checkPersistent,
        dataType: "json"
      });
    }
    else{
      $('#account-list-el').hide();
      $('#signin-list-el').show();
      $('#upload-button').prop('disabled', true);
    }
  }
  else{
    console.log("NO USER");
    $('#signin-list-el').hide();
    $('#account-list-el').show();
    $('#upload-button').prop('disabled', false);
  }
}


function submitSignIn(){
  var username = $("#input-usr").val();
  var password = $("#input-password").val();

  var data = {usr: username, pwd:password};
  var datajson = JSON.stringify(data);
  $("#sign-up-error").empty();
  $('#signUp-btn').attr('disabled', true);
  $.ajax({
    type:"POST",
    url:"/signin",
    data:datajson,
    success: signUpDone,
    dataType: "json"
  });
}

function signout(){
  usr = null;
  prsstring = null;
  document.cookie = "expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "username=;";
  document.cookie = "pstr=;";
  checkLogged();
}

function votePost(mypostID,vote){
  if (usr != null && prsstring != null){
    var data = {postID: mypostID,voteState: vote,username: usr, prs: prsstring};
    var datajson = JSON.stringify(data);
    $.ajax({
      type:"POST",
      url:"/postvote",
      data:datajson,
      success: updatePostVotes,
      dataType: "text"
    });
  }
}


function updatePostVotes(data){
    var incData = JSON.parse(data);
    var ups = '#postup' + incData.postID;
    var downs = '#postdown' + incData.postID;
    var postTitleID = '#post'+incData.postID;
    $(ups).empty();
    $(downs).empty();
    $(ups).append(incData.ups);
    $(downs).append(incData.downs);
    if (incData.voteState === 1){
      switch (incData.change){
        case 'create':
          $(postTitleID).find("#not-voted-up").each(function(){
            $(this).attr("id","voted-up");
          });
          break;

        case 'delete':
          $(postTitleID).find("#voted-up").each(function(){
            $(this).attr("id","not-voted-up");
          });
          break;

        case 'update':
          $(postTitleID).find("#not-voted-up").each(function(){
            $(this).attr("id","voted-up");
          });
          $(postTitleID).find("#voted-down").each(function(){
            $(this).attr("id","not-voted-down");
          });
          break;
      }
    }
    else {
      switch (incData.change){
        case 'create':
          $(postTitleID).find("#not-voted-down").each(function(){
            $(this).attr("id","voted-down");
          });
          break;

        case 'delete':
          $(postTitleID).find("#voted-down").each(function(){
            $(this).attr("id","not-voted-down");
          });
          break;

        case 'update':
          $(postTitleID).find("#not-voted-down").each(function(){
            $(this).attr("id","voted-down");
          });
          $(postTitleID).find("#voted-up").each(function(){
            $(this).attr("id","not-voted-up");
          });
          break;
      }
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
      $("#signin-modal").modal("toggle");
      usr = data.usr;
      prsstring = data.pers;
      checkLogged();

      var usrcookie ="username=" +usr+";"
      var pstrcookie ="pstr=" +prsstring+";"
      var tomorrow = new Date();

      tomorrow.setTime(tomorrow.getTime() + 24*60*60*1000);
      var expireT = "expires="+tomorrow.toUTCString()+";";

      document.cookie = usrcookie;
      document.cookie = pstrcookie;
      document.cookie = expireT;

      break;
    case 1:
      displayErrorSignUp('<p>Sorry we are having problems connecting to the database.</p>',1);
      break;
    case 2:
      displayErrorSignUp('<p>Invalid usernme, username must be between 5-20 characters.</p>',1);
      break;
    case 3:
      displayErrorSignUp('<p>Username already in use.</p>',1);
      break;
    case 4:
      displayErrorSignUp('<p>Invalid email.</p>',1);
      break;
    case 5:
      displayErrorSignUp('<p>Email already associated with an account</p>',1);
      break;
    case 6:
      displayErrorSignUp('<p>Invalid password</p>',1);
      break;
    case 7:
      displayErrorSignUp('<p>Unkown username</p>',2);
      break;
    case 8:
      displayErrorSignUp('<p>Incorrect password</p>',2);
      break;
    default:
      displayErrorSignUp('<p>Unknown Error</p>',2);
      break;
  }
}


function displayErrorSignUp(message, errorBox){
  switch (errorBox) {
    case 1:
      $("#sign-up-error").empty();
      $("#sign-up-error").append(message);
      break;
    case 2:
      $("#sign-in-error").empty();
      $("#sign-in-error").append(message);
      break
  }

}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
