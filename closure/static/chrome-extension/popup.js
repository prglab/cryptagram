var page = chrome.extension.getBackgroundPage();

document.addEventListener('DOMContentLoaded', function () {
  
  var settings = page.cryptagram.extension.settings;
    
  for (i = 0; i < settings.length; i++) {
    var setting = settings[i][0];
    var checkboxName = "checkbox_" + setting;
    if (localStorage[setting] == null) {
      localStorage[setting] = page.cryptagram.extension.settings[i][1];
    }
     
    var settingCheckbox = document.getElementById(checkboxName);
    settingCheckbox.checked = (localStorage[setting] == "true" ? true : false);
    settingCheckbox.setting = setting;
    
    settingCheckbox.addEventListener('change', function(e) { 
      localStorage[this.setting] = this.checked;
    });
  }
});
