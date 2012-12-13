{
  "id": "cryptogram",
  "inputs": [ "src/cryptogram/content.js",
              "src/thirdparty/sjcl.js"],
  "css-inputs": ["gss/style.gss"],
  "css-output-file": "build/chrome-extension/style.css",

  "paths": ["src"],
  "externs": ["externs/sjcl.js", 
              "externs/chrome_extensions.js"],
  "mode": "simple"
}
