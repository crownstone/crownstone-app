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
import { styles} from '../views/styles'
import SplashScreen from 'react-native-splash-screen'
import {Splash} from "../views/startupViews/Splash";


interface backgroundType {
  setup:any,
  main: any,
  mainRemoteNotConnected: any,
  menuRemoteNotConnected: any,
  menu: any,
  mainDarkLogo: any,
  mainDark: any,
  detailsDark: any,

  setup_source: any,
  main_source: any,
  mainRemoteNotConnected_source: any,
  menuRemoteNotConnected_source: any,
  menu_source: any,
  mainDarkLogo_source: any,
  mainDark_source: any,
  detailsDark_source: any,
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

    setup_source: undefined,
    main_source: undefined,
    mainRemoteNotConnected_source: undefined,
    menuRemoteNotConnected_source: undefined,
    menu_source: undefined,
    mainDarkLogo_source: undefined,
    mainDark_source: undefined,
    detailsDark_source: undefined,
  };
  unsubscribe = [];

  constructor(props) {
    super(props);
    let initialState = {loggedIn: false, storePrepared: false};

    if (BackgroundProcessHandler.storePrepared === true) {
      initialState = {storePrepared: true, loggedIn: BackgroundProcessHandler.userLoggedIn};
      if (Platform.OS === "android") {
        SplashScreen.hide();
      }
    }
    else {
      this.unsubscribe.push(
        eventBus.on('storePrepared', (result) => {
          this.setState({storePrepared:true, loggedIn: result.userLoggedIn});
          if (Platform.OS === "android") {
            SplashScreen.hide();
          }
        })
      );
    }

    this.backgrounds.main_source                   = require('../images/mainBackgroundLight.png')
    this.backgrounds.menu_source                   = require('../images/menuBackground.png')
    this.backgrounds.mainRemoteNotConnected_source = require('../images/mainBackgroundLightNotConnected.png')
    this.backgrounds.menuRemoteNotConnected_source = require('../images/menuBackgroundRemoteNotConnected.png')
    this.backgrounds.mainDarkLogo_source           = require('../images/backgroundWLogo.png')
    this.backgrounds.mainDark_source               = require('../images/background.png')
    this.backgrounds.detailsDark_source            = require('../images/stoneDetails.png')

    this.backgrounds.main                   = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={this.backgrounds.main_source} />
    this.backgrounds.menu                   = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={this.backgrounds.menu_source} />
    this.backgrounds.mainRemoteNotConnected = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={this.backgrounds.mainRemoteNotConnected_source} />
    this.backgrounds.menuRemoteNotConnected = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={this.backgrounds.menuRemoteNotConnected_source} />
    this.backgrounds.mainDarkLogo           = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={this.backgrounds.mainDarkLogo_source} />
    this.backgrounds.mainDark               = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={this.backgrounds.mainDark_source} />
    this.backgrounds.detailsDark            = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={this.backgrounds.detailsDark_source} />

    this.state = initialState;
  }


  componentWillUnmount() { // cleanup
    this.cleanUp()
  }

  getBackgroundSource(type, remotely) {
    let imageName;
    switch (type) {
      case "menu":
        imageName = this.backgrounds.menu_source;
        if (remotely === true) {
          imageName = this.backgrounds.menuRemoteNotConnected_source;
        }
        break;
      case "dark":
        imageName = this.backgrounds.main_source;
        if (remotely === true) {
          imageName = this.backgrounds.mainRemoteNotConnected_source;
        }
        break;
      default:
        imageName = this.backgrounds.main_source;
        if (remotely === true) {
          imageName = this.backgrounds.mainRemoteNotConnected_source;
        }
        break;
    }

    return imageName;
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
            getBackgroundSource={this.getBackgroundSource.bind(this)}
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
            getBackgroundSource={this.getBackgroundSource.bind(this)}
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

