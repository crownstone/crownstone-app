import { update, getTime } from './reducerUtil'

let defaultSettings = {
  complexity: {
    presets: false,
    statistics: false,
    onHomeEnterExit: true,
    presenceWithoutDevices: false,
    linkedDevices: true,
    updatedAt: getTime()
  }
};

// settingsReducer
export default (state = defaultSettings.complexity, action = {}) => {
  switch (action.type) {
    default:
      return state;
  }
};