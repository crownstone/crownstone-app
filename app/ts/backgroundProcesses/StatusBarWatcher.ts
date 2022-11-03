import { Platform, AppState,  StatusBar } from "react-native";
const LIGHT = 'light-content';

const DARK  = 'dark-content';

/**
 * iOS will not always set the color of the statusbar correctly after restoring from a background state.
 * This class will try to ensure the color of the tab bar.
 */
class StatusBarWatcherClass {
  _initialized: boolean = false;

  dirty = false;
  lastSet = null;
  restoreTimeout;

  init() {
    if (this._initialized === false) {
      AppState.addEventListener('change', (appState) => {
        if (appState !== 'active') {
          this.dirty = true;
        }
        else {
          this.restore();
        }

      });
    }
    this._initialized = true;
  }

  restore() {
    clearTimeout(this.restoreTimeout);
    this.restoreTimeout = setTimeout(() => {
      if (this.lastSet) {
        this.dirty = true;
        if (this.lastSet === LIGHT) {
          this.setLightStatusBar();
        }
        else {
          this.setDarkStatusBar();
        }
      }
    }, 1500)
  }

  setLightStatusBar() {
    if (Platform.OS === 'ios') {
      if (this.lastSet === null || this.dirty) {
        StatusBar.setBarStyle(DARK);
      }
      StatusBar.setBarStyle(LIGHT);
      this.lastSet = LIGHT;
      this.dirty = false;
    }
    else {
      StatusBar.setBarStyle(LIGHT);
    }
  }


  setDarkStatusBar() {
    if (Platform.OS === 'ios') {
      if (this.lastSet === null || this.dirty) {
        StatusBar.setBarStyle(LIGHT);
      }
      StatusBar.setBarStyle(DARK);
      this.lastSet = DARK;
      this.dirty = false;
    }
    else {
      StatusBar.setBarStyle(DARK);
    }
  }
}


export const StatusBarWatcher = new StatusBarWatcherClass();
