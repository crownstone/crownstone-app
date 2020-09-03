import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceOverview", key)(a,b,c,d,e);
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
import { ActivityIndicator, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { Icon } from "../components/Icon";
import { DeviceMenuIcon } from "./DeviceMenuIcon";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { DimmerSlider, DIMMING_INDICATOR_SIZE, DIMMING_INDICATOR_SPACING } from "../components/DimmerSlider";
import { AnimatedCircle } from "../components/animated/AnimatedCircle";
import { LockedStateUI } from "../components/LockedStateUI";
import { STONE_TYPES } from "../../Enums";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Navigation } from "react-native-navigation";
import { DeviceError } from "./DeviceError";
import { Util } from "../../util/Util";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../ExternalConfig";
import { AlternatingContent } from "../components/animated/AlternatingContent";
import { AicoreUtil } from "./smartBehaviour/supportCode/AicoreUtil";


export class DeviceOverview extends LiveComponent<any, { switchIsOn: boolean }> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;

  // these are used to determine persisting the switchstate.
  storedSwitchState = 0;
  storeSwitchState = false;
  storeSwitchStateTimeout = null;

  constructor(props) {
    super(props);

    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return;
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return;
    }

    this.storedSwitchState = stone.state.state;

    this.state = { switchIsOn: this.storedSwitchState > 0 }

    if (stone.config.firmwareVersionSeenInOverview === null) {
      core.store.dispatch({
        type: "UPDATE_STONE_LOCAL_CONFIG",
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: { firmwareVersionSeenInOverview: stone.config.firmwareVersion }
      });
    }
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'deviceEdit')    {
      NavigationUtil.launchModal( "DeviceEdit",{sphereId: this.props.sphereId, stoneId: this.props.stoneId});
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
        (change.removeStone          && change.removeStone.stoneIds[this.props.stoneId])    ||
        (change.stoneChangeAbilities && change.stoneChangeAbilities.stoneIds[this.props.stoneId])
      ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        !change.removeStone &&
        (
          change.changeAppSettings ||
          change.stoneLocationUpdated    && change.stoneLocationUpdated.stoneIds[this.props.stoneId]    ||
          change.changeStoneAvailability && change.changeStoneAvailability.stoneIds[this.props.stoneId] ||
          change.stoneChangeRules        && change.stoneChangeRules.stoneIds[this.props.stoneId]        ||
          change.updateStoneConfig       && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        if (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId]) {
          this._updateNavBar();
        }
        this.forceUpdate();
        return
      }
      if (change.updateStoneState && change.updateStoneState.stoneIds[this.props.stoneId]) {
        if (this.state.switchIsOn && stone.state.state === 0 || this.state.switchIsOn === false && stone.state.state > 0) {
          this.setState({ switchIsOn: stone.state.state > 0 })
        }
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
    BatchCommandHandler.closeKeptOpenConnection();

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

    if (this.storeSwitchState) {
      clearTimeout(this.storeSwitchStateTimeout);
      this.safeStoreUpdate()
    }
  }

  /**
   * this will store the switchstate if it is not already done. Used for dimmers which use the "TRANSIENT" action.
   */
  safeStoreUpdate() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return; }

    const stone = sphere.stones[this.props.stoneId];
    if (!stone) { return; }

    if (stone.state.state !== this.storedSwitchState) {
      let data = {state: stone.state.state};
      if (stone.state.state === 0) {
        data['currentUsage'] = 0;
      }
      core.store.dispatch({
        type: 'UPDATE_STONE_SWITCH_STATE',
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: data
      });

      this.storedSwitchState = stone.state.state;
    }
  }



  _switch(stone, state) {
    if (state === 0 && this.state.switchIsOn === true) {
      this.setState({switchIsOn: false});
    }
    else if (state > 0 && this.state.switchIsOn === false) {
      this.setState({switchIsOn: true});
    }

    StoneUtil.switchBCH(
      this.props.sphereId,
      this.props.stoneId,
      stone,
      state,
      {},
      () => { this._planStoreAction(); },
      1,
      'from _getButton in DeviceSummary',
      true
    );
  }

  _planStoreAction() {
    this.storeSwitchState = true;
    clearTimeout(this.storeSwitchStateTimeout);
    this.storeSwitchStateTimeout = setTimeout(() => {
      this.storeSwitchState = false;
      this.safeStoreUpdate()
    }, 3000);
  }

  _getButton(stone) {
    let border = 4;
    let height = 50;
    let width = screenWidth-50;
    let innerHeight = height-2*border;
    let innerWidth = width*0.5-1.4*border;
    let innerStyle : ViewStyle = {height: innerHeight, width: innerWidth, borderRadius: 3, justifyContent:'center', padding: 10};
    let textStyle : TextStyle = {color: colors.white.hex, fontSize: 18, fontWeight:'bold'};

    let size = 0.22*availableScreenHeight;

    let currentState = stone.state.state;

    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
      return (
        <View style={{width:0.75*screenWidth, height:size*1.05, alignItems:'center'}}>
          <View style={{flex:2}} />
          <Text style={deviceStyles.text}>{ lang("Searching___") }</Text>
          <View style={{flex:1}} />
          <Text style={[deviceStyles.subText, {textAlign:'center'}]}>{ lang("Once_I_hear_from_this_Cro") }</Text>
          <View style={{flex:1}} />
          <ActivityIndicator animating={true} size='small' color={colors.csBlue.hex} />
          <View style={{flex:2}} />
        </View>
      );
    }


    if (stone.config.locked) {
      return (
        <LockedStateUI
          size={0.3*screenHeight}
          state={currentState}
          stone={stone}
          sphereId={this.props.sphereId}
          stoneId={this.props.stoneId}
          unlockCrownstone={ () => {
            let promise = BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName : 'lockSwitch', value: false });
            BatchCommandHandler.executePriority();
            return promise;
          }}
          unlockDataCallback={() => { core.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: {locked: false}})}}
        />
      );
    }


    if (stone.abilities.dimming.enabledTarget) {
      return (
        <DimmerSlider
          stoneId={this.props.stoneId}
          sphereId={this.props.sphereId}
          callback={(percentage) => {
            this._switch(stone, percentage);
          }}/>
      );
    }
    else {
      return (
        <View style={{ flexDirection:'row', height:height, width:width, backgroundColor: colors.white.rgba(1), borderRadius: 25, alignItems:'center', justifyContent:'center'}}>
          <TouchableOpacity style={{
            ...innerStyle,
            borderBottomLeftRadius: 25,  borderTopLeftRadius: 25, alignItems:'flex-end',
            backgroundColor: !this.state.switchIsOn ? colors.green.hex : colors.csBlueDark.hex
          }} onPress={() => { this._switch(stone,0); }}>
            <Text style={textStyle}>{ lang("OFF") }</Text>
          </TouchableOpacity>
          <View style={{width:border}} />
          <TouchableOpacity style={{...innerStyle,
            borderBottomRightRadius: 25, borderTopRightRadius: 25,
            backgroundColor: this.state.switchIsOn ? colors.green.hex : colors.csBlueDark.hex
          }} onPress={() => { this._switch(stone,100); }}>
            <Text style={textStyle}>{ lang("ON") }</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  _getLockIcon(stone) {
    let wrapperStyle : ViewStyle = {
      width: 35,
      height: 35,
      position: 'absolute',
      bottom: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: "center"
    };
    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false && stone.config.locked === false) {
      return (
        <TouchableOpacity
          onPress={() => { core.eventBus.emit('showLockOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId })} }
          style={wrapperStyle}>
          <Icon name={"md-unlock"} color={colors.csBlueDarker.rgba(0.5)} size={30} />
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
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


  _getSpecificInformation(stone) {
    let label;
    switch (stone.config.type) {
      case STONE_TYPES.guidestone:
        label = "Guidestone"; break;
      case STONE_TYPES.crownstoneUSB:
        label = "Crownstone USB"; break;
      default:
        label = stone.config.type;
    }
    let map = MapProvider.stoneSummaryMap[this.props.stoneId];
    return (
      <View style={{width:screenWidth, padding:30, ...styles.centered}}>
        <Text style={deviceStyles.subHeader}>{ lang("Im_a__",label) }</Text>
        { map  &&
        <View style={{padding:30}}>
          <Text style={deviceStyles.text}>{ lang("Currently__Im_in_the__",map.locationName) }</Text>
        </View>
        }
      </View>
    )
  }


  _getStoneIcon(stone, updateAvailable, stoneCanSwitch) {
    let iconColor = colors.white.rgba(1);
    let size = 0.25*availableScreenHeight;
    let stateColor = this.state.switchIsOn ? colors.green.hex : colors.csBlueDark.hex;

    let content = <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={stone.config.icon} />

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
              <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={stone.config.icon} />,
            ]}
          />
        </TouchableOpacity>
      )
    }

    if (stoneCanSwitch && stone.config.locked === false) {
      content = (
        <TouchableOpacity onPress={() => {
          if (this.state.switchIsOn) {
            // switch off
            this._switch(stone, 0);
            core.eventBus.emit("DeviceOverviewSetSwitchState", 0);
          }
          else {
            this.setState({switchIsOn: true});
            BatchCommandHandler.loadPriority(
              stone,
              this.props.stoneId,
              this.props.sphereId,
              {commandName:'turnOn'},
              {},
              2,
              "From DeviceOverview"
            )
              .then((result) => {
                let expectedState = AicoreUtil.getActiveTurnOnPercentage(this.props.sphereId, stone)
                core.store.dispatch({
                  type: 'UPDATE_STONE_SWITCH_STATE_TRANSIENT',
                  sphereId: this.props.sphereId,
                  stoneId: this.props.stoneId,
                  data: {state: expectedState}
                });
                core.eventBus.emit("DeviceOverviewSetSwitchState", expectedState);
                this._planStoreAction();
              });
          }
        }}>{content}</TouchableOpacity>
      )
    }

    return (
      <View style={{width: screenWidth, height:size, alignItems:'center', justifyContent:'center'}}>
        {content}
      </View>
    )
  }


  _getMenuIcons(stone) {
    let dimmerReady = !StoneAvailabilityTracker.isDisabled(this.props.stoneId) && !stone.config.locked && stone.abilities.dimming.enabledTarget

    return (
      <View style={{
        width:screenWidth,
        alignItems:'center',
        flexDirection:'row',
        marginTop:15,
        marginBottom: dimmerReady ? DIMMING_INDICATOR_SIZE + DIMMING_INDICATOR_SPACING : 0
      }}>
        <View style={{width:0.05*screenWidth}} />
        <DeviceMenuIcon label={ lang("Abilities")} icon={'ios-school'} backgroundColor={colors.green.hex} callback={() => {
          NavigationUtil.launchModal("DeviceAbilities", {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId
          })
        }} />
        <DeviceMenuIcon label={ lang("Behaviour")} icon={'c1-brain'} backgroundColor={colors.green.blend(colors.csBlueDark,0.5).hex} callback={() => {
          NavigationUtil.launchModal("DeviceSmartBehaviour", {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId
          })
        }} />
        <DeviceMenuIcon label={ lang("Power_usage")} image={require("../../images/icons/graph.png")} backgroundColor={colors.csBlueDark.hex} callback={() => {
          NavigationUtil.launchModal("DevicePowerUsage", {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId
          })
        }} />
        <View style={{width:0.05*screenWidth}} />
      </View>
    );
  }



  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) {
      return <StoneDeleted/>
    }

    let hardwareError = stone.errors.hasError && StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false;
    if (hardwareError) {
      return <DeviceError {...this.props} stone={stone} />
    }

    let stoneCanSwitch = true;
    if (stone.config.type === STONE_TYPES.guidestone || stone.config.type === STONE_TYPES.crownstoneUSB) {
      stoneCanSwitch = false;
    }

    let updateAvailable = stone.config.firmwareVersion && ((Util.canUpdate(stone, state) === true) || xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false);

    return (
      <Background image={core.background.lightBlur}>
        { stoneCanSwitch && this._getMenuIcons(stone) }
        <View style={{flex:2}} />

        {/* If the stone can't switch its a Guidestone or a Crownstone USB. */}
        { !stoneCanSwitch && <View style={{padding:30}}><Text style={deviceStyles.header}>{ lang("Hi_there_") }</Text></View> }

        { this._getStoneIcon(stone, updateAvailable, stoneCanSwitch) }

        {/* If the stone can't switch its a Guidestone or a Crownstone USB. The specific information is it telling you which device it is and where it lives. */}
        { !stoneCanSwitch && this._getSpecificInformation(stone) }

        <View style={{ flex: 2 }} />

        {/* If the stone can't switch its a Guidestone or a Crownstone USB. It will not have a button. */}
        { stoneCanSwitch && <View style={{width:screenWidth, alignItems: 'center'}}>{this._getButton(stone)}</View> }

        <View style={{ height: 40}} />
        { stone.config.locked === false && stoneCanSwitch && Permissions.inSphere(this.props.sphereId).canLockCrownstone ? this._getLockIcon(stone) : undefined }
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
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  let spherePermissions = Permissions.inSphere(props.sphereId);

  NAVBAR_PARAMS_CACHE = {
    title: stone.config.name,
  }

  if (spherePermissions.editCrownstone) {
    NAVBAR_PARAMS_CACHE["nav"] = {
      id: 'deviceEdit',
      text:  lang("Edit"),
    }
  }

  return NAVBAR_PARAMS_CACHE;
}



let NAVBAR_PARAMS_CACHE : topbarOptions = null;

