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
  "externs": ["externs/sjcl_externs.js", 
              "externs/downloadify_externs.js", 
              "externs/swfobject_externs.js",
              "externs/chrome_extensions.js"],
  "mode": "advanced",
  "jsdoc-html-output-path": "docs"
}