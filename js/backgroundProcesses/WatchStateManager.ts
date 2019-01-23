import { Platform } from 'react-native'

class WatchStateManagerClass {
  _store
  initialized = false

  constructor() {

  }

  loadStore(store) {
    this._store = store;
    this.init()
  }

  init() {
    if (this.initialized === false) {
      if (Platform.OS === 'ios') {
        // listen to events that might change the name of the stones, or added and removed stones.
      }
      this.initialized = true;
    }
  }

  _updateNames() {
    let state = this._store.getState();
    let nameObject = {};


    Object.keys(state.spheres).forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      Object.keys(sphere.stones).forEach((stoneId) => {
        // Util.data
      })
    })
  }


}

export const WatchStateManager = new WatchStateManagerClass()