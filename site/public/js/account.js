"use strict";

var usr = null;
var prsstring = null;

function checkLogged(){
  console.log("CHECKING...");
  if( usr === null || prsstring === null){
    var usrCookie = readCookie("username");
    var pstr = readCookie("pstr");
    if(usrCookie === "" || pstr === ""){
      alert("DONT MESS WITH THE CODE");
    }
    else{
      usr =usrCookie;
      prsstring = pstr;
    }
  }
  else{
    alert("DONT MESS WITH THE CODE");
  }
}

function changePassword(){
  var ogpassword = $("#oldp-input").val();
  var p1 = $("#newp-input").val();
  var p2 = $("#cp-input").val();
  var err = checkPasswords(ogpassword,p1,p2);
  if (err === "<p></p>" && usr != null){
    console.log("Here2");
    var data = {usr: usr, oldpd: ogpassword, p1:p1,p2:p2};
    var datajson = JSON.stringify(data);
    $("#sign-up-error").empty();
    $.ajax({
      type:"POST",
      url:"/change-password",
      data:datajson,
      success: passwordChangeDone,
      dataType: "json"
    });
    console.log("password change request sent");
  }
  else{
    $(".error-box").clear();
    $(".error-box").append(err);
  }

}

function checkPasswords(og, p1,p2){
  var err_message ="<p>"
  if( p1 === p2){
    if(p1 != og){
      if(p1.length > 20 || p1.length < 8){

        err_message.concat("Password must be between 8-20 characters.");
      }
      else if (!(/\d/.test(p1)) || !(/[a-zA-Z]/.test(p1))) {
        err_message.concat("Password must contain at least one letter and one number. ");
      }
    }
    else{
      return '<p>New password can not be the same as the old one</p>';
    }
  }
  else{
    return '<p>Passwords do not match</p>';
  }
  return err_message.concat('</p>');
}

function signout(){
  usr = null;
  prsstring = null;
  document.cookie = "expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "username=;";
  document.cookie = "pstr=;";
  checkLogged();
}




function passwordChangeDone(data){
  switch (data.error_code){
    case 0:
      alert("Password changed");
      break;
    default:
      $(".error-box").empty();
      $(".error-box").append(data.err);
      break;
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

$( document ).ready(checkLogged);
