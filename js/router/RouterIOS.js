import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';
import { Scene, Tabs, Router, Actions, Modal, DefaultRenderer, Stack } from 'react-native-router-flux';
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
import { styles, colors, tabBarMargin, screenWidth, tabBarHeight } from '../views/styles'
import { Icon }                      from '../views/components/Icon';
import { WhatsNewOverlay }           from "../views/overlays/WhatsNewOverlay";
import { LockOverlay }               from "../views/overlays/LockOverlay";
import { AnimatedMenu }              from "../views/components/animated/AnimatedMenu";


export class Router_IOS extends Component {
  render() {
    return (
      <View style={{flex:1}}>
        <Router createReducer={reducerCreate} store={this.props.store} {...navBarStyle} backgrounds={this.props.backgrounds} getBackground={this.props.getBackground.bind(this)} eventBus={eventBus}>
          <Modal>
            <Scene key="loginSplash"                    component={Views.LoginSplash}                hideNavBar={true} initial={false && this.props.loggedIn === false} />
            <Scene key="login"                          component={Views.Login}                      hideNavBar={true} />
            <Scene key="logout"                         component={Views.Logout}                     hideNavBar={true} />
            <Scene key="tutorial"                       component={Views.Tutorial}                   />
            <Scene key="register"                       component={Views.Register}                   />
            <Scene key="registerConclusion"             component={Views.RegisterConclusion}         type="reset" />
            <Tabs key="tabBar" showLabel={false} hideNavBar={true} tabBarSelectedItemStyle={{backgroundColor:colors.menuBackground.hex}} tabBarStyle={{backgroundColor:colors.menuBackground.hex}} type="reset" initial={this.props.loggedIn}>
                <Scene key="overview" tabTitle="Overview" icon={TabIcon} iconString="ios-color-filter-outline" >
                  <Scene key="sphereOverview"             component={Views.SphereOverview}             />
                  <Scene key="deviceOverview"             component={Views.DeviceOverview}             />
                  <Scene key="roomOverview"               component={Views.RoomOverview}               />
                </Scene>
                <Scene key="messages"  tabTitle="Messages" icon={TabIcon} iconString="ios-mail" {...navBarStyle} badgeOnMessages={true} initial={false} >
                  <Scene key="messageInbox"               component={Views.MessageInbox}    />
                  <Scene key="messageThread"              component={Views.MessageThread}   />
                </Scene>
                <Scene key="settings" tabTitle="Settings" icon={TabIcon} iconString="ios-cog" {...navBarStyle}  initial={false} >
                  <Scene key="settingsOverview"           component={Views.SettingsOverview}          />
                  <Scene key="settingsProfile"            component={Views.SettingsProfile}           />
                  <Scene key="settingsPrivacy"            component={Views.SettingsPrivacy}           />
                  <Scene key="settingsApp"                component={Views.SettingsApp}               />
                  <Scene key="settingsMeshOverview"       component={Views.SettingsMeshOverview}      />
                  <Scene key="settingsStoneBleDebug"      component={Views.SettingsStoneBleDebug}     />
                  <Scene key="settingsBleDebug"           component={Views.SettingsBleDebug}          />
                  <Scene key="settingsDeveloper"          component={Views.SettingsDeveloper}         />
                  <Scene key="settingsSphereOverview"     component={Views.SettingsSphereOverview}    />
                  <Scene key="settingsSphere"             component={Views.SettingsSphere}            />
                  <Scene key="settingsSphereUser"         component={Views.SettingsSphereUser}        />
                  <Scene key="settingsSphereInvitedUser"  component={Views.SettingsSphereInvitedUser} />
                  <Scene key="settingsSphereInvite"       component={Views.SettingsSphereInvite}      />
                  <Scene key="settingsFAQ"                component={Views.SettingsFAQ}               />
                </Scene>
              </Tabs>
              <Scene key="pictureView"                    component={Views.PictureView}                />
              <Scene key="cameraRollView"                 component={Views.CameraRollView}             />
              <Scene key="aiStart"                        component={Views.AiStart}                    />
              <Scene key="roomTraining_roomSize"          component={Views.RoomTraining_roomSize}      />
              <Scene key="roomTraining"                   component={Views.RoomTraining}               />
              <Scene key="roomSelection"                  component={Views.RoomSelection}              />
              <Scene key="roomIconSelection"              component={Views.RoomIconSelection}          />
              <Scene key="roomAdd"                        component={Views.RoomAdd}                    />
              <Scene key="roomEdit"                       component={Views.RoomEdit}                   />
              <Scene key="deviceEdit"                     component={Views.DeviceEdit}                 />
              <Scene key="deviceBehaviourEdit"            component={Views.DeviceBehaviourEdit}        />
              <Scene key="applianceSelection"             component={Views.ApplianceSelection}         />
              <Scene key="applianceAdd"                   component={Views.ApplianceAdd}               />
              <Scene key="selectFromList"                 component={Views.SelectFromList}             />
              <Scene key="deviceScheduleEdit"             component={Views.DeviceScheduleEdit}         />
              <Scene key="messageAdd"                     component={Views.MessageAdd}                 />
              <Scene key="deviceIconSelection"            component={Views.DeviceIconSelection}        />
              <Scene key="settingsPluginRecoverStep1"     component={Views.SettingsPluginRecoverStep1} />
              <Scene key="settingsPluginRecoverStep2"     component={Views.SettingsPluginRecoverStep2} />
          </Modal>
        </Router>

        <AnimatedMenu />
        <DfuOverlay store={this.props.store} />
        <LockOverlay store={this.props.store} />
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
      <View style={{width:screenWidth/3, height:tabBarHeight, alignItems:'center', justifyContent:'center'}}>
        <Icon
          name={this.props.iconString}
          size={31}
          color={this.props.focused ?  colors.menuTextSelected.hex : colors.menuText.hex}
          style={{backgroundColor:'transparent', padding:0, margin:0}}
        />
        <Text style={{
          fontSize:11,
          fontWeight:'200',
          color: (this.props.focused ?  colors.menuTextSelected.hex : colors.menuText.hex)
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
  navigationBarStyle:{backgroundColor:colors.menuBackground.hex},
  headerTintColor: colors.menuTextSelected.hex, // color of title text
  headerTitleStyle: {
    color: colors.white.hex,
    fontWeight: 'bold',
  },
  backButtonTintColor: colors.red.hex,
  headerBackTitleStyle:{
    color: colors.menuTextSelected.hex,
    fontWeight: 'bold',
    fontSize: 14
  }
};


