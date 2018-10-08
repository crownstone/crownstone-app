import { localization_en_us } from "./localization/en/us/en";

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

  alert(file, key) : (a?,b?,c?,d?) => string {
    return () => {
      console.log("alert", file, key)
      console.log("alert", this.textSource.label)
      console.log("alert", this.textSource.label[file])
      let str = this.textSource.alert[file][key].apply(this, arguments)
      console.log("alert value:", str)
      if (str && str.substr) {
        return key + str.substr(0,10);
      }
      return key;
    }
  }

  text(file, key) : (a?,b?,c?,d?) => string{
    return () => {
      console.log("text", file, key)
      console.log("text", this.textSource.label)
      console.log("text", this.textSource.label[file])
      let str = this.textSource.text[file][key].apply(this, arguments)
      console.log("text value:", str)
      if (str && str.substr) {
        return key + str.substr(0,10);
      }
      return key;
    }
  }

  title(file, key) : (a?,b?,c?,d?) => string {
    return () => {
      console.log("title", file, key)
      console.log("title", this.textSource.label)
      console.log("title", this.textSource.label[file])
      let str = this.textSource.title[file][key].apply(this, arguments)
      console.log("title value:", str)
      if (str && str.substr) {
        return key + str.substr(0,10);
      }
      return key;
    }
  }

  label(file, key) : (a?,b?,c?,d?) => string {
    return () => {
      console.log("label", file, key)
      console.log("label", this.textSource.label)
      console.log("label", this.textSource.label[file])
      let str = this.textSource.label[file][key].apply(this, arguments)
      console.log("label value:", str)
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