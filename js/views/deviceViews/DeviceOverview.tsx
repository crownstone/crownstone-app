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
import { availableScreenHeight, colors, deviceStyles, screenWidth, styles } from "../styles";
import { Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { Icon } from "../components/Icon";
import { DeviceMenuIcon } from "./__toImplement/DeviceMenuIcon";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { DimmerSlider } from "../components/DimmerSlider";
import { AnimatedIconCircle } from "../components/animated/AnimatedIconCircle";
import { AnimatedCircle } from "../components/animated/AnimatedCircle";


export class DeviceOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(core.store, core.store.getState(), props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  storedSwitchState = 0;
  unsubscribeStoreEvents;

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
        (change.removeSphere && change.removeSphere.sphereIds[this.props.sphereId]) ||
        (change.removeStone && change.removeStone.stoneIds[this.props.stoneId])
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
          change.powerUsageUpdated    && change.powerUsageUpdated.stoneIds[this.props.stoneId]    ||
          change.stoneChangeRules     && change.stoneChangeRules.stoneIds[this.props.stoneId]     ||
          change.updateStoneConfig    && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        this.forceUpdate();
      }
    });
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

    let currentState = stone.state.state;

    if (stone.abilities.dimming.enabled || stone.abilites.dimming.targetState) {
      let showDimmingText = stone.state.dimmingAvailable === false && StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false;

      return (
        <DimmerSlider
          initialState={stone.state.state}
          dimmingSynced={stone.abilities.dimming.synced}
          showDimmingText={showDimmingText}
          callback={(percentage) => {
            if (stone.abilities.dimming.synced) {
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
            backgroundColor: currentState == 0 ? colors.green.hex : colors.csBlueDark.hex
          }} onPress={() => { this._switch(stone,0); }}>
            <Text style={textStyle}>OFF</Text>
          </TouchableOpacity>
          <View style={{width:border}} />
          <TouchableOpacity style={{...innerStyle,
            borderBottomRightRadius: 25, borderTopRightRadius: 25,
            backgroundColor: currentState > 0 ? colors.green.hex : colors.csBlueDark.hex
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
          <Icon name={"md-unlock"} color={colors.csBlueDarker.rgba(0.5)} size={30}/>
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
    }
  }


  getTypeIcon(stone) {
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
      <View style={{width:screenWidth, alignItems:'center', flexDirection:'row', marginTop:15, marginBottom: stone.abilities.dimming.enabled ? 80 : 0}}>
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Abilities"} icon={'ios-school'} backgroundColor={colors.green.hex} callback={() => {
          NavigationUtil.launchModal("DeviceAbilities", {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId
          })
        }} />
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Behaviour"} icon={'c1-brain'} backgroundColor={colors.green.blend(colors.csBlueDark,0.5).hex}  callback={() => {
          if (Object.keys(stone.rules).length === 0) {
            NavigationUtil.launchModal("DeviceSmartBehaviour_TypeSelector", {
              stoneId: this.props.stoneId,
              sphereId: this.props.sphereId
            })
          }
          else {
            NavigationUtil.launchModal("DeviceSmartBehaviour", {
              stoneId: this.props.stoneId,
              sphereId: this.props.sphereId
            })
          }
        }} />
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Power usage"} image={require("../../images/icons/graph.png")} backgroundColor={colors.csBlueDark.hex}  callback={() => {}} />
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
        { this._getMenuIcons(stone)}
        <View style={{flex:2}} />
        { this.getTypeIcon(stone) }
        <View style={{flex:2}} />
        <View style={{width:screenWidth, alignItems: 'center'}}>{this._getButton(stone)}</View>
        <View style={{height: 40}} />
        { this._getLockIcon(stone) }
      </Background>
    )
  }


}

function getTopBarProps(store, state, props) {
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

