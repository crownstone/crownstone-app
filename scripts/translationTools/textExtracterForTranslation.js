let fs = require( 'fs' );

let extractionMethods = require("./lib/textExtractorMethods")
let storageMethods = require("./lib/storageMethods")
let util = require("./lib/util")
let config = require("./config/config")

let __dataBlob = storageMethods.getTranslationFileAsData(config.ENGLISH_BASE_LANGUAGE_PATH);

console.log("------------------------------------------")
console.log("Scanning files for translatable strings...")
console.log("------------------------------------------")

// parse all files in js folder
let {fileMap, fileList, translationData} = extractionMethods.parseFilesRecursivelyInPath(config.BASE_CODE_PATH)

// clear the cache in order to get reproducible results.
extractionMethods.clearTranslationData();

console.log("Done! Searched ", fileList.length, " files. Parsing results...")

console.log("\nChecking for new strings in existing files...")
console.log("------------------------------------------")
Object.keys(translationData).forEach((filename) => {
  let translationKeys = Object.keys(translationData[filename])
  translationKeys.splice(translationKeys.indexOf("__filename"), 1)
  if (translationKeys.length > 0) {
    if ( __dataBlob[filename] !== undefined) {
      let conflict = false;
      translationKeys.forEach((translationKey) => {
        if (__dataBlob[filename][translationKey] !== undefined) {
          conflict = true
          console.log("-------- Conflict with existing key!", translationKey)
          translationData[filename][translationKey]
        }
      })

      console.log("New strings detected in existing file:",
        util.padd(filename,30),
        "with", translationKeys.length, "new entries.",
        conflict ? "Conflicting keys found!" : "No Conflict."
      );

      if (!conflict) {
        console.log("----- Preparing for merge...")
        extractionMethods.parseFile(fileMap[filename], true)
        translationKeys.forEach((translationKey) => {
          __dataBlob[filename][translationKey] = translationData[filename][translationKey]
        })
        console.log("----- Merge completed!")
      }

    }
  }
})

console.log("------------------------------------------")
console.log("Done!")



console.log("\nChecking for new files...")
console.log("------------------------------------------")
Object.keys(translationData).forEach((filename) => {
  let translationKeys = Object.keys(translationData[filename])
  translationKeys.splice(translationKeys.indexOf("__filename"), 1)
  if (translationKeys.length > 0) {
    if ( __dataBlob[filename] !== undefined) {
    }
    else {
      console.log("New file detected:", util.padd(filename,30), "with", translationKeys.length, "translatable strings.")
      console.log("----- Preparing for translation replacements...")
      extractionMethods.parseFile(fileMap[filename], true)
      __dataBlob[filename] = translationData[filename];
      console.log("----- Replacements complete!")
    }
  }
})


console.log("------------------------------------------")
console.log("Done!")

console.log("\nWriting translation file to disk...")
console.log("------------------------------------------")
storageMethods.stringifyAndStore(__dataBlob, config.ENGLISH_BASE_LANGUAGE_PATH);

console.log("Finished!")

console.log("------------------------------------------\n")

