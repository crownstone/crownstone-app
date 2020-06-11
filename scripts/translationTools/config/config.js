const FILE_EXCLUSIONS = {
  'DebugIconSelection': true,
  'IconDebug': true,
  'styles':true,
};

const FILE_KEY_EXCEPTIONS = {
  'AppUtil': true,
  'LocationHandler': true,
  'StoneUtil': true,
  'Tabs': true,
  '__UNIVERSAL': true
};

const PATH_EXCLUSIONS = {
  "../../js/views/dev" : true,
  "../../js/settingsViews/dev" : true,

}

module.exports = {
  FILE_EXCLUSIONS,
  FILE_KEY_EXCEPTIONS,
  PATH_EXCLUSIONS,
  ENGLISH_BASE_LANGUAGE_PATH: "../../js/localization/en/us/en_us.ts",
  BASE_CODE_PATH:             "../../js",
  LOCALIZATION_BASE_PATH:     "../../js/localization",
}