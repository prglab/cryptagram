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
  
  

var lastDemo = -1;

function showDemo(demoNumber) {

  var animation = document.getElementById('animation');
  animation.innerHTML = "";
  
  if (lastDemo == demoNumber) {
    lastDemo = -1;
  } else {
    
    if (demoNumber == 0) {
      animation.innerHTML = "<hr><img src=decode.gif>";
    } else if (demoNumber == 1) {
      animation.innerHTML = "<hr><img src=encode.gif>";
    }
    lastDemo = demoNumber;
  }
}

function setPlayOpacity(o) {
  var plays = document.getElementsByClassName('play');
  for (var p = 0; p < plays.length; p++) {
    plays[p].style.opacity = o; 
  }
}

function init() {
  var hash = window.location.hash;
  if (hash == "#decode") {
    showDemo(0);
  } else if (hash == "#encode") {
    showDemo(1);
  }
}

