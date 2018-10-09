import localization_en_us from "./localization/en/us/en_us";

const DEFAULT_STRING = "TRANSLATION_IN_PROGRESS"

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
      let str = this.textSource[file][key](a,b,c,d,e)
      // return str
      return "$$$" + str
    }
  }

  _applyLocale() {
    this.textSource = localization_en_us;
  }
}

export const Languages = new LanguageManager()
