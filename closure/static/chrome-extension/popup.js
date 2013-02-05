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
    
      if (this.setting == 'user_study' && this.checked) {
        settingCheckbox.checked = false;
                
        chrome.tabs.getSelected(null, function(tab) {
          var tabParts = tab.url.split("/");
          var popupParts = document.URL.split("/");
          
          // Check if we're already on the consent page
          if (tabParts[0] == "chrome-extension:" && tabParts[2] == popupParts[2]) {
            return;
          }
          
          page.cryptagram.RemoteLog.simpleLog('POPUP_CONSENT');
          chrome.tabs.create({
            url: 'welcome.html'
          });
        });
        
      } else {
         localStorage[this.setting] = this.checked;
      }
    });
  }
});
