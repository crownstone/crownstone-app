const FILE_EXCLUSIONS = {
  'DebugIconSelection': true,
  'IconDebug': true,
  'DeviceSummaryProto':true,
  'styles':true,
};

const FILE_KEY_EXCEPTIONS = {
  'AppUtil': true,
  'LocationHandler': true,
  'StoneUtil': true,
  'Tabs': true,
  '__UNIVERSAL': true
};

module.exports = {
  FILE_EXCLUSIONS,
  FILE_KEY_EXCEPTIONS,
  ENGLISH_BASE_LANGUAGE_PATH: "../../js/localization/en/us/en_us.ts",
  BASE_CODE_PATH:             "../../js",
  LOCALIZATION_BASE_PATH:     "../../js/localization",
}