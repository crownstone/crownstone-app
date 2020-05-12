import { update, getTime, refreshDefaults } from './reducerUtil'

let defaultSettings : SceneData = {
  name: '',
  picture:  null,
  pictureId:  null,
  pictureSource: null, // PICTURE_GALLERY_TYPES
  cloudId: null,
  data: {}, // stoneUID: switchState
  updatedAt: 0,
};

let sceneReducer = (state = defaultSettings, action : any = {}) => {
  switch (action.type) {
    case 'UPDATE_SCENE_CLOUD_ID':
      if (action.data) {
        let newState = {...state};
        newState.cloudId = update(action.data.cloudId, newState.cloudId);
        return newState;
      }
      return state;
    case 'ADD_SCENE':
    case 'UPDATE_SCENE':
      if (action.data) {
        let newState = {...state};
        newState.name          = update(action.data.name,          newState.name);
        newState.picture       = update(action.data.picture,       newState.picture);
        newState.pictureId     = update(action.data.pictureId,     newState.pictureId);
        newState.pictureSource = update(action.data.pictureSource, newState.pictureSource);
        newState.data          = update(action.data.data,          newState.data);
        newState.cloudId       = update(action.data.cloudId,       newState.cloudId);
        newState.updatedAt     = getTime(action.data.updatedAt);
        return newState;
      }
      return state;

    case 'SPHERE_SCENE_REPAIR_PICTURE':
      let newState = {...state};
      newState.picture    = null;
      newState.pictureId  = null;
      newState.pictureSource = null;
      return newState;
    case 'REFRESH_DEFAULTS':
      return refreshDefaults(state, defaultSettings);
    default:
      return state;
  }
};


// stonesReducer
export default (state = {}, action : any = {}) => {
  switch (action.type) {
    case 'REMOVE_ALL_SCENES':
      return {};
    case 'REMOVE_SCENE':
      let stateCopy = {...state};
      delete stateCopy[action.sceneId];
      return stateCopy;
    default:
      if (action.sceneId !== undefined) {
        if (state[action.sceneId] !== undefined || action.type === "ADD_SCENE") {
          return {
            ...state,
            ...{[action.sceneId]: sceneReducer(state[action.sceneId], action)}
          };
        }
      }
      return state;
  }
};

