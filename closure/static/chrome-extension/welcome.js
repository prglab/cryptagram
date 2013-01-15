document.addEventListener('DOMContentLoaded', function () {

  document.getElementById('agree').addEventListener('click', function(e) { 
    localStorage['user_study'] = 'true';
    window.close();
  });
  
  document.getElementById('disagree').addEventListener('click', function(e) { 
    localStorage['user_study'] = 'false';
    window.close();
  });
});