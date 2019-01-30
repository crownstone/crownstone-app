let letterMatcher = require("./lib/letterMatcher")
let ignoreHashes = require("./config/ignoreHashes")
const config = require("./config/config")
const storageMethods = require('./lib/storageMethods')

let __dataBlob = storageMethods.getTranslationFileAsData(config.ENGLISH_BASE_LANGUAGE_PATH)
let newTranslationInformation = letterMatcher.parsePathInteractive(config.BASE_CODE_PATH);
letterMatcher.resetReplacementHashes();

let affectedFiles = Object.keys(newTranslationInformation)
if (affectedFiles.length > 0) {
  affectedFiles.forEach((filename) => {
    if (__dataBlob[filename] === undefined) {
      console.log("Previously unknown file is now being used with translation", filename);
      __dataBlob[filename] = {}
    }
    Object.keys(newTranslationInformation[filename]).forEach((key) => {
      if (__dataBlob[filename][key] !== undefined) {
        if (__dataBlob[filename][key] === newTranslationInformation[filename][key]) { /* duplicate, no problem */ }
        else {
          console.log("Conflict detected in ", filename, key, newTranslationInformation[filename][key], __dataBlob[filename][key])
        }
      }
      else {
        __dataBlob[filename][key] = newTranslationInformation[filename][key]
      }
    })
  })
  console.log("CHANGING THE BASE FILE", affectedFiles)
  storageMethods.stringifyAndStore(__dataBlob, config.ENGLISH_BASE_LANGUAGE_PATH)
}
