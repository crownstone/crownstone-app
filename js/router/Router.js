"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_1 = require("react");
const react_native_1 = require("react-native");
const storeManager_1 = require("./store/storeManager");
const BackgroundProcessHandler_1 = require("../backgroundProcesses/BackgroundProcessHandler");
const EventBus_1 = require("../util/EventBus");
const Log_1 = require("../logging/Log");
const Background_1 = require("../views/components/Background");
const RouterIOS_1 = require("./RouterIOS");
const RouterAndroid_1 = require("./RouterAndroid");
const styles_1 = require("../views/styles");
const react_native_splash_screen_1 = require("react-native-splash-screen");
class AppRouter extends react_1.Component {
    constructor(props) {
        super(props);
        this.unsubscribe = [];
        this.state = { loggedIn: false, storePrepared: false };
    }
    /**
     * Preloading backgrounds
     */
    componentWillMount() {
        if (BackgroundProcessHandler_1.BackgroundProcessHandler.storePrepared === true) {
            this.setState({ storePrepared: true, loggedIn: BackgroundProcessHandler_1.BackgroundProcessHandler.userLoggedIn });
            if (react_native_1.Platform.OS === "android") {
                react_native_splash_screen_1.default.hide();
            }
        }
        else {
            this.unsubscribe.push(EventBus_1.eventBus.on('storePrepared', (result) => {
                this.setState({ storePrepared: true, loggedIn: result.userLoggedIn });
                if (react_native_1.Platform.OS === "android") {
                    react_native_splash_screen_1.default.hide();
                }
            }));
        }
        this.backgrounds.main = <react_native_1.Image style={[styles_1.styles.fullscreen, { resizeMode: 'cover' }]} source={require('../images/mainBackgroundLight.png')}/>;
        this.backgrounds.menu = <react_native_1.Image style={[styles_1.styles.fullscreen, { resizeMode: 'cover' }]} source={require('../images/menuBackground.png')}/>;
        this.backgrounds.mainRemoteNotConnected = <react_native_1.Image style={[styles_1.styles.fullscreen, { resizeMode: 'cover' }]} source={require('../images/mainBackgroundLightNotConnected.png')}/>;
        this.backgrounds.menuRemoteNotConnected = <react_native_1.Image style={[styles_1.styles.fullscreen, { resizeMode: 'cover' }]} source={require('../images/menuBackgroundRemoteNotConnected.png')}/>;
        this.backgrounds.mainDarkLogo = <react_native_1.Image style={[styles_1.styles.fullscreen, { resizeMode: 'cover' }]} source={require('../images/backgroundWLogo.png')}/>;
        this.backgrounds.mainDark = <react_native_1.Image style={[styles_1.styles.fullscreen, { resizeMode: 'cover' }]} source={require('../images/background.png')}/>;
        this.backgrounds.detailsDark = <react_native_1.Image style={[styles_1.styles.fullscreen, { resizeMode: 'cover' }]} source={require('../images/stoneDetails.png')}/>;
    }
    componentWillUnmount() {
        this.cleanUp();
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
        this.unsubscribe.forEach((callback) => { callback(); });
        this.unsubscribe = [];
    }
    render() {
        Log_1.LOG.info("RENDERING ROUTER");
        if (this.state.storePrepared === true) {
            let store = storeManager_1.StoreManager.getStore();
            if (react_native_1.Platform.OS === 'android') {
                return (<RouterAndroid_1.Router_Android store={store} backgrounds={this.backgrounds} getBackground={this.getBackground.bind(this)} loggedIn={this.state.loggedIn}/>);
            }
            else {
                return (<RouterIOS_1.Router_IOS store={store} backgrounds={this.backgrounds} getBackground={this.getBackground.bind(this)} loggedIn={this.state.loggedIn}/>);
            }
        }
        else {
            // this is the await store part.
            return <Background_1.Background hideInterface={true} image={this.backgrounds.mainDarkLogo}/>;
        }
    }
}
exports.AppRouter = AppRouter;
