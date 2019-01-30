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

module.exports = {
  extractAndConvert
}