{
  "id": "cryptogram",
  "inputs": [ "src/cryptogram/demo.js",
              "src/thirdparty/sjcl.js",
              "src/thirdparty/jszip.js", 
              "src/thirdparty/downloadify.js",
              "src/thirdparty/swfobject.js",
              "soy/demo.soy"],
  "css-inputs": ["gss/style.gss"],
  "css-output-file": "style.css",
  "paths": ["src", "soy"],
  "externs": ["externs/sjcl-externs.js", 
              "externs/downloadify-externs.js", 
              "externs/swfobject-externs.js",
              "externs/chrome_extensions.js"],
  "mode": "advanced",
  "jsdoc-html-output-path": "docs"
}