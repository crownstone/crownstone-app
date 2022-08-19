/**
 * This script will update components to live components if they use a force update.
 * @type {any}
 */

let fs = require( 'fs' );
let path = require( 'path' );
let startPath = "../app/ts/database/reducers";
const EXCLUSIONS = {

}

let actionTypes = {}

let parsePath = function(dirPath) {
  let files = fs.readdirSync( dirPath )
  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = path.extname(elementPath)
    if (stat.isFile() && (ext === ".ts")) {
      parseFile(elementPath);
    }
    else if (stat.isDirectory()) {
      // console.log( "'%s' is a directory.", elementPath );
      parsePath(elementPath)
    }
  };
}


let parseFile = function(filePath) {
  let content = fs.readFileSync(filePath, "utf8")

  let filenameArr = filePath.split("/");
  let filename = filenameArr[filenameArr.length-1].replace(".ts","").replace(/[^0-9a-zA-Z]/g,'_');
  if (EXCLUSIONS[filename]) { return }

  let regex = new RegExp(/case\s['"](\w*)/g);

  for (let match of content.matchAll(regex)) {
    actionTypes[match[1]] = true;
  }
}


parsePath(startPath)

// padd the type string with spaces at the end so the total size is the maxLength
function pad(str, maxLength) {
  while (str.length < maxLength) {
    str += " ";
  }
  return str;
}

let types = Object.keys(actionTypes);
types.sort()
let maxLength = 0;
for (let type of types) {
  maxLength = Math.max(maxLength, type.length);
};

for (let type of types) {
  console.log(pad(`${"'"}${type}${"'"}`, maxLength+2),"|")
}


