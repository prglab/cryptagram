document.addEventListener('DOMContentLoaded', function () {

  document.getElementById('agree').addEventListener('click', function(e) {
    localStorage['user_study'] = 'true';
    var d = new Date();
    var img = new Image();
    img.src = "http://cryptagr.am?ts=" + d.getTime() + "&sev=info&msg=WELCOME_CONSENT_GIVEN";
    img.onerror = function () {
      window.close();
    };
  });

  document.getElementById('disagree').addEventListener('click', function(e) {
    localStorage['user_study'] = 'false';
    window.close();
  });
});