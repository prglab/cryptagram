{
  "id": "cryptogram",
  "inputs": [ "src/cryptogram/demo.js",
              "src/thirdparty/sjcl.js",
              "src/thirdparty/jszip.js", 
              "src/thirdparty/downloadify.js",
              "src/thirdparty/swfobject.js",
              "soy/demo.soy"],
  "css-inputs": ["gss/style.gss"],
  "css-output-file": "build/demo/style.css",
  "paths": ["src", "soy"],
  "externs": ["externs/sjcl.js", 
              "externs/downloadify.js", 
              "externs/swfobject.js",
              "externs/chrome_extensions.js"],
  "mode": "simple",
  "prettyPrint": "yes",
  "jsdoc-html-output-path": "docs"
}