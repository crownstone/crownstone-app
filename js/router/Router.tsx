import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Platform,
} from 'react-native';
import { StoreManager }    from './store/storeManager'
import { BackgroundProcessHandler } from '../backgroundProcesses/BackgroundProcessHandler'
import { eventBus }        from '../util/EventBus'
import { LOG }             from '../logging/Log'
import { Background }      from '../views/components/Background'
import { Router_IOS }      from './RouterIOS';
import { Router_Android }  from './RouterAndroid';
import { styles, colors, screenWidth, screenHeight } from '../views/styles'
import SplashScreen from 'react-native-splash-screen'


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

  backgrounds : backgroundType;
  unsubscribe = [];

  constructor(props) {
    super(props);
    this.state = {loggedIn: false, storePrepared: false};
  }

  /**
   * Preloading backgrounds
   */
  componentWillMount() {
    if (BackgroundProcessHandler.storePrepared === true) {
      this.setState({storePrepared: true, loggedIn: BackgroundProcessHandler.userLoggedIn});
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

    this.backgrounds.main                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLight.png')} />;
    this.backgrounds.menu                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackground.png')} />;
    this.backgrounds.mainRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLightNotConnected.png')} />;
    this.backgrounds.menuRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackgroundRemoteNotConnected.png')} />;
    this.backgrounds.mainDarkLogo            = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/backgroundWLogo.png')} />;
    this.backgrounds.mainDark                = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/background.png')} />;
    this.backgrounds.detailsDark             = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/stoneDetails.png')} />;
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
      return <Background hideInterface={true} image={this.backgrounds.mainDarkLogo} />
    }
  }
}

