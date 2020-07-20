let fs = require( 'fs' );
let path = require( 'path' );
let sha1 = require('sha-1');
let replacementHashes = require("../config/replacementHashes")
let ignoreHashes = require("../config/ignoreHashes")
const config = require("../config/config")
const ignore = require("../config/interactiveExclusions")
const extractor = require("./extractor")
const util = require("./util")

let translationLabelData = {}
let stringTots  = [];
let counter = 0;
let keyMatcher = {};
let translationEntries = {};

function parsePathInteractive(dirPath) {
  parsePath(dirPath);
  return translationEntries;
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
      parseFileInteractive(elementPath)
    }
    else if (stat.isDirectory() && config.PATH_EXCLUSIONS[elementPath] === undefined) {
      // console.log( "'%s' is a directory.", elementPath );
      parsePath(elementPath)
    }
  }
}

let parseFileInteractive = function(filePath, ) {
  let content    = fs.readFileSync(filePath, "utf8")
  let equalsStringCheck = /(\S*?[^=<>!])\s?[:=]\s?(['"^}][\s\S]*?['"^}])/gm
  let equalsStringMatches = content.match(equalsStringCheck);

  let separator  = '/';
  if (filePath.indexOf('/') === -1 && filePath.indexOf("\\") !== -1) {
    separator = "\\";
  }

  let filenameArr = filePath.split(separator);
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(/[^0-9a-zA-Z]/g,'_');

  if (config.FILE_EXCLUSIONS[filename]) { return }

  let contentData = {content: content};

  if (equalsStringMatches !== null) {
    let ignoreFields = {key: true, color: true, ellipsizeMode: true, returnKeyType: true, autoCapitalize: true}
    for ( let i = 0; i < equalsStringMatches.length; i++) {
      let match = equalsStringMatches[i];
      let resultArray = [];
      while ((resultArray = equalsStringCheck.exec(match)) !== null) {
        if (ignoreFields[resultArray[1]] === undefined) {
          parseInteractive(resultArray, filename, filePath, contentData)
        }
      }
      stringTots = stringTots.concat(equalsStringMatches);
    }
  }

  if (content != contentData.content) {
    util.makeLanguageCallsShorthand(contentData)
    console.log("Changed ", filePath)
    fs.writeFileSync(filePath, contentData.content);
  }
}


function parseInteractive(resultArray, filename, filePath, contentData) {
  // console.log("key", resultArray[1], "value", resultArray[2])

  let content = resultArray[2];
  for (let i = 0; i < ignore.words.length; i++) {
    let part = content.substr(0,ignore.words[i].length + 1);
    if (part === '"' + ignore.words[i] || part === "'" + ignore.words[i]) {
      // console.log("ignore words")
      return;
    }
  }

  for (let i = 0; i < ignore.keys.length; i++) {
    let part = resultArray[1].substr(0,ignore.keys[i].length + 1);
    if (part === '"' + ignore.keys[i] || part === "'" + ignore.keys[i] || part.substr(0,ignore.keys[i].length) === ignore.keys[i]) {
      // console.log("ignore KEY", resultArray[1], part)
      return;
    }
  }

  let extractData =  extractor.extractAndConvert(content, true, true, true);
  let letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let hazLetters = false;
  let hasSpaces = false;
  let hasUnderscores = false;
  for (let i = 0; i < extractData.text.length; i++) {
    let l = extractData.text[i]
    if (l === '_') { hasUnderscores = true; }
    if (l === ' ') {
      hasSpaces = true;
    }
    if (letters.indexOf(l) !== -1) {
      hazLetters = true;
    }
  }

  if (hazLetters === false || hasUnderscores === true && hasSpaces === false) {
    return
  }

  if (extractData.text === extractData.text.toUpperCase()) {
    // console.log("CAPS")
    return
  }

  let lastSmall = false;
  for (let i = 0; i < extractData.text.length; i++) {
    let l = extractData.text[i];

    if (letters.indexOf(l) !== -1) {
      if (l === l.toUpperCase()) {
        if (lastSmall === true) {
          // console.log("CamelCase", match)
          return;
        }
        lastSmall = false;
      }
      if (l === l.toLowerCase()) {
        lastSmall = true;
      }
    }
    else {
      lastSmall = false;
    }
  }

  if (keyMatcher[resultArray[1]] === undefined) {
    keyMatcher[resultArray[1]] = {t:[],c:0}
  }
  keyMatcher[resultArray[1]].c++;
  keyMatcher[resultArray[1]].t.push(extractData.text);


  counter++;

  let prefix = resultArray[0].split(extractData.parsedText)[0]
  // console.log(prefix)

  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationLabelData, 'label', contentData, false, [prefix,''])
}

function createTranslationFileAndReplaceContents(filename, filePath, extractData, target, targetType, contentData, openWithCurly = false, paddingArray = null) {
  if (target[filename] === undefined) {
    target[filename] = {__filename: filePath}
  }

  // console.log("FILENAME", filename, extractData.parsedText)

  let textKey = util.prepareTextKey(target, filename, extractData.pureText);
  if (textKey === '' || textKey === "_") {
    return;
  }

  target[filename][textKey] = "function() { return " + extractData.text + " }";

  let functionCall = util.getFunctionCall(extractData);

  let replacementContent = '';
  if (openWithCurly) { replacementContent += '{'; }
  replacementContent += 'Languages.' + targetType + '("' + filename + '", "' + textKey + '")' + functionCall;
  if (openWithCurly) { replacementContent += ' }'; }


  let src = extractData.parsedText;
  let targ = replacementContent;
  if (Array.isArray(paddingArray) && paddingArray.length == 2) {
    src = paddingArray[0] + extractData.parsedText + paddingArray[1];
    targ = paddingArray[0] + replacementContent + paddingArray[1];
  }

  let textToPrint = util.padd(filename,20) + " replacing: " +  src + " to " + targ;
  let authHash = sha1(textToPrint);
  if (ignoreHashes[authHash] !== true) {
    console.log(authHash, textToPrint)

    if (replacementHashes[authHash] == true) {
      if (translationEntries[filename] === undefined) {
        translationEntries[filename] = {}
      }
      translationEntries[filename][textKey] = target[filename][textKey];
      console.log("ACTUALLY REPLACING ", textToPrint)
      contentData.content = contentData.content.replace(src, targ);
    }
  }
}

function resetReplacementHashes() {
  fs.writeFileSync('./config/replacementHashes.js', "module.exports = {}");
}

module.exports = {
  parsePathInteractive: parsePathInteractive,
  resetReplacementHashes: resetReplacementHashes
}
