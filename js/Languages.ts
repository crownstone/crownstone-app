import localization_en_us from "./localization/en/us/en_us";

const DEFAULT_STRING = "TRANSLATION_IN_PROGRESS";

class LanguageManager {

  locale = 'en';
  textSource = null;

  constructor() {
    this._applyLocale()
  }

  setLocale(locale) {
    this.locale = locale;

    this._applyLocale()
  }


  get(file, key) : (a?,b?,c?,d?,e?) => string{
    return (a,b,c,d,e) => {
      // this will avoid 1000 "Back" references
      if (this.textSource[file] === undefined || this.textSource[file][key] === undefined) {
        if (!this.textSource['__UNIVERSAL'][key]) {
          console.warn("Could not find", key, " in file", file, " and universal");
          return "__MISSING_STRING__"
        }

        return this.textSource['__UNIVERSAL'][key](a,b,c,d,e)
        // return str
        // return "#" + str;
      }
      return this.textSource[file][key](a,b,c,d,e)
      // return "#" + str
    }
  }

  _applyLocale() {
    this.textSource = localization_en_us;
  }
}

export const Languages = new LanguageManager();
