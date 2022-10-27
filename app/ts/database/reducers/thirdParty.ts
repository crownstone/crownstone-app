import {combineReducers} from "redux";
import toonReducer from './thirdPartyReducers/toon'
// import hueReducer from './thirdPartyReducers/hue'

// thirdPartyReducer
export default combineReducers({
  toons: toonReducer,
  // hue:   hueReducer,
});
