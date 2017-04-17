"use strict";

var usr = null;
var prsstring = null;

function documentready(){
  $('#account-list-el').hide();
  checkLogged();
  if($("#post-wrap").is(":empty")){
    trending();
  }
}

function uploadSubmit (){
  if( usr === null || prsstring === null){
    alert("You must be signed in to upload");
  }
  else{

    var fname = $("#post-file-input").val();
    var tl = $("#post-title-input").val();
    var ds = $("#post-description-input").val();
    if (tl.length > 40){
      alert("title can only be 40 characters long");
      return;
    }
    if($('#post-file-input')[0].files[0].size / 1024 > 1000){
      alert("Image can only be 1mB");
      return
    }

    var formData = new FormData();
    formData.append('title',tl);
    formData.append('description',ds);
    formData.append('filepath',fname);
    formData.append('user',usr);
    formData.append('pstr',prsstring);
    formData.append('image', $('#post-file-input')[0].files[0]);


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
  switch (data.error_code) {
    case 0:
      alert("Your meme was uploaded.");
      break;
    default:
      alert("Sorry our servers can not deal with your meme powers :(");
      break;
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

function checkPersistent(data){
  if(data.error_code==0){
    usr = data.usr;
    prsstring = data.pers;
    var pstrcookie ="pstr=" +prsstring+";"
    document.cookie = pstrcookie;
    $('#signin-list-el').hide();
    $('#account-list-el').show();
    $('#upload-button').prop('disabled', false);
  }
}

function trending(){
  //checkLogged();

  var data = {username: usr, prs: prsstring};
  var datajson = JSON.stringify(data);
  $.ajax({
    type:"POST",
    url:"/trending",
    data:datajson,
    success: loadPage,
    dataType: "text"
  });
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

  var data = {username: usr, prs: prsstring};
  var datajson = JSON.stringify(data);
  $.ajax({
    type:"POST",
    url:"/new",
    data:datajson,
    success: loadPage,
    dataType: "text"
  });
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

  var data = {username: usr, prs: prsstring};
  var datajson = JSON.stringify(data);
  $.ajax({
    type:"POST",
    url:"/top",
    data:datajson,
    success: loadPage,
    dataType: "text"
  });
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
  var data = {postID: mypostID,username: usr, prs: prsstring};
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
  var data = {postID: mypostID,username: usr};
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

function loadPage(data){
  //checkLogged();
  var incData = JSON.parse(data);
  $("#post-wrap").empty();
  $(".post-wrap").append(incData.postData);
}
function writeComments(data){
  $(".the-comments").empty();
  $(".the-comments").append(data);
}

function loadSinglePage(data){
  var incData = JSON.parse(data);
  $("#post-wrap").empty();
  $(".single-post").empty();
  $(".the-comments").empty();
  $(".single-post").append(incData.postData);
  $("#comment-image").empty();
  loadComments(incData.postID);
}

function voteComment(mycommentID,vote){
  if (usr != null && prsstring != null){
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

function createNewComment(){
  var input = $("#new-comment-content").val();
  $(".new-comment").remove();
  console.log(input);
}

function updateCommentVotes(data){
    var incData = JSON.parse(data);
    var ups = '#comup' + incData.comID;
    var downs = '#comdown' + incData.comID;
    var commentTitleID = '#'+incData.comID;
    $(ups).empty();
    $(downs).empty();
    $(ups).append(incData.ups);
    $(downs).append(incData.downs);
    if (incData.voteState === 1){
      switch (incData.change){
        case 'create':
          $(commentTitleID).find("#not-voted-up").each(function(){
            $(this).attr("id","voted-up");
          });
          break;

        case 'delete':
          $(commentTitleID).find("#voted-up").each(function(){
            $(this).attr("id","not-voted-up");
          });
          break;

        case 'update':
          $(commentTitleID).find("#not-voted-up").each(function(){
            $(this).attr("id","voted-up");
          });
          $(commentTitleID).find("#voted-down").each(function(){
            $(this).attr("id","not-voted-down");
          });
          break;
      }
    }
    else {
      switch (incData.change){
        case 'create':
          $(commentTitleID).find("#not-voted-down").each(function(){
            $(this).attr("id","voted-down");
          });
          break;

        case 'delete':
          $(commentTitleID).find("#voted-down").each(function(){
            $(this).attr("id","not-voted-down");
          });
          break;

        case 'update':
          $(commentTitleID).find("#not-voted-down").each(function(){
            $(this).attr("id","voted-down");
          });
          $(commentTitleID).find("#voted-up").each(function(){
            $(this).attr("id","not-voted-up");
          });
          break;
      }
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

function submitSignIn(){
  var username = $("#input-usr").val();
  var password = $("#input-password").val();

  var data = {usr: username, pwd:password};
  var datajson = JSON.stringify(data);
  $("#sign-up-error").empty();
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

$( document ).ready(documentready);
