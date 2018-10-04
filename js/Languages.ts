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
    return () => { return DEFAULT_STRING; }
  }

  text(file, key) : (a?,b?,c?,d?) => string{
    return () => { return DEFAULT_STRING; }
  }

  title(file, key) : (a?,b?,c?,d?) => string {
    return () => { return DEFAULT_STRING; }
  }

  label(file, key) : (a?,b?,c?,d?) => string {
    return () => { return DEFAULT_STRING; }
  }


  _applyLocale() {
    this.textSource = localization_en_us;
  }
}

export const Languages = new LanguageManager()