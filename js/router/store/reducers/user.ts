import { update, getTime, refreshDefaults } from './reducerUtil'
import { Util } from '../../../util/Util'

let defaultSettings = {
  firstName: null,
  lastName: null,
  email: null,
  accessToken: null,
  passwordHash: null,
  userId: null,
  isNew: true,
  picture: null,
  pictureId: null,
  firmwareVersionsAvailable: {},
  bootloaderVersionsAvailable: {},
  betaAccess: false,
  seenTapToToggle: false,
  seenTapToToggleDisabledDuringSetup: false,
  seenRoomFingerprintAlert: false,
  appIdentifier: null,
  developer: false,
  logging: false,
  uploadDiagnostics: true,
  uploadLocation: true,
  uploadSwitchState: true,
  uploadPowerUsage: false,
  uploadHighFrequencyPowerUsage: false,
  uploadDeviceDetails: true,
  updatedAt: 1,
};

// userReducer
export default (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'SET_DEVELOPER_MODE':
      if (action.data) {
        let newState = {...state};
        newState.developer = update(action.data.developer, newState.developer);
        return newState;
      }
      return state;
    case 'SET_LOGGING':
      if (action.data) {
        let newState = {...state};
        newState.logging = update(action.data.logging, newState.logging);
        return newState;
      }
      return state;
    case 'SET_BETA_ACCESS':
      if (action.data) {
        let newState = {...state};
        newState.betaAccess = update(action.data.betaAccess, newState.betaAccess);
        return newState;
      }
      return state;
    case 'SET_NEW_FIRMWARE_VERSIONS':
      if (action.data) {
        let newState = {...state};
        newState.bootloaderVersionsAvailable = update(action.data.bootloaderVersionsAvailable, newState.bootloaderVersionsAvailable);
        newState.firmwareVersionsAvailable = update(action.data.firmwareVersionsAvailable, newState.firmwareVersionsAvailable);
        return newState;
      }
      return state;
    case 'CREATE_APP_IDENTIFIER':
      if (state.appIdentifier === null) {
        let newState = {...state};
        newState.appIdentifier = Util.getUUID();
        return newState;
      }
      return state;
    case 'SET_APP_IDENTIFIER':
      if (action.data) {
        let newState = {...state};
        newState.appIdentifier = update(action.data.appIdentifier,    newState.appIdentifier);
        return newState;
      }
      return state;
    case 'USER_SEEN_TAP_TO_TOGGLE_ALERT':
      if (action.data) {
        let newState = {...state};
        newState.seenTapToToggle = update(action.data.seenTapToToggle, newState.seenTapToToggle);
        return newState;
      }
      return state;
    case 'USER_SEEN_TAP_TO_TOGGLE_DISABLED_ALERT':
      if (action.data) {
        let newState = {...state};
        newState.seenTapToToggleDisabledDuringSetup = update(action.data.seenTapToToggleDisabledDuringSetup, newState.seenTapToToggleDisabledDuringSetup);
        return newState;
      }
      return state;
    case 'USER_SEEN_ROOM_FINGERPRINT_ALERT':
      if (action.data) {
        let newState = {...state};
        newState.seenRoomFingerprintAlert   = update(action.data.seenRoomFingerprintAlert,   newState.seenRoomFingerprintAlert);
        return newState;
      }
      return state;
    case 'USER_LOG_IN':
    case 'USER_APPEND': // append means filling in the data without updating the cloud.
    case 'USER_UPDATE':
      if (action.data) {
        let newState = {...state};
        newState.firstName              = update(action.data.firstName,    newState.firstName);
        newState.lastName               = update(action.data.lastName,     newState.lastName);
        newState.email                  = update(action.data.email,        newState.email);
        newState.passwordHash           = update(action.data.passwordHash, newState.passwordHash);
        newState.isNew                  = update(action.data.isNew,        newState.isNew);
        newState.accessToken            = update(action.data.accessToken,  newState.accessToken);
        newState.userId                 = update(action.data.userId,       newState.userId);
        newState.picture                = update(action.data.picture,      newState.picture);
        newState.pictureId              = update(action.data.pictureId,  newState.pictureId);
        newState.uploadLocation         = update(action.data.uploadLocation,      newState.uploadLocation);
        newState.uploadSwitchState      = update(action.data.uploadSwitchState,   newState.uploadSwitchState);
        newState.uploadPowerUsage       = update(action.data.uploadPowerUsage,    newState.uploadPowerUsage);
        newState.uploadHighFrequencyPowerUsage = update(action.data.uploadHighFrequencyPowerUsage,    newState.uploadHighFrequencyPowerUsage);
        newState.uploadDeviceDetails    = update(action.data.uploadDeviceDetails, newState.uploadDeviceDetails);

        if (action.type === 'USER_UPDATE') {
          newState.updatedAt = getTime(action.data.updatedAt);
        }
        else {
          newState.updatedAt = update(action.data.updatedAt, newState.updatedAt);
        }
        return newState;
      }
      return state;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};
