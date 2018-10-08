let fs = require( 'fs' );
let path = require( 'path' );
let startPath = "../js";

const EXCLUSIONS = {
  'DebugIconSelection': true,
  'IconDebug': true
}


const KEY_SIZE = 25;

let reactLabelTots  = [];
let textTots  = [];
let alertTots = [];
let labelTots = [];
let titleTots = [];
let translationAlertData = {};
let translationLabelData = {};
let translationTextData  = {};
let translationTitleData = {};

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

  if (EXCLUSIONS[filename]) { return }

  // if (filename !== "StatusCommunication") {
  //   return;
  // }

  let importLine = 'import { Languages } from "';
  let pathArr = filePath.split("/");
  for (let i = 0; i < pathArr.length - 3; i++) {
    importLine += '../'
  }
  importLine += 'Languages"\n'

  if (content.indexOf(importLine) === -1) {
    content = importLine + content;
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
            extractReactLabel(resultArray, filename, filePath, contentData);
            reactLabelTots.push(resultArray)
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
        extractFromText(resultArray, filename, filePath, contentData)
      }
    }
    textTots = textTots.concat(textMatches);
  }

  if (alertMatches !== null) {
    for ( let i = 0; i < alertMatches.length; i++) {
      let match = alertMatches[i];
      let resultArray = [];
      while ((resultArray = alertRegex.exec(match)) !== null) {
        extractAlert(resultArray, filename, filePath, contentData)
      }
    }
    alertTots = alertTots.concat(alertMatches);
  }

  if (labelMatches !== null) {
    for ( let i = 0; i < labelMatches.length; i++) {
      let match = labelMatches[i];
      let resultArray = [];
      while ((resultArray = labelRegex.exec(match)) !== null) {
        extractLabel(resultArray, filename, filePath, contentData)
      }
    }
    labelTots = labelTots.concat(labelMatches);
  }
  if (titleMatches !== null) {
    for ( let i = 0; i < titleMatches.length; i++) {
      let match = titleMatches[i];
      let resultArray = [];
      while ((resultArray = titleRegex.exec(match)) !== null) {
        extractTitle(resultArray, filename, filePath, contentData)
      }
    }
    titleTots = titleTots.concat(titleMatches);
  }

  // console.log(contentData)
  fs.writeFileSync(filePath, contentData.content);
}

function extractAlert(match, filename, filePath, contentData) {
  let fullMatch = match[0].replace("Alert.alert(",'');

  let headerResult = extractAndConvert(fullMatch, true, true, true)
  let header = headerResult.text;

  let fullMatchBody = fullMatch.substr(headerResult.parsedText.length + 1) // +1 to swallow the comma
  let bodyResult = extractAndConvert(fullMatchBody, true, true, true)
  let body = bodyResult.text;
  let fullMatchRemainder = fullMatchBody.substr(bodyResult.parsedText.length)
  let textSplit = fullMatch.split("text:");

  let buttonLeftData = grabString(textSplit[1]);
  let buttonRightData = grabString(textSplit[2]);

  if (translationAlertData[filename] === undefined) {
    translationAlertData[filename] = {__filename: '"' + filePath + '"'}
  }

  let headerTextKey      = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_header');
  let bodyTextKey        = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_body');

  let headerFunctionCall = getFunctionCall(headerResult);
  let bodyFunctionCall   = getFunctionCall(bodyResult);


  translationAlertData[filename][headerTextKey] = "() => { return " + headerResult.text + " }";
  translationAlertData[filename][bodyTextKey]   = "() => { return " + bodyResult.text + " }";
  let buttonLeftKey
  let buttonRightKey
  if (buttonLeftData.result) {
    buttonLeftKey      = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_left');
    translationAlertData[filename][buttonLeftKey]   = "() => { return \"" + buttonLeftData.result + "\" }";
  }

  if (buttonRightData.result) {
    buttonRightKey     = prepareTextKey(translationAlertData, filename, header+body+buttonLeftData.result+buttonRightData.result,'_right');
    translationAlertData[filename][buttonRightKey]   = "() => { return \"" + buttonRightData.result + "\" }";
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

  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationTitleData, 'title', contentData);
}

function extractLabel(match, filename, filePath, contentData) {
  let content = match[2];

  // let label = _extractStringWithParameters(content);
  let extractData = extractAndConvert(content, true, true, true);
  let prefix = match[1].substr(0,match[1].indexOf(match[2]))

  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationLabelData, 'label', contentData, false, [prefix,'']);
}

function extractReactLabel(match, filename, filePath, contentData) {
  let content = match[2];

  // let label = _extractStringWithParameters(content);
  let extractData = extractAndConvert(content, true, true, true);
  let prefix = match[1] + "={"


  createTranslationFileAndReplaceContents(filename, filePath, extractData, translationLabelData, 'label', contentData, false, [prefix,'}']);
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
    createTranslationFileAndReplaceContents(filename, filePath, extractData, translationTextData, 'text', contentData, true, paddingArray)
  }
}


function createTranslationFileAndReplaceContents(filename, filePath, extractData, target, targetType, contentData, openWithCurly = false, paddingArray = null) {
  if (target[filename] === undefined) {
    target[filename] = {__filename: '"' + filePath + '"'}
  }

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


parsePath(startPath)
console.log('textTots', textTots.length);
console.log('alertTots', alertTots.length);
console.log('labelTots', labelTots.length);
console.log('reactLabelTots', reactLabelTots.length);
console.log('titleTots', titleTots.length);

//util
let padd = function (x, size) {
  if (x === "__filename:") {
    return x;
  }
  while (x.length < size) {
    x += " ";
  }
  return x
}

function stringifyData(translationData, filename) {
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
      resultString += indent + indent + padd(subKey + ":", keySizeMax + 1) + " " + source[subKey] + ",\n"
    })
    resultString += indent + "},\n"
  })

  resultString += "}";
  fs.writeFileSync(filename + ".ts", resultString)
}

stringifyData(translationTextData,  'en_us_texts')
stringifyData(translationTitleData, 'en_us_titles')
stringifyData(translationAlertData, 'en_us_alerts')


let stringTots  = [];

let parsePathInteractive = function(dirPath) {
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
    else if (stat.isDirectory()) {
      // console.log( "'%s' is a directory.", elementPath );
      parsePathInteractive(elementPath)
    }
  };
}



let parseFileInteractive = function(filePath, ) {
  let content    = fs.readFileSync(filePath, "utf8")
  let equalsStringCheck = /(\S*?[^=<>!])\s?[:=]\s?(['"^}][\s\S]*?)[};]/gm
  let equalsStringMatches = content.match(equalsStringCheck);

  let filenameArr = filePath.split("/");
  let filename = filenameArr[filenameArr.length-1].replace(".tsx","").replace(/[^0-9a-zA-Z]/g,'_');

  if (EXCLUSIONS[filename]) { return }

  // if (filename !== "OptionPopup") {
  //   return;
  // }

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


  // console.log(contentData)
  fs.writeFileSync(filePath, contentData.content);
}

let ignoreWords = [
  'bold',
  'center',
  'row',
  '#',
  'transparent',
  'flex-start',
  'flex-end',
  'c1-',
  'c2-',
  'c3-',
  'md-',
  'ios-',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]
let ignoreKeys = [
  '{',
  'sun',
  'alignItems',
  '{position',
  'position',
  'textAlign',
  'type',
  '{key',
  'size',
  'type',
  'flex',
  'Actions',
  '{Actions',
  'placeholderText',
  'keyboardShouldPersistTaps',
  'backgroundColor',
  '{name',
  'name',
  'style',
  'levels',
  'items.push',
  'this.props.',
  'this.state.',
  'this.setState',
  'overflow',
  'Sidebar',
  'textAnchor',
  'commandName',
  'SessionMemory',
  'notificationType',
  'rotation',
  'Util',
  'id',
  'stopOpacity',
  'stroke',
  'fontStyle',
  'offset',
  'fill',
  'mode',
  '"_Zindex',
  'Linking.openURL',
  'strokeLinecap',
  'store.dispatch',
  '[commandName',
  '[{commandName',
  "sphere",
  "cameraSide",
  "flashMode",
  "resizeMode",
  "borderColor",
  "icons",
  "stringifiedError",
  "permission",
  "picture",
  "on",
  "c",
  "null",
  "'on'",
  "[styles",
  "parametrization",
  "orientation",
  "linePath",
  "largeLabel",
  "fontSize",
  "stone",
  "LOGe",
  "unknownString",
  "handle",
  "text",
  "ERROR",
  "TYPE",
  "error",
  "xField",
  "match",
  "DFU",
  "triggerEvent",
  "using",
  "'navigation'",
  "'heartbeats'",
  "assetType",
  "validationMethod",
  "value",
  "category",
]

let counter = 0;

let keyMatcher = {};
function parseInteractive(resultArray, filename, filePath, contentData) {
  // console.log("key", resultArray[1], "value", resultArray[2])

  let content = resultArray[2];
  for (let i = 0; i < ignoreWords.length; i++) {
    let part = content.substr(0,ignoreWords[i].length + 1);
    if (part === '"' + ignoreWords[i] || part === "'" + ignoreWords[i]) {
      // console.log("ignore")
      return;
    }
  }

  for (let i = 0; i < ignoreKeys.length; i++) {
    let part = resultArray[1].substr(0,ignoreKeys[i].length + 1);
    if (part === '"' + ignoreKeys[i] || part === "'" + ignoreKeys[i] || part.substr(0,ignoreKeys[i].length) === ignoreKeys[i]) {
      // console.log("ignore KEY", resultArray[1], part)
      return;
    }
  }


  let extractData =  extractAndConvert(content, true, true, true);
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

parsePathInteractive(startPath)



stringifyData(translationLabelData, 'en_us_labels')
// console.log(resultString)
// console.log(translationTitleData)
// console.log(translationTextData)
// console.log(translationLabelData)
// console.log(translationAlertData)








