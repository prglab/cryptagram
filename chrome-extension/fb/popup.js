var bg = chrome.extension.getBackgroundPage();
var saveCheck = null;
var autoCheck = null;


document.addEventListener('DOMContentLoaded', function () {
  
  if (!localStorage['auto_password']) {
      localStorage['auto_password'] = true;
  }

  if (!localStorage['auto_decrypt']) {
      localStorage['auto_decrypt'] = true;
  }
  
  saveCheck = document.getElementById("saveCheck");
  saveCheck.checked = (localStorage['auto_password'] == "true" ? true : false);  
  saveCheck.addEventListener('change', saveChanged);

  autoCheck = document.getElementById("autoCheck");
  autoCheck.checked = (localStorage['auto_decrypt'] == "true" ? true : false);
  autoCheck.addEventListener('change', autoChanged);
});

  
function saveChanged(e) {
  localStorage["auto_password"] = document.getElementById("saveCheck").checked;
}  
 
function autoChanged(e) {
  localStorage["auto_decrypt"] = document.getElementById("autoCheck").checked;
}