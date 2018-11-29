
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Router", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Platform,
} from 'react-native';
import { StoreManager }    from './store/storeManager'
import { BackgroundProcessHandler } from '../backgroundProcesses/BackgroundProcessHandler'
import { eventBus }        from '../util/EventBus'
import { LOG }             from '../logging/Log'
import { Router_IOS }      from './RouterIOS';
import { Router_Android }  from './RouterAndroid';
import { styles}           from '../views/styles'
import SplashScreen        from 'react-native-splash-screen'
import { Splash }          from "../views/startupViews/Splash";
const Actions = require('react-native-router-flux').Actions;

interface backgroundType {
  setup:any,
  main: any,
  mainRemoteNotConnected: any,
  menuRemoteNotConnected: any,
  menu: any,
  mainDarkLogo: any,
  mainDark: any,
  detailsDark: any,
}

export class AppRouter extends Component<any, {loggedIn: boolean, storePrepared: boolean}> {

  backgrounds : backgroundType = {
    setup:undefined,
    main: undefined,
    mainRemoteNotConnected: undefined,
    menuRemoteNotConnected: undefined,
    menu: undefined,
    mainDarkLogo: undefined,
    mainDark: undefined,
    detailsDark: undefined,
  };
  unsubscribe = [];

  constructor(props) {
    super(props);
    let initialState = {loggedIn: false, storePrepared: false};

    let startUp = () => {
      if (Platform.OS === "android") {
        SplashScreen.hide();
      }

      // This is a last chance fallback if a user is new but has for some reason never been marked as "not New"
      let store = StoreManager.getStore();
      let state = store.getState();
      // this should have been covered by the naming of the AI. This is a fallback.
      if (state.user.accessToken !== null && state.user.isNew !== false) {
        store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
        eventBus.emit("userLoggedInFinished");
      }
    }

    if (BackgroundProcessHandler.storePrepared === true) {
      initialState = {storePrepared: true, loggedIn: BackgroundProcessHandler.userLoggedIn};
      startUp();
    }
    else {
      this.unsubscribe.push(
        eventBus.on('storePrepared', (result) => {
          startUp();
          this.setState({storePrepared:true, loggedIn: result.userLoggedIn});
        })
      );
    }

    this.backgrounds.main                   = require('../images/mainBackgroundLight.png')
    this.backgrounds.menu                   = require('../images/menuBackground.png')
    this.backgrounds.mainRemoteNotConnected = require('../images/mainBackgroundLightNotConnected.png')
    this.backgrounds.menuRemoteNotConnected = require('../images/menuBackgroundRemoteNotConnected.png')
    this.backgrounds.mainDarkLogo           = require('../images/backgroundWLogo.png')
    this.backgrounds.mainDark               = require('../images/background.png')
    this.backgrounds.detailsDark            = require('../images/stoneDetails.png')

    this.state = initialState;
  }


  componentWillUnmount() { // cleanup
    this.cleanUp()
  }

  getBackground(type, remotely) {
    let backgroundImage;
    switch (type) {
      case "menu":
        backgroundImage = this.backgrounds.menu;
        if (remotely === true) {
          backgroundImage = this.backgrounds.menuRemoteNotConnected;
        }
        break;
      case "dark":
        backgroundImage = this.backgrounds.main;
        if (remotely === true) {
          backgroundImage = this.backgrounds.mainRemoteNotConnected;
        }
        break;
      default:
        backgroundImage = this.backgrounds.main;
        if (remotely === true) {
          backgroundImage = this.backgrounds.mainRemoteNotConnected;
        }
        break;
    }

    return backgroundImage;
  }

  cleanUp() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    LOG.info("RENDERING ROUTER");
    if (this.state.storePrepared === true) {
      let store = StoreManager.getStore();
      if (Platform.OS === 'android') {
        return (
          <Router_Android
            store={store}
            backgrounds={this.backgrounds}
            getBackground={this.getBackground.bind(this)}
            loggedIn={this.state.loggedIn}
          />
        );
      }
      else {
        return (
          <Router_IOS
            store={store}
            backgrounds={this.backgrounds}
            getBackground={this.getBackground.bind(this)}
            loggedIn={this.state.loggedIn}
          />
        );
      }
    }
    else {
      // this is the await store part.
      return (
        <Splash backgrounds={this.backgrounds} />
      )
    }
  }
}

