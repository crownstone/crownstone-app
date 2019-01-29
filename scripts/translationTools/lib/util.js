
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

function prepareTextKey(target, filename, inputText, postfix = '') {
  let KEY_SIZE = 25
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

function makeLanguageCallsShorthand(contentData) {
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
}



module.exports = {
  padd,
  prepareTextKey,
  getFunctionCall,
  makeLanguageCallsShorthand,
  grabString,
}