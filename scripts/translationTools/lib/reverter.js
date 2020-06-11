let fs = require( 'fs' );
let path = require( 'path' );
let util = require("./util");
let config = require("../config/config");
let extractor = require("./extractor");

const LANGUAGE_FILE_PATH = '../../js/'

let success = true;

let translationData = {};

let fileList = [];
let fileMap = {}


let revertFile = function(filePath, allowReplace, BASE) {
  let content    = fs.readFileSync(filePath, "utf8")
  let filenameArr = filePath.split("/");
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(/[^0-9a-zA-Z]/g,'_');

  if (BASE[filename] === undefined) { return }
  Object.keys(BASE[filename]).forEach((key) => {
    if (key == '__filename') { return; }

    let value = BASE[filename][key].substr(20);
    value = value.substr(0, value.length-2);

    content = content.replace("lang(\"" + key + "\")", value);
  })
  if (allowReplace) {
    fs.writeFileSync(filePath, content);
  }
}


function revertTranslation(dirPath, BASE) {
  return parseFilesRecursivelyInPathForReverting(dirPath, BASE)
}


let parseFilesRecursivelyInPathForReverting = function(dirPath, BASE) {
  let files = fs.readdirSync( dirPath )

  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = elementPath.substr(elementPath.length - 3);

    if (stat.isFile() && (ext === "tsx")) {
      fileList.push(elementPath)
      revertFile(elementPath, true, BASE);
    }
    else if (stat.isDirectory()) {
      // console.log( "'%s' is a directory.", elementPath );
      parseFilesRecursivelyInPathForReverting(elementPath, BASE)
    }
  };

  return {fileMap, fileList, translationData, success}
}

module.exports = {revertTranslation}