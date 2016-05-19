import { NativeModules } from 'react-native';


export const NATIVE_API = {
  getClosestCleanMacAdress: () => {},
  claimCrownstone: () => {},
  getActiveGroupId: () => {},
  addGroupUUID: () => {}
}

// usage:
// let TitleMaker = NativeModules.TitleMaker;
// TitleMaker.get(1, (result) => {
//   this.state.title = result.title;
//   this.setState(this.state);
// });