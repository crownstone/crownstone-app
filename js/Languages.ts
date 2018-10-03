
class LanguageManager {

  locale = 'en'

  constructor() {

  }

  setLocale(locale) {
    this.locale = locale;

    this._applyLocale()
  }

  alert(file, key) {

  }

  text(file, key) {

  }

  title(file, key) {

  }

  label(file, key) {

  }


  _applyLocale() {

  }
}

export const Languages = new LanguageManager()