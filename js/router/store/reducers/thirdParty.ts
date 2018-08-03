import {combineReducers} from "redux";
import toonReducer from './thirdPartyReducers/toon'

// thirdPartyReducer
export default combineReducers({
  toons: toonReducer,
});
