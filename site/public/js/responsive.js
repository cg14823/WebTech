

function openNav()
{
  $(".sidenav").width(250);
}

function closeNav()
{
  $(".sidenav").width(0);
}
$(window).resize(formatPage)
$(document).ready(formatPage)

function formatPage(){
  console.log($(window).width());
  if($(window).width() >= 700)
  {
    $(".openNav").hide();
    $(".account").show();
  }
  else
  {
    $(".openNav").show();
    $(".account").hide();
  }
}
