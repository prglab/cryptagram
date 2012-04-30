var bg = chrome.extension.getBackgroundPage();
var saveCheck = null;
var autoCheck = null;


document.addEventListener('DOMContentLoaded', function () {
  
  saveCheck = document.getElementById("saveCheck");
  saveCheck.checked = (localStorage['save_passwords'] == "true" ? true : false);  
  saveCheck.addEventListener('change', saveChanged);

  autoCheck = document.getElementById("autoCheck");
  autoCheck.checked = (localStorage['auto_decrypt'] == "true" ? true : false);
  autoCheck.addEventListener('change', autoChanged);
});

  
function saveChanged(e) {
  localStorage["save_passwords"] = document.getElementById("saveCheck").checked;
}  
 
function autoChanged(e) {
  localStorage["auto_decrypt"] = document.getElementById("autoCheck").checked;
}