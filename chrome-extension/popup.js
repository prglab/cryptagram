var bg = chrome.extension.getBackgroundPage();
var settings = ['save_passwords', 'auto_decrypt', 'album_passwords'];

document.addEventListener('DOMContentLoaded', function () {
  
  for (i = 0; i < settings.length; i++) {
    var setting = settings[i];
    var checkboxName = "checkbox_" + setting;
    //bg.console.log("Checking " + checkboxName + "/" + localStorage[setting]);
    if (localStorage[setting] == null) {
      localStorage[setting] = "true";
    }
    var settingCheckbox = document.getElementById(checkboxName);
    settingCheckbox.checked = (localStorage[setting] == "true" ? true : false);
    settingCheckbox.setting = setting;
    settingCheckbox.addEventListener('change', function(e) { 
      localStorage[this.setting] = this.checked;
    });
  }
});

