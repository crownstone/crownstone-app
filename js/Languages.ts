
const DEFAULT_STRING = "TRANSLATION_IN_PROGRESS"

class LanguageManager {

  locale = 'en'

  constructor() {

  }

  setLocale(locale) {
    this.locale = locale;

    this._applyLocale()
  }

  alert(file, key) {
    return () => { return DEFAULT_STRING; }
  }

  text(file, key) {
    return () => { return DEFAULT_STRING; }
  }

  title(file, key) {
    return () => { return DEFAULT_STRING; }
  }

  label(file, key) {
    return () => { return DEFAULT_STRING; }
  }


  _applyLocale() {

  }
}

export const Languages = new LanguageManager()