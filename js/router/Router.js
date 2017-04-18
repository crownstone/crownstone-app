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
import { StoreManager }           from './store/storeManager'
import { LocationHandler }        from '../native/LocationHandler'
import { AdvertisementHandler }   from '../native/AdvertisementHandler'
import { KeepAliveHandler }       from '../native/KeepAliveHandler'
import { SetupStateHandler }      from '../native/setup/SetupStateHandler'
import { StoneStateHandler }      from '../native/StoneStateHandler'
import { BatchCommandHandler }    from '../logic/BatchCommandHandler'
// import { NotificationHandler }    from '../notifications/NotificationHandler'
import { Scheduler }              from '../logic/Scheduler'
import { eventBus }               from '../util/EventBus'
import { prepareStoreForUser }    from '../util/DataUtil'
import { Util }                   from '../util/Util'
import { AppUtil }                from '../util/AppUtil'
import { LOG, LogProcessor }      from '../logging/Log'
import { INITIALIZER }            from '../Initialize'
import { CLOUD }                  from '../cloud/cloudAPI'
import { Background }             from '../views/components/Background'
import { styles, colors, screenWidth, screenHeight } from '../views/styles'
import { Router_IOS } from './RouterIOS';
import { Router_Android } from './RouterAndroid';

let store = {};

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

  componentDidMount() {
    // check what we should do with this data.
    let interpretData = () => {
      store = StoreManager.getStore();
      INITIALIZER.start(store);
      if (store.hasOwnProperty('getState')) {
        dataLoginValidation()
      }
      else {
        this.setState({storeInitialized:true, loggedIn:false});
      }

      this.unsubscribe.forEach((callback) => {callback()});
      this.unsubscribe = [];
    };

    // if there is a user that is listed as logged in, verify his account.
    let dataLoginValidation = () => {
      let state = store.getState();
      // pass the store to the singletons
      LogProcessor.loadStore(store);
      LocationHandler.loadStore(store);
      AdvertisementHandler.loadStore(store);
      Scheduler.loadStore(store);
      StoneStateHandler.loadStore(store);
      SetupStateHandler.loadStore(store);
      KeepAliveHandler.loadStore(store);
      // NotificationHandler.loadStore(store);

      // clear the temporary data like presence, state and disability of stones so no old data will be shown
      prepareStoreForUser(store);
      
      // if we have an accessToken, we proceed with logging in automatically
      if (state.user.accessToken !== null) {
        // in the background we check if we're authenticated, if not we log out.
        CLOUD.setAccess(state.user.accessToken);
        CLOUD.forUser(state.user.userId).getUserData({background:true})
          .then((reply) => {
            LOG.info("Verified User.", reply);
            CLOUD.sync(store, true);
          })
          .catch((reply) => {
            LOG.info("COULD NOT VERIFY USER -- ERROR", reply);
            if (reply.status === 401) {
              AppUtil.logOut();
              Alert.alert("Please log in again.", undefined, [{text:'OK'}]);
            }
          });
        this.setState({storeInitialized:true, loggedIn:true});
        eventBus.emit("appStarted");
      }
      else {
        this.setState({storeInitialized:true, loggedIn:false});
      }
    };

    // there can be a race condition where the event has already been fired before this module has initialized
    // This check is to ensure that it doesn't matter what comes first.
    if (StoreManager.isInitialized() === true) {
      interpretData();
    }
    else {
      this.unsubscribe.push(eventBus.on('storeInitialized', interpretData));
    }
  }

  /**
   * Preloading backgrounds
   */
  componentWillMount() {
    this.backgrounds.setup                   = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/setupBackground.png')} />;
    this.backgrounds.main                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLight.png')} />;
    this.backgrounds.mainRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLightNotConnected.png')} />;
    this.backgrounds.mainRemoteConnected     = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/mainBackgroundLightConnected.png')} />;
    this.backgrounds.menu                    = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackground.png')} />;
    this.backgrounds.menuRemoteNotConnected  = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackgroundRemoteNotConnected.png')} />;
    this.backgrounds.menuRemoteConnected     = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/menuBackgroundRemoteConnected.png')} />;
    this.backgrounds.mainDarkLogo            = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/backgroundWLogo.png')} />;
    this.backgrounds.mainDark                = <Image style={[styles.fullscreen,{resizeMode:'cover'}]} source={require('../images/background.png')} />;
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

