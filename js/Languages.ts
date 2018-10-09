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
    return () => {
      console.log("alert", file, key)
      console.log("alert", this.textSource.label)
      console.log("alert", this.textSource.label[file])
      let str = this.textSource[file][key].apply(this, arguments)
      console.log("alert value:", str)
      if (str && str.substr) {
        return key + str.substr(0,10);
      }
      return key;
    }
  }

  _applyLocale() {
    this.textSource = localization_en_us;
  }
}

export const Languages = new LanguageManager()