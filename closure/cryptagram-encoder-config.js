{
  "id": "cryptagram",
  "inputs": [ "src/closure/renaming_map.js",
              "src/cryptagram/draganddrophandler.js",
              "src/cryptagram/encoder.js",
              "src/cryptagram/experiment.js",
              "src/cryptagram/reductionestimator.js",
              "src/cryptagram/sizereducer.js",
              "src/thirdparty/sjcl.js",
              "src/thirdparty/jszip.js",
              "src/thirdparty/downloadify.js",
              "src/thirdparty/swfobject.js",
              "soy/demo.soy",
              "soy/experiment.soy"],
  "paths": ["src"],
  "externs": ["externs/sjcl.js",
              "externs/downloadify.js",
              "externs/swfobject.js",
              "externs/chrome_extensions.js"],
  "mode": "SIMPLE",                // RAW, WHITESPACE, SIMPLE, ADVANCED.
  "jsdoc-html-output-path": "docs"
}
