{
  "id": "cryptogram",
  "inputs": [ "src/cryptogram/content.js",
              "src/thirdparty/sjcl.js"],
  "css-inputs": ["gss/style.gss"],
  "css-output-file": "build/chrome-extension/style.css",

  "paths": ["src"],
  "externs": ["externs/sjcl.js", 
              "externs/jquery-1.8.3.min.js",
              "externs/chrome_extensions.js"],
  "mode": "simple"
}
