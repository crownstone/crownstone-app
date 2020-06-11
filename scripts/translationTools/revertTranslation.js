let fs = require( 'fs' );

let reverter = require("./lib/reverter")
let storageMethods = require("./lib/storageMethods")
let util = require("./lib/util")
let config = require("./config/config")

let __dataBlob = storageMethods.getTranslationFileAsData(config.ENGLISH_BASE_LANGUAGE_PATH);

const BASE_LANGUAGE = ['en','us']
const TRANSLATED_LANGUAGES = [
  ['nl','nl'],
]

let BASE = {};
function getFilenameFromLanguage(language) {
  return language[0] + "_" + language[1] + ".ts";
}
function getPathFromLanguage(language) {
  return getBasePathFromLanguage(language) + getFilenameFromLanguage(language)
}
function getBasePathFromLanguage(language) {
  return config.LOCALIZATION_BASE_PATH + "/" + language[0] + "/" + language[1] + "/"
}
function loadBaseLanguageFile() {
  BASE = storageMethods.getTranslationFileAsData(getPathFromLanguage(BASE_LANGUAGE));
}

// load base file and load the localization files, this creates the required files as well.
loadBaseLanguageFile();


// parse all files in js folder
let {fileMap, fileList, translationData, success} = reverter.revertTranslation(Object.keys(config.PATH_EXCLUSIONS)[0], BASE)

if (success) {
  console.log("\n\nEverything looks fantastic!\n\n")
}