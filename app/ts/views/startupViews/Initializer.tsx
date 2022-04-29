import * as React from 'react';
import {Component} from 'react';
import {Platform,} from 'react-native';
import {StoreManager} from '../../database/storeManager'
import {BackgroundProcessHandler} from '../../backgroundProcesses/BackgroundProcessHandler'
import {Splash} from "./Splash";
import {core} from "../../Core";
import {NavigationUtil} from "../../util/NavigationUtil";
import {Stacks} from "../Stacks";
import {stylesUpdateConstants} from "../../views/styles";
import {Bluenet} from "../../native/libInterface/Bluenet";
import SplashScreen from 'react-native-splash-screen';


export class Initializer extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    // initialize the views to tell android lib we are starting the UI.
    Bluenet.viewsInitialized();
  }

  componentDidMount() {
    let startUp = () => {
      if (Platform.OS === "android") {
        SplashScreen.hide();
        stylesUpdateConstants();
      }

      // This is a last chance fallback if a user is new but has for some reason never been marked as "not New"
      let store = StoreManager.getStore();
      let state = store.getState();
      // this should have been covered by the naming of the AI. This is a fallback.
      if (state.user.accessToken !== null && state.user.isNew !== false) {
        store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
        core.eventBus.emit("userLoggedInFinished");
      }

      if (BackgroundProcessHandler.userLoggedInReady) {
        this.props.setAppState(true, true);
      }
      else if (BackgroundProcessHandler.userLoggedIn) {
        this.props.setAppState(true, false);
      }
      else {
        this.props.setAppState(false, false);
      }
    };

    if (BackgroundProcessHandler.storePrepared === true) {
      startUp();
    }
    else {
      this.unsubscribe.push(
        core.eventBus.on('storePrepared', () => {
          startUp();
        })
      );
    }
  }

  componentWillUnmount() { // cleanup
    this.cleanUp();
  }

  cleanUp() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    return <Splash />;
  }
}

