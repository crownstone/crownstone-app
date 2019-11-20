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
import { DimmerSlider } from "../components/DimmerSlider";
import { AnimatedCircle } from "../components/animated/AnimatedCircle";
import { LockedStateUI } from "../components/LockedStateUI";
import { STONE_TYPES } from "../../Enums";
import { DataUtil } from "../../util/DataUtil";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { OverlayUtil } from "../overlays/OverlayUtil";
import { Navigation } from "react-native-navigation";


export class DeviceOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  storedSwitchState = 0;
  unsubscribeStoreEvents;
  stoneCanSwitch = true;

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

    this.state = {
      switchIsOn: this.storedSwitchState > 0
    }

    if (stone.config.type === STONE_TYPES.guidestone || stone.config.type === STONE_TYPES.crownstoneUSB) {
      this.stoneCanSwitch = false;
    }

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
    // core.store.dispatch({type:"REMOVE_ALL_RULES_OF_STONE", sphereId: this.props.sphereId, stoneId: this.props.stoneId})

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
          change.stoneLocationUpdated && change.stoneLocationUpdated.stoneIds[this.props.stoneId] ||
          change.changeStoneState     && change.changeStoneState.stoneIds[this.props.stoneId]     ||
          change.stoneChangeRules     && change.stoneChangeRules.stoneIds[this.props.stoneId]     ||
          change.updateStoneConfig    && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        if (change.updateStoneConfig    && change.updateStoneConfig.stoneIds[this.props.stoneId]) {
          this._updateNavBar();
        }

        this.forceUpdate();
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
    if (state === 0 && this.state.switchIsOn) {
      this.setState({switchIsOn: false});
    }
    else if (state > 0 && !this.state.switchIsOn) {
      this.setState({switchIsOn: true});
    }

    StoneUtil.switchBHC(
      this.props.sphereId,
      this.props.stoneId,
      stone,
      state,
      core.store,
      {},
      () => { this.storedSwitchState = state; },
      INTENTS.manual,
      1,
      'from _getButton in DeviceSummary'
    );
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
      let showDimmingText = stone.state.dimmingAvailable === false && StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false;
      return (
        <DimmerSlider
          initialState={stone.state.state}
          dimmingSynced={stone.abilities.dimming.syncedToCrownstone}
          showDimmingText={showDimmingText}
          callback={(percentage) => {
            if (stone.abilities.dimming.syncedToCrownstone) {
              this._switch(stone, xUtil.transformUISwitchStateToStoneSwitchState(percentage));
            }
            else {
              this._switch(stone, percentage);
            }
          }}/>
      );
    }
    else {
      return (
        <View style={{ flexDirection:'row',height:height, width:width, backgroundColor: colors.white.rgba(1), borderRadius: 25, alignItems:'center', justifyContent:'center'}}>
          <TouchableOpacity style={{
            ...innerStyle,
            borderBottomLeftRadius: 25,  borderTopLeftRadius: 25, alignItems:'flex-end',
            backgroundColor: !this.state.switchIsOn ? colors.green.hex : colors.csBlueDark.hex
          }} onPress={() => { this._switch(stone,0); }}>
            <Text style={textStyle}>OFF</Text>
          </TouchableOpacity>
          <View style={{width:border}} />
          <TouchableOpacity style={{...innerStyle,
            borderBottomRightRadius: 25, borderTopRightRadius: 25,
            backgroundColor: this.state.switchIsOn ? colors.green.hex : colors.csBlueDark.hex
          }} onPress={() => { this._switch(stone,1); }}>
            <Text style={textStyle}>ON</Text>
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
    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false && stone.config.locked === false || true) {
      return (
        <TouchableOpacity
          onPress={() => {core.eventBus.emit('showLockOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId })}}
          style={wrapperStyle}>
          <Icon name={"md-unlock"} color={colors.csBlueDarker.rgba(0.5)} size={30} />
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
    }
  }


  _getSpecificInformation(stone) {
    let label = ""
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
        <Text style={deviceStyles.subHeader}>{ "I'm a " + label + "!"}</Text>
        { map  &&
        <View style={{padding:30}}>
          <Text style={deviceStyles.text}>{ "Currently, I'm in the " + map.locationName + "." }</Text>
        </View>
        }
      </View>
    )
  }

  _getStoneIcon(stone) {
    let iconColor = colors.white.rgba(1);
    let size = 0.24*availableScreenHeight;
    let borderWidth = size*0.04;
    let outerSize = size+1.5*borderWidth;
    let stateColor = this.state.switchIsOn ? colors.green.hex : colors.csBlueDark.hex;
    return (
      <View style={{width: screenWidth, height:size, alignItems:'center', justifyContent:'center'}}>
        <AnimatedCircle size={outerSize} color={stateColor} style={{alignItems:'center', justifyContent:'center'}}>
          <AnimatedCircle size={size} color={stateColor} style={{borderRadius:0.5*size, borderWidth: borderWidth, borderColor: iconColor, alignItems:'center', justifyContent:'center'}}>
            <Icon size={size*0.63} name={stone.config.icon} color={iconColor} />
          </AnimatedCircle>
        </AnimatedCircle>
      </View>
    )
  }


  _getMenuIcons(stone) {
    return (
      <View style={{width:screenWidth, alignItems:'center', flexDirection:'row', marginTop:15, marginBottom: stone.abilities.dimming.enabledTarget ? 80 : 0}}>
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Abilities"} icon={'ios-school'} backgroundColor={colors.green.hex} callback={() => {
          NavigationUtil.launchModal("DeviceAbilities", {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId
          })
        }} />
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Behaviour"} icon={'c1-brain'} backgroundColor={colors.green.blend(colors.csBlueDark,0.5).hex}  callback={() => {
          NavigationUtil.launchModal("DeviceSmartBehaviour", {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId
          })
        }} />
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Power usage"} image={require("../../images/icons/graph.png")} backgroundColor={colors.csBlueDark.hex}  callback={() => {
          NavigationUtil.launchModal("DevicePowerUsage", {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId
          })
        }} />
        <View style={{flex:1}} />
      </View>
    )
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

    return (
      <Background image={core.background.lightBlur}>
        { this.stoneCanSwitch && this._getMenuIcons(stone)}
        <View style={{flex:2}} />

        {/* If the stone can't switch its a Guidestone or a Crownstone USB. */}
        { !this.stoneCanSwitch && <View style={{padding:30}}><Text style={deviceStyles.header}>Hi there!</Text></View> }


        { this._getStoneIcon(stone) }

        {/* If the stone can't switch its a Guidestone or a Crownstone USB. The specific information is it telling you which device it is and where it lives. */}
        { !this.stoneCanSwitch && this._getSpecificInformation(stone) }

        <View style={{ flex: 2 }} />

        {/* If the stone can't switch its a Guidestone or a Crownstone USB. It will not have a button. */}
        { this.stoneCanSwitch && <View style={{width:screenWidth, alignItems: 'center'}}>{this._getButton(stone)}</View> }

        <View style={{ height: 40}} />
        { stone.config.locked === false && this.stoneCanSwitch ? this._getLockIcon(stone) : undefined }
      </Background>
    )
  }


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

