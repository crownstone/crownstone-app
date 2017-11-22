import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';
import { Scene, Router, Actions, DefaultRenderer } from 'react-native-router-flux';
import { eventBus }                  from '../util/EventBus'
import { reducerCreate }             from './store/reducers/navigation'
import { OptionPopup }               from '../views/components/OptionPopup'
import { Processing }                from '../views/components/Processing'
import { DfuOverlay }                from '../views/overlays/DfuOverlay'
import { ErrorOverlay }              from '../views/overlays/ErrorOverlay'
import { LocalizationSetupStep1 }    from '../views/overlays/LocalizationSetupStep1'
import { LocalizationSetupStep2 }    from '../views/overlays/LocalizationSetupStep2'
import { TapToToggleCalibration }    from '../views/overlays/TapToToggleCalibration'
import { BleStateOverlay }           from '../views/overlays/BleStateOverlay'
import { LocationPermissionOverlay } from '../views/overlays/LocationPermissionOverlay'
import { SphereSelectionOverlay }    from "../views/overlays/SphereSelectionOverlay";
import { Views }                     from './Views'
import { styles, colors, screenWidth, screenHeight } from '../views/styles'
import { Icon } from '../views/components/Icon';
import { Util } from '../util/Util'
import { WhatsNewOverlay }           from "../views/overlays/WhatsNewOverlay";


export class Router_IOS extends Component {
  render() {
    return (
      <View style={{flex:1}}>
        <Router createReducer={reducerCreate} store={this.props.store} {...navBarStyle} getSceneStyle={() => {return {backgroundColor: colors.menuBackground.hex}}} backgrounds={this.props.backgrounds} getBackground={this.props.getBackground.bind(this)} eventBus={eventBus}>
          <Scene key="Root" hideNavBar={false}>
            <Scene key="loginSplash"                component={Views.LoginSplash}                hideNavBar={true}  type="reset" initial={this.props.loggedIn === false} />
            <Scene key="login"                      component={Views.Login}                      hideNavBar={true}  />
            <Scene key="tutorial"                   component={Views.Tutorial}                   hideNavBar={true}  />
            <Scene key="register"                   component={Views.Register}                   hideNavBar={false} title="Register" {...navBarStyle} />
            <Scene key="registerConclusion"         component={Views.RegisterConclusion}         hideNavBar={false} title="Almost Finished!" type="reset" {...navBarStyle} />
            <Scene key="pictureView"                component={Views.PictureView}                hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="cameraRollView"             component={Views.CameraRollView}             hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="aiStart"                    component={Views.AiStart}                    hideNavBar={false} panHandlers={null} direction="vertical" title="Hello!" />
            <Scene key="roomTraining_roomSize"      component={Views.RoomTraining_roomSize}      hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="roomTraining"               component={Views.RoomTraining}               hideNavBar={true}  panHandlers={null} direction="horizontal" />
            <Scene key="roomSelection"              component={Views.RoomSelection}              hideNavBar={true}  panHandlers={null} direction="vertical" title="Move to which Room?" />
            <Scene key="roomIconSelection"          component={Views.RoomIconSelection}          hideNavBar={true}  panHandlers={null} direction="vertical" title="Pick an Icon" />
            <Scene key="roomAdd"                    component={Views.RoomAdd}                    hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="roomEdit"                   component={Views.RoomEdit}                   hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="deviceEdit"                 component={Views.DeviceEdit}                 hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="selectFromList"             component={Views.SelectFromList}             hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="deviceScheduleEdit"         component={Views.DeviceScheduleEdit}         hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="messageAdd"                 component={Views.MessageAdd}                 hideNavBar={true}  panHandlers={null} direction="vertical" />
            <Scene key="deviceIconSelection"        component={Views.DeviceIconSelection}        hideNavBar={true}  panHandlers={null} direction="vertical" title="Pick an Icon" />
            <Scene key="settingsPluginRecoverStep1" component={Views.SettingsPluginRecoverStep1} hideNavBar={false} direction="vertical" title="Recover Crownstone" />
            <Scene key="settingsPluginRecoverStep2" component={Views.SettingsPluginRecoverStep2} hideNavBar={false} title="Recover Crownstone" />
            <Scene key="tabBar" tabs={true} hideNavBar={true} tabBarSelectedItemStyle={{backgroundColor:colors.menuBackground.hex}} tabBarStyle={{backgroundColor:colors.menuBackground.hex}} type="reset" initial={this.props.loggedIn}>
              <Scene key="overview" tabTitle="Overview" icon={TabIcon} iconString="ios-color-filter-outline" >
                <Scene key="sphereOverview"         component={Views.SphereOverview}             hideNavBar={true} />
                <Scene key="roomOverview"           component={Views.RoomOverview}               hideNavBar={true} />
                <Scene key="deviceOverview"         component={Views.DeviceOverview}             hideNavBar={true} />
                <Scene key="applianceSelection"     component={Views.ApplianceSelection}         hideNavBar={false} direction="vertical" title="Select Device Type" />
                <Scene key="applianceAdd"           component={Views.ApplianceAdd}               hideNavBar={true} direction="vertical" />
                <Scene key="deviceBehaviourEdit"    component={Views.DeviceBehaviourEdit}        hideNavBar={false} title="Edit Behaviour" />
              </Scene>
              <Scene key="messages" tabTitle="Messages" icon={TabIcon} iconString="ios-mail" {...navBarStyle} badgeOnMessages={true} initial={false} >
                <Scene key="messageInbox"     component={Views.MessageInbox}    hideNavBar={true} />
                <Scene key="messageThread"    component={Views.MessageThread}   hideNavBar={true} />
              </Scene>
              <Scene key="settings" tabTitle="Settings" icon={TabIcon} iconString="ios-cog" {...navBarStyle}  initial={false} >
                <Scene key="settingsOverview"           component={Views.SettingsOverview}          hideNavBar={true} title="Settings"/>
                <Scene key="settingsProfile"            component={Views.SettingsProfile}           hideNavBar={false} title="Your Profile" />
                <Scene key="settingsPrivacy"            component={Views.SettingsPrivacy}           hideNavBar={false} title="Privacy" />
                <Scene key="settingsApp"                component={Views.SettingsApp}               hideNavBar={false} title="Preferences" />
                <Scene key="settingsMeshOverview"       component={Views.SettingsMeshOverview}      hideNavBar={false} title="Mesh Overview" />
                <Scene key="settingsDeveloper"          component={Views.SettingsDeveloper}         hideNavBar={false} title="Developer" />
                <Scene key="settingsSphereOverview"     component={Views.SettingsSphereOverview}    hideNavBar={false} title="Sphere Overview" />
                <Scene key="settingsSphere"             component={Views.SettingsSphere}            hideNavBar={true} title="[Sphere name here]" />
                <Scene key="settingsSphereUser"         component={Views.SettingsSphereUser}        hideNavBar={false} title="[Username here]" />
                <Scene key="settingsSphereInvitedUser"  component={Views.SettingsSphereInvitedUser} hideNavBar={false} title="[Username here]" />
                <Scene key="settingsSphereInvite"       component={Views.SettingsSphereInvite}      hideNavBar={false} title="Invite" />
              </Scene>
            </Scene>
          </Scene>
        </Router>
        <DfuOverlay store={this.props.store} />
        <LocalizationSetupStep1 store={this.props.store} />
        <LocalizationSetupStep2 store={this.props.store} />
        <TapToToggleCalibration store={this.props.store} />
        <SphereSelectionOverlay store={this.props.store} />
        <LocationPermissionOverlay />
        <BleStateOverlay />
        <ErrorOverlay store={this.props.store} />
        <WhatsNewOverlay store={this.props.store} />
        <OptionPopup />
        <Processing />
      </View>
    );
  }
}


class TabIcon extends Component {
  unsubscribe = null;
  constructor(props) {
    super(props);

    this.state = { badge: 0, badgeScale: new Animated.Value(1) }
  }

  componentDidMount() {
    if (this.props.badgeOnMessages) {
      this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
        let state = this.props.store.getState();
        let activeSphere = state.app.activeSphere;

        let change = data.change;
        if (change.changeMessageState && change.changeMessageState.sphereIds[activeSphere]) {
          let newMessages = state.spheres[activeSphere].config.newMessageFound;

          if (this.state.badge === 0 && newMessages) {
            this.setState({ badge : 1 });
            Animated.sequence([
              Animated.timing(this.state.badgeScale,{ toValue: 4, duration: 100 }),
              Animated.timing(this.state.badgeScale,{ toValue: 1, duration: 150 }),
            ]).start()
          }
          if (this.state.badge > 0 && !newMessages) {
            this.setState({ badge : 0 });
          }
        }
      });
    }
  }

  componentWillUnmount() {
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
    }
  }

  render(){
    let alertSize = 14;
    const animatedStyle = {
      transform: [
        { scale: this.state.badgeScale },
      ]
    };
    let backgroundColor = this.state.badgeScale.interpolate({
      inputRange: [1,4],
      outputRange: [colors.green.hex, colors.csOrange.hex]
    });

    return (
      <View style={{flex:1,alignItems:'center', justifyContent:'center'}}>
        <Icon
          name={this.props.iconString}
          size={31}
          color={this.props.selected ?  colors.menuTextSelected.hex : colors.menuText.hex}
          style={{backgroundColor:'transparent', padding:0, margin:0}}
        />
        <Text style={{
          fontSize:11,
          fontWeight:'200',
          color: (this.props.selected ?  colors.menuTextSelected.hex : colors.menuText.hex)
        }}>{this.props.tabTitle}</Text>
        { this.state.badge > 0 ?
          <Animated.View style={
            [animatedStyle,{
            position:'absolute',
            top:3,
            right:0,
            width:alertSize,
            height:alertSize,
            borderRadius:0.5*alertSize,
            backgroundColor:backgroundColor,
            borderWidth: 2,
            borderColor: colors.white.hex,
          }]} /> : undefined }
      </View>
    );
  }
}


let navBarStyle = {
  backgroundColor:colors.menuBackground.hex,
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  titleStyle:{color:'white'},
};


