const fs = require("fs");
const path = require("path");
const config = require("../config/config");

let fileList = [];
let fileMap = {};

/**
 * This checks if all source files are in the translation file
 * @param dirPath
 * @returns {{fileMap, fileList: Array}}
 */

let scanFilesRecursivelyInPath = function(dirPath) {
  let files = fs.readdirSync( dirPath )

  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = elementPath.substr(elementPath.length - 3);

    if (stat.isFile() && (ext === "tsx" || ext === ".ts")) {
      fileList.push(elementPath)
      scanFile(elementPath);
    }
    else if (stat.isDirectory() && config.PATH_EXCLUSIONS[elementPath] === undefined) {
      // console.log( "'%s' is a directory.", elementPath );
      scanFilesRecursivelyInPath(elementPath)
    }
  };

  return {fileMap, fileList}
}

let scanFile = function(filePath) {
  let separator  = '/';
  if (filePath.indexOf('/') === -1 && filePath.indexOf("\\") !== -1) {
    separator = "\\";
  }

  let filenameArr = filePath.split(separator);
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(".ts","").replace(/[^0-9a-zA-Z]/g,'_');

  if (config.FILE_EXCLUSIONS[filename]) { return }

  fileMap[filename] = filePath
}

let hasLine = function(filePath, line) {
  let content = fs.readFileSync(filePath, "utf8")
  return content.indexOf("lang(\"" + line + "\"") > -1 || content.indexOf("lang(\'" + line + '\'') > -1;
}


module.exports = {
  scanFilesRecursivelyInPath,
  hasLine,
}
