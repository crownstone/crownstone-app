let fs = require( 'fs' );
let path = require( 'path' );
let util = require("./util");
let config = require("./config");

const LANGUAGE_FILE_PATH = '../../js/'





const KEY_SIZE = 25;

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
    else if (stat.isDirectory()) {
      // console.log( "'%s' is a directory.", elementPath );
      parseFilesRecursivelyInPath(elementPath)
    }
  };

  return {fileMap, fileList, translationData}
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


  let filenameArr = filePath.split("/");
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
    let ignoreFields = {key: true, color: true, ellipsizeMode: true, returnKeyType: true, autoCapitalize: true}
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

  fileMap[filename] = filePath
  if (allowReplace) {
    fs.writeFileSync(filePath, contentData.content);
  }

  return {translationData}
}

function extractAlert(match, filename, filePath, contentData) {
  let fullMatch = match[0].replace("Alert.alert(",'');

  let headerResult = extractAndConvert(fullMatch, true, true, true)
  let header = headerResult.text;

  let fullMatchBody = fullMatch.substr(headerResult.parsedText.length + 1) // +1 to swallow the comma
  let bodyResult = extractAndConvert(fullMatchBody, true, true, true)
  // there is no actual text in here. Not required to translate.
  if (!bodyResult.pureText) {
    return
  }

  let body = bodyResult.text;
  let fullMatchRemainder = fullMatchBody.substr(bodyResult.parsedText.length)
  let textSplit = fullMatch.split("text:");

  let buttonLeftData = grabString(textSplit[1]);
  let buttonRightData = grabString(textSplit[2]);

  if (translationData[filename] === undefined) {
    translationData[filename] = {__filename: '"' + filePath + '"'}
  }

  let headerTextKey      = prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_header');
  let bodyTextKey        = prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_body');

  let headerFunctionCall = getFunctionCall(headerResult);
  let bodyFunctionCall   = getFunctionCall(bodyResult);


  translationData[filename][headerTextKey] = "() => { return " + headerResult.text + " }";
  translationData[filename][bodyTextKey]   = "() => { return " + bodyResult.text + " }";
  let buttonLeftKey
  let buttonRightKey
  if (buttonLeftData.result) {
    buttonLeftKey      = prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_left');
    translationData[filename][buttonLeftKey]   = "() => { return \"" + buttonLeftData.result + "\" }";
  }

  if (buttonRightData.result) {
    buttonRightKey     = prepareTextKey(translationData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_right');
    translationData[filename][buttonRightKey]   = "() => { return \"" + buttonRightData.result + "\" }";
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

  contentData.content = contentData.content.replace(match[0], replacement);
}

function extractTitle(match, filename, filePath, contentData) {
  let content = match[1];

  let extractData = extractAndConvert(content, true, true, true);

  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationData, 'title', contentData);
}

function extractLabel(match, filename, filePath, contentData) {
  let content = match[2];

  // let label = _extractStringWithParameters(content);
  let extractData = extractAndConvert(content, true, true, true);
  let prefix = match[1].substr(0,match[1].indexOf(match[2]))

  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationData, 'label', contentData, false, [prefix,'']);
}

function extractReactLabel(match, filename, filePath, contentData) {
  let content = match[2];

  // let label = _extractStringWithParameters(content);
  let extractData = extractAndConvert(content, true, true, true);
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



  let extractData = extractAndConvert(content);

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

  let textKey = prepareTextKey(target, filename, extractData.pureText);
  if (textKey === '' || textKey === "_") {
    return;
  }

  target[filename][textKey] = "() => { return " + extractData.text + " }";

  let functionCall = getFunctionCall(extractData);

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

function getFunctionCall(extractData) {
  let functionCall = '('
  for (let i = 0; i < extractData.parameters.length; i++) {
    functionCall += extractData.parameters[i];
    if (i != extractData.parameters.length - 1) {
      functionCall += ',';
    }
  }
  functionCall += ")";
  return functionCall;
}

function prepareTextKey(target, filename, inputText, postfix = '') {

  let keyText = inputText.replace(/(\')/g,'')
  keyText = keyText.replace(/[^a-zA-Z]/g,'_')
  let textKeyNoSpaces = keyText.replace(/( )/g,"_").substr(0,KEY_SIZE) + postfix;
  let i = 1;

  while (target[filename][textKeyNoSpaces] !== undefined) {
    let newTextKey = keyText.replace(/( )/g,"_").substr(0,KEY_SIZE+i) + postfix;
    if (newTextKey === textKeyNoSpaces) {
      break;
    }

    textKeyNoSpaces = newTextKey;
    i++;
  }
  return textKeyNoSpaces;
}

function grabString(str) {
  if (!str) { return {result:null}; }

  let result = '';
  let stringOpen = false;
  let stringMatcher = '"'
  for ( let i = 0; i < str.length; i++) {
    let letter = str[i];
    if (stringOpen) {
      if (letter == stringMatcher) {
        stringOpen = false;
        break
      }
      result += letter
    }

    if (!stringOpen) {
      if (letter === '"' || letter === "'") {
        stringMatcher = letter;
        stringOpen = true;
      }
    }
  }
  let resultString = stringMatcher + result + stringMatcher
  return {result, resultString};
}

function extractAndConvert(content, assumeLogicIsOpen = false, stopOnComma = false, stopOnCurlyBracket = false) {
  let modes = {
    logic:     "logic",
    string:    "string",
    block:     "block",
    arguments: "arguments",
    void:      "void",
  };

  let textLetters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let parameterLetters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ[].0123456789()';
  let parserSymbols = {
    '"' : {closing: '"', getMode: (prevLetter) => { return "string"; }, acceptIfInMode: { logic: true, block: true }},
    "'" : {closing: "'", getMode: (prevLetter) => { return "string"; }, acceptIfInMode: { logic: true, block: true }},
    "(" : {closing: ")", getMode: (prevLetter) => { return textLetters.indexOf(prevLetter) === -1 ? "block" : 'arguments'; }, acceptIfInMode: { arguments: true, block: true, logic: true}},
    "{" : {closing: "}", getMode: (prevLetter) => { return "logic";  }, acceptIfInMode: { void:  true, block: true}},
  };

  let layers = [];
  let activeModes = [modes.void];

  let chunk = '';
  let pureText = '';
  let parameterCounter = 0;
  let parameterAddedWhileClosed = false;
  let chunks = [];
  let parameters = [];
  let parameter = ''
  let ignoreVoid = false;
  let escaping = false;

  let prevLetter = null;

  if (assumeLogicIsOpen === false) {
    // check is there is a logic block. if there is, we do not need to consider the void mode
    for (let i = 0; i < content.length; i++) {
      let letter = content[i];
      let activeMode = activeModes[activeModes.length - 1];

      if (parserSymbols[letter] !== undefined) {
        if (parserSymbols[letter].acceptIfInMode[activeMode]) {
          activeModes.push(parserSymbols[letter].getMode(prevLetter));
          layers.push(parserSymbols[letter].closing);
          if (activeModes[activeModes.length - 1] === modes.logic) {
            ignoreVoid = true;
          }

          prevLetter = letter;
          continue;
        }
      }

      if (letter == layers[layers.length - 1]) {
        // close the segment
        layers.pop();
        activeModes.pop();

        prevLetter = letter;
        continue;
      }

      prevLetter = letter;
    }
    activeModes = [modes.void];
  }
  else {
    ignoreVoid = true
    activeModes = [modes.logic];
  }

  layers = [];
  prevLetter = null;
  let parsedText = '';

  // parse text
  for (let i = 0; i < content.length; i++) {
    let letter = content[i];
    let activeMode = activeModes[activeModes.length - 1];
    // console.log("Letter", letter, activeMode, activeModes.length)

    if (letter === ',' && stopOnComma === true) {
      if (activeMode === modes.void || activeMode === modes.logic) {
        break;
      }
    }
    if (letter === '}' && stopOnCurlyBracket === true) {
      if (activeMode === modes.void || activeMode === modes.logic) {
        break;
      }
    }

    parsedText += letter;

    if (letter === '\\') {
      escaping = true
      continue;
    }

    if (escaping) {
      if (letter === 'n') {
        escaping = false;
        letter = '\\n'
      }
      else {
        if (activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false)) {
          pureText += "\\" + letter;
          chunk +=  "\\" + letter;
        }

        escaping = false;
        prevLetter = letter;
        continue;
      }
    }

    if (letter == layers[layers.length - 1]) {
      // close the segment
      if (activeMode === modes.block) {
        chunks.push(")");
      }

      if (activeMode === modes.arguments) {
        parameter += ")";
      }

      if (chunk) {
        chunks.push(chunk);
      }
      if (activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false)) {
        chunks.push('"');
        parameterAddedWhileClosed = false
      }
      layers.pop();
      activeModes.pop();
      chunk = '';

      prevLetter = letter;
      continue;
    }

    // check for mode changes
    if (parserSymbols[letter] !== undefined) {

      if (parserSymbols[letter].acceptIfInMode[activeMode]) {
        activeModes.push(parserSymbols[letter].getMode(prevLetter));
        layers.push(parserSymbols[letter].closing);

        if (activeModes[activeModes.length - 1] === modes.block) {
          chunks.push("(")
        }

        if (activeModes[activeModes.length - 1] === modes.arguments) {
          parameter += "(";
        }

        if (activeModes[activeModes.length - 1] === modes.string || (activeModes[activeModes.length - 1] === modes.void && ignoreVoid === false)) {
          chunks.push('"');
        }

        prevLetter = letter;
        continue;
      }
      else {
        if (letter === '"' && activeMode === modes.string) {
          letter = '\\' + letter
        }
      }
    }

    // look for inline conditional statements
    if (letter === "?" && !(activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false))) {
      // look back through the chunks to see where the query stops
      let popCount = 0;
      let gotArgument = false;
      let startedGettingOperator = false;
      let gotOperator = false;
      let gotSubject = false
      for (let j = chunks.length - 1; j >= 0; j--) {
        if (popCount > 0) {
          if (chunks[j].indexOf("arguments[") !== -1) {
            parameterCounter--;
          }
          chunks.pop();
          popCount--;
        }
        let candidate = chunks[j];
        if (gotArgument === false) {
          // is string;
          if (candidate === '"' || candidate === "'") {
            popCount = 2;
            if (chunks[j].indexOf("arguments[") !== -1) {
              parameterCounter--;
            }
            chunks.pop();
          }
          else {
            if (chunks[j].indexOf("arguments[") !== -1) {
              parameterCounter--;
            }
            chunks.pop();
          }
          gotArgument = true;
          continue;
        }
        else if (gotOperator === false) {
          if (candidate === "=" || candidate === ">" || candidate === "<" || candidate === "!") {
            startedGettingOperator = true;
            chunks.pop();
          }
          else if (startedGettingOperator) {
            if (gotSubject === false) {
              if (chunks[j].indexOf("arguments[") !== -1) {
                parameterCounter--;
              }
              chunks.pop();
              break;
            }
          }
        }
        else if (gotSubject === false) {
          if (chunks[j].indexOf("arguments[") !== -1) {
            parameterCounter--;
          }
          chunks.pop();
          break;
        }
      }

      // with the query removed, we will be able to add a new conditional.
      chunks.push("arguments[" + parameterCounter +"] ? ");
      parameterCounter++;
      parameterAddedWhileClosed = false
      prevLetter = letter;
      continue;
    }

    // store data
    if (activeMode === modes.string || (activeMode === modes.void && ignoreVoid === false)) {
      pureText += letter;
      chunk += letter;
    }
    else if (activeMode === modes.logic || activeMode === modes.block) {
      if (letter === ":") {
        chunks.push(" : ");
        parameterAddedWhileClosed = false
      }
      else if (letter === "+") {
        chunks.push(" + ");
        parameterAddedWhileClosed = false
      }
      else if (letter === "|") {
        chunks.push("|");
        parameterAddedWhileClosed = false
      }
      else if (letter === "&") {
        chunks.push("&");
        parameterAddedWhileClosed = false
      }
      else if (letter === "=" || letter === ">" || letter === "<" || letter === "!") { // add these so the conditional parser will be able to remove the query
        chunks.push(letter);
        parameterAddedWhileClosed = false
      }
      else if (letter !== " " && letter !== "\n") {
        if (parameterAddedWhileClosed === false) {
          chunks.push("arguments[" + parameterCounter +"]")

          parameterCounter++;
          parameterAddedWhileClosed = true;
        }

        parameter += letter;
      }
      else if (parameterLetters.indexOf(letter) === -1) {
        if (parameter) {
          parameters.push(parameter);
        }
        parameter = '';
      }
    }
    else if (activeMode === modes.arguments) {
      parameter += letter;
    }

    prevLetter = letter;
  }


  // for when only void is avaible
  if (chunk !== '') {
    chunk = chunk.replace(/(\n)/g,"").trim();

    chunks.push('"' + chunk + '"');
  }

  if (parameter !== '') {
    parameters.push(parameter);
  }

  let text = chunks.join('');

  if (text.substr(text.length-2,2) === "+ ") {
    text = text.substr(0,text.length-3)
  }

  // add spaces to ||
  text = text.replace(/(\|\|)/g," || ")
  text = text.replace(/(&&)/g," && ")

  let keywords = {new: true};
  let parsedParameters = [];
  let cache = ''
  for (let i = 0; i < parameters.length; i++) {
    if (keywords[parameters[i]] === true) {
      cache = parameters[i];
    }
    else {
      if (cache) {
        parsedParameters.push(cache + " " +parameters[i]);
        cache = '';
      }
      else {
        parsedParameters.push(parameters[i]);
      }
    }
  }

  return {pureText, text, parameters: parsedParameters, parsedText: parsedText};
}


module.exports = {parseFile, parseFilesRecursivelyInPath}