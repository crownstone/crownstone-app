import * as React from 'react'; import { Component } from 'react';
import {
  AppState,
  Alert,
  AppRegistry,
  Navigator,
  Dimensions,
  Image,
  Platform,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  View
} from 'react-native';
import { StoreManager }    from './store/storeManager'
import { BackgroundProcessHandler } from '../backgroundProcesses/BackgroundProcessHandler'
import { eventBus }        from '../util/EventBus'
import { LOG }             from '../logging/Log'
import { Background }      from '../views/components/Background'
import { Router_IOS }      from './RouterIOS';
import { Router_Android }  from './RouterAndroid';
import { styles, colors, screenWidth, screenHeight } from '../views/styles'


export class AppRouter extends Component {

  constructor() {
    super();
    this.state = {initialized:false, loggedIn: false};
    this.unsubscribe = [];
    this.renderState = undefined;
    this.backgrounds = {
      setup:undefined,
      main: undefined,
      mainRemoteNotConnected: undefined,
      menu: undefined,
      mainDarkLogo: undefined,
      mainDark: undefined
    };
  }

  /**
   * Preloading backgrounds
   */
  componentWillMount() {
    if (BackgroundProcessHandler.storeInitialized === true) {
      this.setState({storeInitialized: true, loggedIn: BackgroundProcessHandler.userLoggedIn});
    }
    else {
      this.unsubscribe.push(
        eventBus.on('storePrepared', (result) => {
          this.setState({storeInitialized:true, loggedIn: result.userLoggedIn});
        })
      );
    }

    this.backgrounds.setup                   = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/setupBackground.png')} />;
    this.backgrounds.main                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLight.png')} />;
    this.backgrounds.mainRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLightNotConnected.png')} />;
    this.backgrounds.mainRemoteConnected     = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLightConnected.png')} />;
    this.backgrounds.menu                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackground.png')} />;
    this.backgrounds.menuRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackgroundRemoteNotConnected.png')} />;
    this.backgrounds.menuRemoteConnected     = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackgroundRemoteConnected.png')} />;
    this.backgrounds.mainDarkLogo            = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/backgroundWLogo.png')} />;
    this.backgrounds.mainDark                = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/background.png')} />;
    this.backgrounds.stoneDetailsBackground  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/stoneDetails.png')} />;
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
    LOG.debug("RENDERING ROUTER");
    if (this.state.storeInitialized === true) {
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
      return <Background hideInterface={true} image={this.backgrounds.mainDarkLogo} />
    }
  }
}

