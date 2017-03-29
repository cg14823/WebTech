"use strict";

var usr = null;
var prsstring = null;

function uploadSubmit (){
  if( usr === null || prsstring === null){
    alert("You must be signed in to upload");
  }
  else{

    var fname = $("#post-file-input").val();
    var tl = $("#post-title-input").val();
    var ds = $("#post-description-input").val();
    console.log( $('#post-file-input')[0].files[0]);
    var formData = new FormData();
    formData.append('title',tl);
    formData.append('description',ds);
    formData.append('filepath',fname);
    formData.append('user',usr);
    formData.append('pstr',prsstring);
    formData.append('image', $('#post-file-input')[0].files[0]);
    console.log(formData);

    $.ajax({
      url: "/upload",
      type: "POST",
      data: formData,
      mimeType: "multipart/form-data",
      contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
      processData: false,
      success: uploadSuccess,
      dataType:"json"
    });
  }
}

function uploadSuccess(data){
  alert(data.error_code);
}

function checkLogged(){
  if( usr === null || prsstring === null){
    var usrCookie = readCookie("username");
    var pstr = readCookie("pstr");
    if(usrCookie != "" && pstr != ""){
      /* TODO: send data to verify to server, if valid give new pstr if invalid log of*/
      usr = usrCookie;
      prsstring = pstr;
      $('#signin-list-el').hide();
      $('#account-list-el').show();
      $('#upload-button').prop('disabled', false);
    }
    else{
      $('#account-list-el').hide();
      $('#signin-list-el').show();
      $('#upload-button').prop('disabled', true);
    }
  }
  else{
    $('#signin-list-el').hide();
    $('#account-list-el').show();
    $('#upload-button').prop('disabled', false);
  }
}
function trending(){
  //checkLogged();
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
  //checkLogged();
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
  //checkLogged();
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
  //checkLogged();
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
  $("#memeCreatorTag").addClass("active");
  $("#memeCreatorTag").find("a").append('<span class="sr-only">(current)</span>');
}

function singlePost(mypostID){
  var data = {postID: mypostID};
  var datajson = JSON.stringify(data);

  $.ajax({
    type:"POST",
    url:"/singlepost",
    data:datajson,
    success: loadSinglePage,
    dataType: "text"
  });
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
}

function loadComments(mypostID) {
  var data = {postID: mypostID};
  var datajson = JSON.stringify(data);
  $.ajax({
    type:"POST",
    url:"/comments",
    data:datajson,
    success: writeComments,
    dataType: "text"
  });
  $("#tabs").find(".sr-only").remove();
  $("#trendTag").removeClass();
  $("#newTag").removeClass();
  $("#topTag").removeClass();
  $("#memeCreatorTag").removeClass();
}

function loadPage(data, status, xhr){
  //checkLogged();
  if (status === "success"){
    $(".post-wrap").empty();
    $(".single-post").empty();
    $(".the-comments").empty();
    $(".post-wrap").append(data);
  }
}
function writeComments(data){
  $(".the-comments").empty();
  $(".the-comments").append(data);
}

function loadSinglePage(data){
  var incData = JSON.parse(data);
  $(".post-wrap").empty();
  $(".single-post").empty();
  $(".the-comments").empty();
  $(".single-post").append(incData.postData);
  loadComments(incData.postID);
}

function voteComment(mycommentID,vote){
  var data = {commentID: mycommentID,voteState: vote,username: usr, prs: prsstring};
  var datajson = JSON.stringify(data);
  $.ajax({
    type:"POST",
    url:"/commentvote",
    data:datajson,
    success: updateCommentVotes,
    dataType: "text"
  });
}

function votePost(mypostID,vote){
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

function updateCommentVotes(data){
    var incData = JSON.parse(data);
    var ups = '#comup' + incData.comID;
    var downs = '#comdown' + incData.comID;
    var uparrow = '#comuparrow' + incData.comID;
    var downarrow = '#comdownarrow' + incData.comID;
    $(ups).empty();
    $(downs).empty();
    $(ups).append(incData.ups);
    $(downs).append(incData.downs);
    if (incData.voteState === 1){
      switch (incData.change){
        case 'create':
          $(uparrow).css("color","blue");
          break;

        case 'delete':
          $(uparrow).css("color","black");
          break;

        case 'update':
          $(uparrow).css("color","blue");
          $(downarrow).css("color","black");
          break;
      }
    }
    else {
      switch (incData.change){
        case 'create':
          $(downarrow).css("color","red");
          break;

        case 'delete':
          $(downarrow).css("color","black");
          break;

        case 'update':
          $(downarrow).css("color","red");
          $(uparrow).css("color","black");
          break;
      }
    }
}

function updatePostVotes(data){
    var incData = JSON.parse(data);
    var ups = '#postup' + incData.postID;
    var downs = '#postdown' + incData.postID;
    var uparrow = '#postuparrow' + incData.postID;
    var downarrow = '#postdownarrow' + incData.postID;
    $(ups).empty();
    $(downs).empty();
    $(ups).append(incData.ups);
    $(downs).append(incData.downs);
    if (incData.voteState === 1){
      switch (incData.change){
        case 'create':
          $(uparrow).css("color","blue");
          break;

        case 'delete':
          $(uparrow).css("color","black");
          break;

        case 'update':
          $(uparrow).css("color","blue");
          $(downarrow).css("color","black");
          break;
      }
    }
    else {
      switch (incData.change){
        case 'create':
          $(downarrow).css("color","red");
          break;

        case 'delete':
          $(downarrow).css("color","black");
          break;

        case 'update':
          $(downarrow).css("color","red");
          $(uparrow).css("color","black");
          break;
      }
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

function documentready(){
  checkLogged();
  if($("#post-wrap").is(":empty")){
    trending();
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

$( document ).ready(documentready);
