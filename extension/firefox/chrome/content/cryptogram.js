var cryptogram = {
    dbgtag: "cryptogram : ",
  
    run: function() {
      alert("Cryptogram is running");
    },
  
    init: function() {
      var contextMenu = document.getElementById("contentAreaContextMenu");
        if (contextMenu){
            contextMenu.addEventListener("popupshowing", this.showCryptogramMenuEntry, false);
        }
    },
  
    showCryptogramMenuEntry: function (event)
    {
      var show = document.getElementById("cryptogram-context-decrypt");
      show.hidden = !(gContextMenu.onImage);
    },
    
    decrypt: function () {
        alert("Decrypt button pressed");
        var img = gContextMenu.target;
        if (img !== undefined){
          if (img.src !== undefined){
            img.src = "fake";
            alert("decrypt button pressed");
          }
          // Debug
          else {
              alert("Decrypt image is being shown in a nonsense context");         
          }
        }
    }

}





window.addEventListener("load", function() { cryptogram.init(); }, false);
