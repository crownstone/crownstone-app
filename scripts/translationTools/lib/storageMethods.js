let fs = require( 'fs' );
let util = require("./util")

function stringifyAndStore(translationData, filename) {
  let resultString = 'export default {\n';
  let indent = "  "
  let keys = Object.keys(translationData);
  keys.sort();

  let keySizeMax = 0;
  keys.forEach((key) => {
    let source = translationData[key]
    let subKeys = Object.keys(source);
    subKeys.forEach((subKey) => {
      keySizeMax = Math.max(keySizeMax, subKey.length)
    })
  })

  keys.forEach((key) => {
    resultString += indent + key + ":{\n"
    let source = translationData[key]
    let subKeys = Object.keys(source);
    subKeys.forEach((subKey) => {
      if (subKey === "__filename") {
        resultString += indent + indent + util.padd(subKey + ":", keySizeMax + 1) + " \"" + String(source[subKey]) + "\",\n"
      }
      else if (subKey === "__stringSameAsBaseLanguage") {
        resultString += indent + indent + subKey + ": {\n"
        Object.keys(source[subKey]).forEach((sameCheck) => {
          resultString += indent + indent + indent + util.padd(sameCheck + ":", keySizeMax + 1) + source[subKey][sameCheck] +",\n"
        });
        resultString += indent + indent + "},\n"
      }
      else {
        resultString += indent + indent + util.padd(subKey + ":", keySizeMax + 1) + " " + String(source[subKey]).replace("function ()", "function()") + ",\n"
      }
    })
    resultString += indent + "},\n"
  })

  resultString += "}";

  fs.writeFileSync(filename, resultString);
}

function getTranslationFileAsData(path) {
  let __dataBlob = {};
  let content = fs.readFileSync(path, "utf8");
  content = content.replace("export default {", "__dataBlob = {");
  eval(content);

  Object.keys(__dataBlob).forEach((file) => {
    Object.keys(__dataBlob[file]).forEach((key) => {
      if (typeof __dataBlob[file][key] === "function") {
        __dataBlob[file][key] = String(__dataBlob[file][key]).replace("function ()", "function()")
      }
      else {
        // __dataBlob[file][key] = JSON.stringify()
      }
    })
  });

  return __dataBlob
}


module.exports = {stringifyAndStore, getTranslationFileAsData}