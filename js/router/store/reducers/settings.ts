import { update, getTime, refreshDefaults } from './reducerUtil'

let defaultSettings = {
  config: {
    presets: false,
    statistics: false,
    onHomeEnterExit: true,
    presenceWithoutDevices: false,
    linkedDevices: true,
    updatedAt: 1
  }
};

// settingsReducer
export default (state = defaultSettings.config, action : any = {}) => {
  switch (action.type) {
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings.config);
    default:
      return state;
  }
};