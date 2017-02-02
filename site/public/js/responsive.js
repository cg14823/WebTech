var sideNavImg = '<div class="col-sx-2" id="side-nav-ic"><img src="http://placehold.it/50x100" alt="sideMenuImg"/></div>'
var accountImg = '<div class="col-sx-2 com-md-offset-4" id ="account-ic"><img src="http://placehold.it/50x100" alt="accountImage"/></div>'

$(window).resize(resizing)

function resizing(){
  if ($(window).width() >= 770) {
      if($('#account-ic').length === 0){
        $('#header').append(accountImg);
      }
      if($('#side-nav-ic').length > 0){
        $('#side-nav-ic').remove();
      }
  }
  else{
    if($('#account-ic').length > 0){
      $('#account-ic').remove();
    }
    if($('#side-nav-ic').length === 0){
      $('#header').prepend(sideNavImg);
    }
  }
}
