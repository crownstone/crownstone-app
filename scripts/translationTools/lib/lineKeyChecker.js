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

let parseFilesRecursivelyInPath = function(dirPath, BASE) {
  let files = fs.readdirSync( dirPath )

  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = elementPath.substr(elementPath.length - 3);

    if (stat.isFile() && (ext === "tsx")) {
      fileList.push(elementPath)
      parseFile(elementPath, false, BASE);
    }
    else if (stat.isDirectory()) {
      // console.log( "'%s' is a directory.", elementPath );
      parseFilesRecursivelyInPath(elementPath, BASE)
    }
  };

  return {fileMap, fileList, translationData, success}
}


let parseFile = function(filePath, allowReplace, BASE) {
  let content    = fs.readFileSync(filePath, "utf8")
  let proposedFilenameRegex  = /Languages\.get\("(.*)"/gm
  let labelRegex  = /lang\(['"](.*?)['"].*?\)/gm

  let labelMatches = content.match(labelRegex);
  let filenameMatches = content.match(proposedFilenameRegex);

  let filenameArr = filePath.split("/");
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(/[^0-9a-zA-Z]/g,'_');

  if (config.FILE_EXCLUSIONS[filename]) { return }

  let filenameForTranslation = null;

  if (filenameMatches !== null) {
    for ( let i = 0; i < filenameMatches.length; i++) {
      let match = filenameMatches[i];
      let resultArray = [];
      while ((resultArray = proposedFilenameRegex.exec(match)) !== null) {
        filenameForTranslation = resultArray[1];
        break;
      }
    }
  }

  if (labelMatches !== null) {
    if (filenameForTranslation !== filename) {
      console.log("Warning: file", filename, " is not using it's own filename as translation key but:", filenameForTranslation)
      success = false;
    }

    if (!filenameForTranslation) {
      console.log("ERR: NO TRANSLATION FILE IS REFERENCED!", filename)
      success = false;
      return;
    }

    for ( let i = 0; i < labelMatches.length; i++) {
      let match = labelMatches[i];
      let resultArray = [];
      while ((resultArray = labelRegex.exec(match)) !== null) {
        let key = resultArray[1];
        if (BASE[filenameForTranslation] === undefined) {
          if (BASE['__UNIVERSAL'][key] === undefined) {
            console.log("MISSING FILE ENTRY", filename, key)
            success = false;
          }
        }
        else {
          if (BASE[filenameForTranslation][key] === undefined) {
            if (BASE['__UNIVERSAL'][key] === undefined) {
              console.log("MISSING KEY", key, "in", filename)
              success = false;
            }
          }
        }
      }
    }
  }
}

function checkLineElements(dirPath, BASE) {
  return parseFilesRecursivelyInPath(dirPath, BASE)
}


module.exports = {checkLineElements}