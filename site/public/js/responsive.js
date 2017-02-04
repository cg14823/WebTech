

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
  if($(window).width() >= 760)
  {
    $("#openNav").hide();
    $(".account").show();
    $(".liveT").show();
  }
  else
  {
    $("#openNav").show();
    $(".account").hide();
    $(".liveT").hide();
  }
}
