const fs = require("fs")
let storageMethods = require("./lib/storageMethods")
let keyMatcher = require("./lib/keyMatcher")
let util = require("./lib/util")
let config = require("./config/config")


const BASE_LANGUAGE = ['en','us']
const TRANSLATED_LANGUAGES = [
  ['nl','nl'],
]

let BASE = {};
let DATA = {};

function isArgvTrue(label) {
  let idx = process.argv.indexOf("--"+label);
  if (idx !== -1) {
    if (process.argv.length > idx) {
      if (process.argv[idx+1] == "true") {
        return true;
      }
      else {
        console.log("Only true is a valid argument for ", label, " the rest is ignored");
      }
    }
    else {
      console.log("No argument provided for ", label)
    }
  }
}

function getLabelFromLanguage(language) {
  return language.join("_")
}
function getFilenameFromLanguage(language) {
  return language[0] + "_" + language[1] + ".ts";
}
function getPathFromLanguage(language) {
  return getBasePathFromLanguage(language) + getFilenameFromLanguage(language)
}
function getBasePathFromLanguage(language) {
  return config.LOCALIZATION_BASE_PATH + "/" + language[0] + "/" + language[1] + "/"
}
function loadFile(language) {
  if (!fs.existsSync(getPathFromLanguage(language))) {
    console.log("Creating new file for", language)
    createFile(language)
  }

  DATA[getLabelFromLanguage(language)] = storageMethods.getTranslationFileAsData(getPathFromLanguage(language));
}
function createFile(language) {
  fs.mkdirSync(getBasePathFromLanguage(language), {recursive: true})
  fs.writeFileSync(getPathFromLanguage(language), "export default {}")
}
function loadBaseLanguageFile() {
  BASE = storageMethods.getTranslationFileAsData(getPathFromLanguage(BASE_LANGUAGE));
}

// load base file and load the localization files, this creates the required files as well.
loadBaseLanguageFile();
TRANSLATED_LANGUAGES.forEach((lang) => { loadFile(lang)} )


// check if all files in the baseLanguage file still exist
let {fileMap, fileList} = keyMatcher.scanFilesRecursivelyInPath('../../js');
Object.keys(BASE).forEach((fileElement) => {
  if (config.FILE_KEY_EXCEPTIONS[fileElement]) { return; }
  if (fileMap[fileElement] === undefined) {
    if (isArgvTrue('deleteFiles')) {
      console.log("File entry", util.padd(fileElement,20)," removed from all language files.")
      delete BASE[fileElement]
    }
    else {
      console.log("File ",util.padd(fileElement,20),"has been deleted but it is in the base language file! Run this script again with --deleteFiles true to remove this from the language files.")
    }

  }
  else {
    Object.keys(BASE[fileElement]).forEach((linekey) => {
      if (linekey !== '__filename') {
        if (!keyMatcher.hasLine(fileMap[fileElement], linekey)) {
          if (isArgvTrue('deleteLines')) {
            console.log("Line entry", util.padd(linekey,35)," for file ", util.padd(fileElement,20), " has been removed from all language files.");
            delete BASE[fileElement][linekey];
          }
          else {
            console.log("There is a line entry ", util.padd(linekey,35)," for file ", util.padd(fileElement,20), " but it is not used in the file. Run this script again with --deleteLines true to remove this from the language files.")
          }
        }
      }
    })
  }

})


// every localization file will be iterated to remove outdated fields and to add new fields
// each foreign language will get a __stringSameAsBaseLanguage entry per file, each containing that file's subkeys with false. This field is also updated to match the keys.
Object.keys(BASE).forEach((fileElement) => {

  // insert file elements into language files if they do not exist yet.
  Object.keys(DATA).forEach((languageLabel) => {
    if (DATA[languageLabel][fileElement] === undefined) {
      console.log("Adding file", fileElement, "to", languageLabel)
      DATA[languageLabel][fileElement] = {}
    }
    if (DATA[languageLabel][fileElement]["__stringSameAsBaseLanguage"] === undefined) {
      DATA[languageLabel][fileElement]["__stringSameAsBaseLanguage"] = {};
    }
  })

  Object.keys(BASE[fileElement]).forEach((lineElement) => {
    // insert lineElement if it does not exist yet into all language files
    Object.keys(DATA).forEach((languageLabel) => {
      if (DATA[languageLabel][fileElement][lineElement] === undefined) {
        console.log("Adding line", lineElement, "for file", fileElement, "to", languageLabel)
        DATA[languageLabel][fileElement][lineElement] = BASE[fileElement][lineElement];
      }


      // check if this line exists in the __stringSameAsBaseLanguage
      if (lineElement !== "__filename") {
        if (DATA[languageLabel][fileElement]["__stringSameAsBaseLanguage"][lineElement] === undefined) {
          DATA[languageLabel][fileElement]["__stringSameAsBaseLanguage"][lineElement] = false;
        }
      }
    })
  })
});

Object.keys(DATA).forEach((languageLabel) => {
  Object.keys(DATA[languageLabel]).forEach((fileElement) => {
    if (BASE[fileElement] === undefined) {
      console.log("Removing file entry", fileElement, "from", languageLabel, "since it is not in Base Language.")
      delete DATA[languageLabel][fileElement];
    }
  });

  Object.keys(DATA[languageLabel]).forEach((fileElement) => {
    Object.keys(DATA[languageLabel][fileElement]).forEach((lineElement) => {
      if (lineElement !== "__stringSameAsBaseLanguage") {
        if (BASE[fileElement][lineElement] === undefined) {
          console.log("Removing line", lineElement, "from file", fileElement, "in", languageLabel, "since it is not in Base Language.")
          delete DATA[languageLabel][fileElement][lineElement];
        }
      }

      Object.keys(DATA[languageLabel][fileElement]["__stringSameAsBaseLanguage"]).forEach((lineElement) => {
        if (BASE[fileElement][lineElement] === undefined) {
          delete DATA[languageLabel][fileElement]["__stringSameAsBaseLanguage"][lineElement];
        }
      });
    });
  });
})


TRANSLATED_LANGUAGES.forEach((language) => {
  storageMethods.stringifyAndStore(DATA[getLabelFromLanguage(language)], getPathFromLanguage(language));
});

storageMethods.stringifyAndStore(BASE, getPathFromLanguage(BASE_LANGUAGE));


