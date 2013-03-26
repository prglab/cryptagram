var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-31876253-2'],
            ['_trackPageview'],
            ['b._setAccount', 'UA-31876253-1'],
            ['b._setDomainName', '.prglab.org'],
            ['b._trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();
  
  

function showPlay(show) {

  var modal = document.getElementById("modal");
  var video = document.getElementById("video");
  
  if (show) {
    modal.style.display = "block";  
    video.play();
  } else {
    modal.style.display = "none";
    video.pause();
    video.currentTime = 0;
  }
  
}
