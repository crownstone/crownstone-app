
const prettier = require("prettier");

let fs = require( 'fs' );
let path = require( 'path' );
let startPath = "../js";


let parsePath = function(dirPath) {
  let files = fs.readdirSync( dirPath )

  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = elementPath.substr(elementPath.length - 3);

    if (stat.isFile() && (ext === "tsx")) {
      if (parseFile(elementPath)) {
        break;
      }
    }
    else if (stat.isDirectory()) {
      // console.log( "'%s' is a directory.", elementPath );
      parsePath(elementPath)
    }
  };
}



let parseFile = function(filePath) {
  let content    = fs.readFileSync(filePath, "utf8")

  let options = {
    printWidth:200,
    trailingComma:'es5',
    bracketSpacing: false,
    arrowParens:'always',
    parser:'typescript',
  }

  let prettyContent = prettier.format(content, options)
  // console.log(prettyContent)
  fs.writeFileSync(filePath, content);
  console.log("Finished", counter++, filePath)
}

let counter = 0;
parsePath(startPath)
