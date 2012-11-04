var cryptogramFirefox = {
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
        console.log("Check");
        var img = gContextMenu.target;
        if (img !== undefined){
          if (img.src !== undefined){
            //img.src = "fake";
            //alert("decrypt button pressed");
            var pass = prompt("Please enter a password for this image", "cryptogram");
            console.log(cryptogram.decryptByURL);
            console.log(cryptogram);
            cryptogram.decryptByURL(img.src, pass); 
            console.log("Post-decode");
          }
          // Debug
          else {
              alert("Decrypt image is being shown in a nonsense context");         
          }
        }
    }

}





window.addEventListener("load", function() { cryptogramFirefox.init(); }, false);
