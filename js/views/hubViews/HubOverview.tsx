import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HubOverview", key)(a,b,c,d,e);
}
import * as React from 'react';

import { Background } from '../components/Background'
import { BatchCommandHandler }  from "../../logic/BatchCommandHandler";
import { SphereDeleted }        from "../static/SphereDeleted";
import { StoneDeleted }         from "../static/StoneDeleted";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { StoneUtil } from "../../util/StoneUtil";
import { INTENTS } from "../../native/libInterface/Constants";
import { availableScreenHeight, colors, deviceStyles, screenHeight, screenWidth, styles } from "../styles";
import {
  ActivityIndicator, Alert,
  Text,
  TextStyle,
  TouchableHighlight,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { Icon } from "../components/Icon";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { DimmerSlider, DIMMING_INDICATOR_SIZE, DIMMING_INDICATOR_SPACING } from "../components/DimmerSlider";
import { AnimatedCircle } from "../components/animated/AnimatedCircle";
import { LockedStateUI } from "../components/LockedStateUI";
import { STONE_TYPES } from "../../Enums";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Navigation } from "react-native-navigation";
import { Util } from "../../util/Util";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../ExternalConfig";
import { AlternatingContent } from "../components/animated/AlternatingContent";
import { SetupHubHelper } from "../../native/setup/SetupHubHelper";
import { BluenetPromise, BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";
import { DataUtil } from "../../util/DataUtil";
import { Button } from "../components/Button";
import { Get } from "../../util/GetUtil";
import { HubReplyError } from "./HubEnums";
import { LOGe, LOGi } from "../../logging/Log";
import { Scheduler } from "../../logic/Scheduler";


export class HubOverview extends LiveComponent<any, { fixing: boolean }> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;


  constructor(props) {
    super(props);

    const stone = Get.stone(this.props.sphereId, this.props.stoneId);
    if (stone) {
      if (stone.config.firmwareVersionSeenInOverview === null) {
        core.store.dispatch({
          type: "UPDATE_STONE_LOCAL_CONFIG",
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          data: { firmwareVersionSeenInOverview: stone.config.firmwareVersion }
        });
      }
    }

    this.state = {fixing: false}
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'deviceEdit') {
      if (this.props.stoneId) {
        NavigationUtil.launchModal("DeviceEdit", { sphereId: this.props.sphereId, stoneId: this.props.stoneId });
      }
      else if (this.props.hubId) {
        NavigationUtil.launchModal("HubEdit", { sphereId: this.props.sphereId, hubId: this.props.hubId });
      }
    }
  }

  componentDidMount() {
    let state = core.store.getState();

    if (state.app.hasSeenDeviceSettings === false) {
      core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenDeviceSettings: true } })
    }

    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();
      if (
        (state.spheres[this.props.sphereId] === undefined) ||
        (change.removeSphere         && change.removeSphere.sphereIds[this.props.sphereId]) ||
        (change.removeStone          && change.removeStone.stoneIds[this.props.stoneId])
      ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        !change.removeStone &&
        (
          change.updateHubConfig ||
          change.changeHubs ||
          change.changeAppSettings ||
          change.stoneLocationUpdated    && change.stoneLocationUpdated.stoneIds[this.props.stoneId]    ||
          change.changeStoneAvailability && change.changeStoneAvailability.stoneIds[this.props.stoneId] ||
          change.updateStoneConfig       && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        if (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId]) {
          this._updateNavBar();
        }
        this.forceUpdate();
        return
      }
    });
  }

  _updateNavBar() {
    getTopBarProps(this.props);
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
    // This will close the connection that is kept open by a dimming command. Dimming is the only command that keeps the connection open.
    // If there is no connection being kept open, this command will not do anything.

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (sphere) {
      const stone = sphere.stones[this.props.stoneId];
      if (stone && stone.config.firmwareVersionSeenInOverview !== stone.config.firmwareVersion) {
        core.store.dispatch({
          type: "UPDATE_STONE_LOCAL_CONFIG",
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          data: { firmwareVersionSeenInOverview: stone.config.firmwareVersion }
        });
      }
    }
  }


  _getDebugIcon(stone) {
    let wrapperStyle : ViewStyle = {
      width: 35,
      height: 35,
      position: 'absolute',
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: "center"
    };
    return (
      <TouchableOpacity
        onPress={() => { NavigationUtil.navigate( "SettingsStoneBleDebug",{sphereId: this.props.sphereId, stoneId: this.props.stoneId}) }}
        style={wrapperStyle}>
        <Icon name={"ios-bug"} color={colors.csBlueDarker.rgba(0.5)} size={30} />
      </TouchableOpacity>
    );
  }



  _getStoneIcon(stone, updateAvailable) {
    let iconColor = colors.white.rgba(1);
    let size = 0.25*availableScreenHeight;
    let stateColor = colors.green.hex;
    let icon = stone?.config?.icon || 'c1-router';

    if (updateAvailable) {
      return (
        <TouchableOpacity
          style={{width: screenWidth, height:size, alignItems:'center', justifyContent:'center'}}
          onPress={() => {
            NavigationUtil.launchModal( "DfuIntroduction", {sphereId: this.props.sphereId});
          }}
        >
          <AlternatingContent
            style={{width:screenWidth, height:size, justifyContent:'center', alignItems:'center'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={"c1-update-arrow"} />,
              <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={icon} />,
            ]}
          />
        </TouchableOpacity>
      );
    }


    return (
      <View style={{width: screenWidth, height:size, alignItems:'center', justifyContent:'center'}}>
        <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={icon} />
      </View>
    )
  }



  getStateEntries(stone, hub) {
    let entries = [];
    let index = 5000;
    let textStyle : TextStyle = {textAlign:'center', fontSize:16, fontWeight:'bold'};

    const createHub = async () => {
      let helper = new SetupHubHelper();
      try {
        LOGi.info("Setting up hub...")
        let hubId = await helper.setup(this.props.sphereId, this.props.stoneId)
        core.store.dispatch({
          type: "UPDATE_HUB_CONFIG",
          sphereId: this.props.sphereId,
          hubId: hubId,
          data: { locationId: stone.config.locationId }
        });
      }
      catch(e) {
        LOGe.info("Problem settings up new hub", e);
        Alert.alert("Something went wrong...","Please try again later!", [{text:"OK"}]);
      }
      this.setState({ fixing: false });
    }

    if (this.state.fixing) {
      return <View key={"Fixing"} style={{...styles.centered, flex:1, padding:15}}>
        <Text style={textStyle}>{"Fixing issue..."}</Text>
        <View style={{flex:0.25}}/>
        <ActivityIndicator size={'large'} />
        <View style={{flex:1}}/>
      </View>
    }


    if (!stone) {
      return (
        <View key={"StoneMissingFix"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{"This hub has no Crownstone Dongle linked to it. " +
          "You can resolve this by setting up the CrownstoneUSB dongle in this hub or removing this hub from the Sphere.\n\nIf the usb dongle is already setup, find it in the app and press the fix now button over there."}</Text>
          <View style={{flex:1}}/>
        </View>
      );
    }

    // this means the hub itself has no reference in the app to work off from. We should fix this.
    if (!hub) {
      return (
        <View key={"HubReferenceFix"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{"The hub reference in the app is missing. Press the button below to fix this!"}</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ "Fix now. "}
            icon={"ios-build"}
            iconSize={14}
            callback={() => {
              this.setState({fixing: true});
              let helper = new SetupHubHelper();
              helper.createLocalHubInstance(this.props.sphereId, this.props.stoneId)
                .then((hubId) => {
                  core.store.dispatch({type:"UPDATE_HUB_CONFIG", sphereId: this.props.sphereId, hubId: hubId, data: {locationId: stone.config.locationId}});
                  this.setState({fixing:false})
                })
                .catch(async (err) => {
                  if (err === "HUB_REPLY_TIMEOUT") {
                    Alert.alert("Something went wrong...","The hub connected to this dongle is not responding. Please disconnect the hub's power, wait 5 seconds and plug it back in. After 1 minute, try again.", [{text:"OK"}]);
                  }
                  else if (typeof err === 'object') {
                    if (err.code === 3) {
                      if (err.errorType === HubReplyError.IN_SETUP_MODE) {
                        await createHub();
                        await Scheduler.delay(5000);
                      }
                    }
                    else {
                      throw err;
                    }
                  }
                  else {
                    throw err;
                  }
                  this.setState({fixing:false})
                })
                .catch((err) => {
                  Alert.alert("Something went wrong...","Please try again later!", [{text:"OK"}]);
                  this.setState({fixing:false})
                })
            }}
          />
        </View>
      );
    }

    if (hub.data.state.uartAlive === false && this.props.stoneId) {
      return (
        <View key={"HubUartFailed"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{"The hub is not responding to the Crownstone USB dongle. Check if it is connected and working!"}</Text>
          <View style={{flex:1}}/>
        </View>
      );
    }

    // this means the dongle is set up, but the hub itself is not setup.
    if (hub.data.state.hubHasBeenSetup === false) {
      return (
        <View key={"HubSetupFix"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{"The hub itself is not initialized yet.. Press the button below to fix this!"}</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ "Initialize hub!"}
            icon={"ios-build"}
            iconSize={14}
            callback={async () => {
              this.setState({ fixing: true });
              await createHub();
            }}
          />
        </View>
      );
    }


    if (hub.data.state.uartAlive === true && hub.data.state.uartAliveEncrypted === false) {
      return (
        <View key={"HubUartEncryptionFailed"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{"The hub and the dongle do not agree on the encryption key. The hub must be factory reset to resolve this."}</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ "Factory reset hub. "}
            icon={"ios-build"}
            iconSize={14}
            callback={() => {
              this.setState({fixing: true});
              // let helper = new SetupHubHelper();
              // helper.createLocalHubInstance(this.props.sphereId, this.props.stoneId)
              //   .then((hubId) => {
              //     core.store.dispatch({type:"UPDATE_HUB_CONFIG", sphereId: this.props.sphereId, hubId: hubId, data: {locationId: stone.config.locationId}});
              //     this.setState({fixing:false})
              //   })
              //   .catch((e) => {
              //     this.setState({fixing:false})
              //   })
            }}
          />
        </View>
      );
    }


    if (!hub) { entries.push(<Text key={index++} style={textStyle}>{"The hub reference in the app is missing."}</Text>); }
    if (hub && hub.data.state.uartAlive                          ) { entries.push(<Text key={index++} style={textStyle}>{"Uart is alive."}</Text>); }
    if (hub && hub.data.state.uartAliveEncrypted                 ) { entries.push(<Text key={index++} style={textStyle}>{"Uart is encrypted."}</Text>); }
    if (hub && hub.data.state.uartEncryptionRequiredByCrownstone ) { entries.push(<Text key={index++} style={textStyle}>{"Uart required by Dongle."}</Text>); }
    if (hub && hub.data.state.uartEncryptionRequiredByHub        ) { entries.push(<Text key={index++} style={textStyle}>{"Uart required by Hub."}</Text>); }
    if (hub && hub.data.state.hubHasBeenSetup                    ) { entries.push(<Text key={index++} style={textStyle}>{"Hub is setup."}</Text>); }
    if (hub && hub.data.state.hubHasInternet                     ) { entries.push(<Text key={index++} style={textStyle}>{"Hub has internet."}</Text>); }
    if (hub && hub.data.state.hubHasError                        ) { entries.push(<Text key={index++} style={textStyle}>{"Hub has an error..."}</Text>); }
    return entries;
  }

  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }
    const stone = sphere.stones[this.props.stoneId];
    const hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId) || DataUtil.getHubById(this.props.sphereId, this.props.hubId);

    let updateAvailable = stone && stone.config.firmwareVersion && ((Util.canUpdate(stone, state) === true) || xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false);

    let problemEntries = this.getStateEntries(stone, hub);

    return (
      <Background image={core.background.lightBlur}>
        <View style={{flex:0.5}} />

        {/*{ <View style={{padding:30}}><Text style={deviceStyles.header}>{ "Hub state overview:" }</Text></View> }*/}

        { this._getStoneIcon(stone, updateAvailable) }
        <View style={{width:screenWidth, padding:30, ...styles.centered}}>
          <Text style={deviceStyles.subHeader}>{"Hub information:"}</Text>
        </View>

        {problemEntries}


        { state.user.developer ? this._getDebugIcon(stone) : undefined }
      </Background>
    )
  }
}

export function DeviceIcon({ size, color, iconColor, icon}) {
  let borderWidth = size*0.04;
  let innerSize = size-1.5*borderWidth;
  return (
    <AnimatedCircle size={size} color={color} style={{alignItems:'center', justifyContent:'center'}}>
      <AnimatedCircle size={innerSize} color={color} style={{borderRadius:0.5*innerSize, borderWidth: borderWidth, borderColor: iconColor, alignItems:'center', justifyContent:'center'}}>
        <Icon size={innerSize*0.63} name={icon} color={iconColor} />
      </AnimatedCircle>
    </AnimatedCircle>
  );
}

function getTopBarProps(props) {
  const state = core.store.getState();
  const hub = state.spheres[props.sphereId].hubs[props.hubId];
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  let spherePermissions = Permissions.inSphere(props.sphereId);

  NAVBAR_PARAMS_CACHE = {
    title: stone?.config?.name ?? hub?.config?.name,
  }

  if (spherePermissions.editCrownstone) {
    NAVBAR_PARAMS_CACHE["nav"] = {
      id: 'deviceEdit',
      text:  lang("Edit"),
    }
  }

  return NAVBAR_PARAMS_CACHE;
}


/**
 * this will store the switchstate if it is not already done. Used for dimmers which use the "TRANSIENT" action.
 */
export function safeStoreUpdate(sphereId, stoneId, storedSwitchState) {
  const state = core.store.getState();
  const sphere = state.spheres[sphereId];
  if (!sphere) { return storedSwitchState; }

  const stone = sphere.stones[stoneId];
  if (!stone) { return storedSwitchState; }

  if (stone.state.state !== storedSwitchState) {
    let data = {state: stone.state.state};
    if (stone.state.state === 0) {
      data['currentUsage'] = 0;
    }
    core.store.dispatch({
      type: 'UPDATE_STONE_SWITCH_STATE',
      sphereId: sphereId,
      stoneId: stoneId,
      data: data
    });

    return stone.state.state;
  }

  return storedSwitchState;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;