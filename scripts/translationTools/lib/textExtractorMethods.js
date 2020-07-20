let fs = require( 'fs' );
let path = require( 'path' );
let util = require("./util");
let config = require("../config/config");
let extractor = require("./extractor");

const LANGUAGE_FILE_PATH = '../../js/'


let translationData = {};

let fileList = [];
let fileMap = {}

let parseFilesRecursivelyInPath = function(dirPath) {
  let files = fs.readdirSync( dirPath )

  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    // Make one pass and make the file complete
    let elementPath = path.join( dirPath, file );
    let stat = fs.statSync(elementPath)
    let ext = elementPath.substr(elementPath.length - 3);

    if (stat.isFile() && (ext === "tsx")) {
      fileList.push(elementPath)
      parseFile(elementPath, false);
    }
    else if (stat.isDirectory() && config.PATH_EXCLUSIONS[elementPath] === undefined) {
      // console.log( "'%s' is a directory.", elementPath );
      parseFilesRecursivelyInPath(elementPath)
    }
  };

  return {fileMap, fileList, translationData}
}

let clearTranslationData = function() {
  translationData = {};
}


let parseFile = function(filePath, allowReplace) {
  let content    = fs.readFileSync(filePath, "utf8")
  let textRegex  = /<Text[^>]*?>([^<]*?)<\/Text>/gm
  // let alertRegex = /Alert\.alert\(([\s\S]*?)\)/gm
  let alertRegex = /Alert\.alert\(([\s\S]*?),[\s\S]*?,[\s\S]*?\][\s\S]*?\)/gm
  let labelRegex = /{[^{]*?(abel:([^}]*))/gm
  let titleRegex = /title:(.*)[\s^}]*/gm
  let reactLabelRegex = /[\s]([^\s=]*?)={(["'][^"']*?["'])}/gm
  // let equalsStringCheck = /[^=!<>][:=]\s?([^}].*)/gm

  let textMatches  = content.match(textRegex);
  let alertMatches = content.match(alertRegex);
  let labelMatches = content.match(labelRegex);
  let titleMatches = content.match(titleRegex);
  let reactLabelMatches = content.match(reactLabelRegex);
  // let equalsStringMatches = content.match(reactLabelRegex);

  let separator  = '/';
  if (filePath.indexOf('/') === -1 && filePath.indexOf("\\") !== -1) {
    separator = "\\";
  }

  let filenameArr = filePath.split(separator);
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(/[^0-9a-zA-Z]/g,'_');

  if (config.FILE_EXCLUSIONS[filename]) { return }

  // insert the import line if it is not already there.
  let importLine = 'import { Languages } from "';
  let filePathRelative = filePath.replace(LANGUAGE_FILE_PATH, "")
  let pathArr = filePathRelative.split("/");

  // the last element is the filename
  for (let i = 0; i < pathArr.length - 1; i++) {
    importLine += '../'
  }
  importLine += 'Languages"\n'

  let functionConstruction = `
${importLine}
function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("${filename}", key)(a,b,c,d,e);
}
`;
  if (allowReplace) {
    if (content.indexOf(importLine) === -1) {
      content = importLine + content;
      content = content.replace(importLine, functionConstruction)
    }
  }

  let contentData = {content: content};

  if (reactLabelMatches !== null) {
    let ignoreFields = {key: true, color: true, ellipsizeMode: true, returnKeyType: true, autoCapitalize: true, pointerEvents: true, resizeMode: true, groupTypes: true}
    for ( let i = 0; i < reactLabelMatches.length; i++) {
      let match = reactLabelMatches[i];
      let resultArray = [];
      while ((resultArray = reactLabelRegex.exec(match)) !== null) {
        if (ignoreFields[resultArray[1]] === undefined) {
          let f3 = resultArray[2].substr(1,3);
          let f4 = resultArray[2].substr(1,4);
          if (f3 === "c1-" || f3 === "c2-" || f3 === "c3-" || f3 === "md-" || f4 === "ios-") {

          }
          else {
            if (resultArray[0].indexOf("lang(\"") == -1) {
              extractReactLabel(resultArray, filename, filePath, contentData);
              // reactLabelTotals.push(match)
            }
          }
        }
      }
    }
  }

  if (textMatches !== null) {
    for ( let i = 0; i < textMatches.length; i++) {
      let match = textMatches[i];
      let resultArray = [];
      while ((resultArray = textRegex.exec(match)) !== null) {
        if (resultArray[0].indexOf("lang(\"") == -1) {
          extractFromText(resultArray, filename, filePath, contentData)
          // textTotals.push(match)
        }
      }
    }
  }

  if (alertMatches !== null) {
    for ( let i = 0; i < alertMatches.length; i++) {
      let match = alertMatches[i];
      let resultArray = [];
      while ((resultArray = alertRegex.exec(match)) !== null) {
        if (resultArray[0].indexOf("lang(\"") == -1) {
          extractAlert(resultArray, filename, filePath, contentData)
          // alertTotals.push(match)
        }
      }
    }
  }

  if (labelMatches !== null) {
    for ( let i = 0; i < labelMatches.length; i++) {
      let match = labelMatches[i];
      let resultArray = [];
      while ((resultArray = labelRegex.exec(match)) !== null) {
        if (resultArray[0].indexOf("lang(\"") == -1) {
          extractLabel(resultArray, filename, filePath, contentData)
          // labelTotals.push(match)
        }
      }
    }
  }
  if (titleMatches !== null) {
    for ( let i = 0; i < titleMatches.length; i++) {
      let match = titleMatches[i];
      let resultArray = [];
      while ((resultArray = titleRegex.exec(match)) !== null) {
        if (resultArray[0].indexOf("lang(\"") == -1) {
          extractTitle(resultArray, filename, filePath, contentData)
          // titleTotals.push(match)
        }
      }
    }
  }

  let parserRegex = /(Languages\.([^)]*?)\(\s?([^,]*),\s?([^\)]*)\s?\)\(([^\)]*)\))/gm;
  let parserMatches = contentData.content.match(parserRegex);

  if (parserMatches !== null) {
    for ( let i = 0; i < parserMatches.length; i++) {
      let match = parserMatches[i];
      let resultArray = [];
      while ((resultArray = parserRegex.exec(match)) !== null) {
        if (resultArray[2] !== "get") {
          // console.log(resultArray);
          let newString = "lang("+resultArray[4];
          if (resultArray[5]) {
            newString += "," + resultArray[5]
          }
          newString += ")"
          contentData.content = contentData.content.replace(resultArray[0], newString)
        }
      }
    }
  }

  util.makeLanguageCallsShorthand(contentData)

  fileMap[filename] = filePath
  if (allowReplace) {
    fs.writeFileSync(filePath, contentData.content);
  }

  return {translationData}
}

function extractAlert(match, filename, filePath, contentData) {
  let fullMatch = match[0].replace("Alert.alert(",'');

  let headerResult = extractor.extractAndConvert(fullMatch, true, true, true)
  let header = headerResult.text;

  let fullMatchBody = fullMatch.substr(headerResult.parsedText.length + 1) // +1 to swallow the comma
  let bodyResult = extractor.extractAndConvert(fullMatchBody, true, true, true)
  // there is no actual text in here. Not required to translate.
  if (!bodyResult.pureText) {
    return
  }

  let body = bodyResult.text;
  let fullMatchRemainder = fullMatchBody.substr(bodyResult.parsedText.length)
  let textSplit = fullMatch.split("text:");

  let buttonLeftData = util.grabString(textSplit[1]);
  let buttonRightData = util.grabString(textSplit[2]);

  if (translationData[filename] === undefined) {
    translationData[filename] = {__filename: '"' + filePath + '"'}
  }


  let headerTextKey      = util.prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_header');
  let bodyTextKey        = util.prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_body');

  let headerFunctionCall = util.getFunctionCall(headerResult);
  let bodyFunctionCall   = util.getFunctionCall(bodyResult);


  translationData[filename][headerTextKey] = "function() { return " + headerResult.text + " }";
  translationData[filename][bodyTextKey]   = "function() { return " + bodyResult.text + " }";
  let buttonLeftKey
  let buttonRightKey
  if (buttonLeftData.result) {
    buttonLeftKey      = util.prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_left');
    translationData[filename][buttonLeftKey]   = "function() { return \"" + buttonLeftData.result + "\" }";
  }

  if (buttonRightData.result) {
    buttonRightKey     = util.prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_right');
    translationData[filename][buttonRightKey]   = "function() { return \"" + buttonRightData.result + "\" }";
  }

  // write remainder; this is the part with the buttons
  let remainder = ')'
  let textSplitCounter = 1;
  if (buttonLeftData.result) {
    remainder = ',';
    remainder += '\n[{text:' + textSplit[textSplitCounter].replace(buttonLeftData.resultString, 'Languages.alert(\"' + filename + '\", \"' + buttonLeftKey + '\")()');
    textSplitCounter++
    if (buttonRightData.result) {
      remainder += '\ntext:' + textSplit[textSplitCounter].replace(buttonRightData.resultString, 'Languages.alert(\"' + filename + '\", \"' + buttonRightKey + '\")()');
      textSplitCounter++;
    }

    if (textSplitCounter < textSplit.length) {
      for ( let i = textSplitCounter; i < textSplit.length; i++) {
        remainder += "text:" + textSplit[i]
      }
    }
  }

  let replacement = match[0].replace(headerResult.parsedText,'\nLanguages.alert("' + filename + '", "' + headerTextKey + '")' + headerFunctionCall)
  replacement = replacement.replace(bodyResult.parsedText,'\nLanguages.alert("' + filename + '", "' + bodyTextKey + '")' + bodyFunctionCall )
  replacement = replacement.replace(fullMatchRemainder,remainder)
  console.log("MATCHING", match[0], replacement)
  contentData.content = contentData.content.replace(match[0], replacement);
}

function extractTitle(match, filename, filePath, contentData) {
  let content = match[1];

  let extractData = extractor.extractAndConvert(content, true, true, true);

  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationData, 'title', contentData);
}

function extractLabel(match, filename, filePath, contentData) {
  let content = match[2];

  // let label = _extractStringWithParameters(content);
  let extractData = extractor.extractAndConvert(content, true, true, true);
  let prefix = match[1].substr(0,match[1].indexOf(match[2]))

  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationData, 'label', contentData, false, [prefix,'']);
}

function extractReactLabel(match, filename, filePath, contentData) {
  let content = match[2];

  // let label = _extractStringWithParameters(content);
  let extractData = extractor.extractAndConvert(content, true, true, true);
  let prefix = match[1] + "={"


  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationData, 'label', contentData, false, [prefix,'}']);
}

function extractFromText(match, filename, filePath, contentData) {
  // this will ignore any > in the styles
  let manuallyParsedContent = ''
  let open = 0;
  let ignore = 0;
  let textOpen = false;
  for ( let i = 0; i < match[0].length; i++) {
    let letter = match[0][i];
    if (letter === "<") {
      open++;
    }
    if (letter === "{") {
      ignore++;
    }
    if (letter === "}") {
      ignore--;
    }
    if (letter === ">" && ignore === 0) {
      open--;
      continue;
    }

    if (open === 0 || textOpen === true) {
      textOpen = true;
      manuallyParsedContent += letter;
    }
  }

  manuallyParsedContent = manuallyParsedContent.replace("</Text","");
  let content = manuallyParsedContent;



  let extractData = extractor.extractAndConvert(content);

  let paddingArray = match[0].split(extractData.parsedText);

  if (extractData.pureText) {
    createTranslationFileAndReplaceContents(filename, filePath, extractData, translationData, 'text', contentData, true, paddingArray)
  }
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
  replacementContent += ' Languages.' + targetType + '("' + filename + '", "' + textKey + '")' + functionCall;
  if (openWithCurly) { replacementContent += ' }'; }

  if (Array.isArray(paddingArray) && paddingArray.length == 2) {
    contentData.content = contentData.content.replace(paddingArray[0]+extractData.parsedText+paddingArray[1], paddingArray[0]+replacementContent+paddingArray[1]);
  }
  else {
    contentData.content = contentData.content.replace(extractData.parsedText, replacementContent);
  }
}




module.exports = {parseFile, parseFilesRecursivelyInPath, clearTranslationData}