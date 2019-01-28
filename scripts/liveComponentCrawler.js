/**
 * This script will update components to live components if they use a force update.
 * @type {any}
 */

let fs = require( 'fs' );
let path = require( 'path' );
let startPath = "../js";

const EXCLUSIONS = {
  'DebugIconSelection': true,
  'LiveComponent': true,
  'IconDebug': true
}


let parsePath = function(dirPath) {
  let files = fs.readdirSync( dirPath )

  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = elementPath.substr(elementPath.length - 3);

    if (stat.isFile() && (ext === "tsx")) {
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
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(/[^0-9a-zA-Z]/g,'_');

  if (EXCLUSIONS[filename]) { return }

  if (content.indexOf('LiveComponent') !== -1) {
    console.log("SKIPPING: ", filePath);
    return
  }



  if (content.indexOf('forceUpdate') !== -1) {
    content = content.replace("extends Component<", "extends LiveComponent<")
    let placer = ''
    let pathArr = filePath.split("/");
    for (let i = 0; i < pathArr.length - 4; i++) {
      placer += '../'
    }

    let importLine = 'import { LiveComponent }          from "' + placer + 'LiveComponent";\n'
    content = importLine + content;
    // console.log( filePath, importLine)
    console.log("REPLACING:", filePath)
  }


  // console.log(contentData)
  fs.writeFileSync(filePath, content);
}


parsePath(startPath)


