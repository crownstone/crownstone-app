const {defaults: tsjPreset} = require('ts-jest/presets');

module.exports = {
  ...tsjPreset,
  preset: 'react-native',
  testEnvironment: 'node',
  testMatch: [
    "**/?(*.)+(spec|test).[t]s?(x)"
  ],
  globals: {
    'ts-jest': {
      tsconfig: "<rootDir>/tests/tsconfig.json"
    }
  },
  setupFiles: ['jest-date-mock']
};