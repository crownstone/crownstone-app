import {combineReducers} from "redux";
import toonReducer from './thirdPartyReducers/toon'

// thirdPartyReducer
export default combineReducers({
  toon: toonReducer,
});
