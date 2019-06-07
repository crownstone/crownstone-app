import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSummaryProto", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  View, ViewStyle
} from "react-native";

import { colors, screenWidth, screenHeight } from '../../styles'
import { Util }                from "../../../util/Util";
import { Icon }                from "../../components/Icon";
import { StoneUtil }           from "../../../util/StoneUtil";
import { AnimatedCircle }      from "../../components/animated/AnimatedCircle";
import { DimmerButton }        from "../../components/DimmerButton";
import { INTENTS }             from "../../../native/libInterface/Constants";
import { Permissions}          from "../../../backgroundProcesses/PermissionManager";
import { LockedStateUI}        from "../../components/LockedStateUI";
import { BatchCommandHandler } from "../../../logic/BatchCommandHandler";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { RoomList } from "../../components/RoomList";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";

export class DeviceSummary extends LiveComponent<any, any> {
  storedSwitchState = 0;
  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    this.state = {pendingCommand: false};

    const state = core.store.getState();
    const sphere = state.spheres[props.sphereId];
    const stone = sphere.stones[props.stoneId];
    this.storedSwitchState = stone.state.state;
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = core.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        !change.removeStone &&
        (
          change.changeAppSettings ||
          change.stoneLocationUpdated   && change.stoneLocationUpdated.stoneIds[this.props.stoneId] ||
          change.changeStoneState       && change.changeStoneState.stoneIds[this.props.stoneId] ||
          change.powerUsageUpdated      && change.powerUsageUpdated.stoneIds[this.props.stoneId] ||
          change.updateStoneConfig      && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        this.forceUpdate();
      }
    });
  }
  componentWillUnmount() {
    this.unsubscribeStoreEvents();
    this.safeStoreUpdate();
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


  _getButton(stone) {
    let currentState = stone.state.state;
    let label =  lang("Turn_On");
    let stateColor = colors.csBlueDark;
    let stateColorInner = colors.csBlueDark.rgba(0.1);
    if (currentState > 0) {
      label =  lang("Turn_Off");
      stateColor = colors.green;
      stateColorInner = colors.green.rgba(0.2)
    }
    let size = 0.25*screenHeight;
    let innerSize = size - 15;
    let borderWidth = 7;

    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
      return (
        <View style={{width:0.85*screenWidth, height:size*1.05, alignItems:'center'}}>
          <View style={{flex:2}} />
          <Text style={deviceStyles.text}>{ lang("Searching___") }</Text>
          <View style={{flex:1}} />
          <Text style={deviceStyles.subText}>{ lang("Once_I_hear_from_this_Cro") }</Text>
          <View style={{flex:1}} />
          <ActivityIndicator animating={true} size='small' color={colors.white.hex} />
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

    if (stone.config.dimmingEnabled === true) {
      return <DimmerButton size={0.3*screenHeight} state={currentState} stone={stone} sphereId={this.props.sphereId} stoneId={this.props.stoneId} callback={(newState) => {
        let data = {state: newState};
        if (newState === 0) {
          data['currentUsage'] = 0;
        }
        core.store.dispatch({
          type: 'UPDATE_STONE_SWITCH_STATE_TRANSIENT',
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          data: data
        })
      }} />;
    }

    if (this.state.pendingCommand === true) {
      return (
        <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
          <AnimatedCircle size={size} color={colors.white.hex}>
            <AnimatedCircle size={innerSize} color={colors.white.hex} borderWidth={borderWidth} borderColor={stateColor}>
              <ActivityIndicator animating={true} size='large' color={colors.menuBackground.hex} />
            </AnimatedCircle>
          </AnimatedCircle>
        </AnimatedCircle>
      );
    }
    else {
      return (
        <TouchableOpacity onPress={() => {
          let newState = (currentState === 1 ? 0 : 1);
          this.setState({pendingCommand:true});

          StoneUtil.switchBHC(
            this.props.sphereId,
            this.props.stoneId,
            stone,
            newState,
            core.store,
            {},
            () => { this.setState({pendingCommand:false}); this.storedSwitchState = newState; },
            INTENTS.manual,
            1,
            'from _getButton in DeviceSummary'
          );
        }}>
          <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
            <AnimatedCircle size={size} color={colors.white.hex}>
              <AnimatedCircle size={innerSize} color={colors.white.hex} borderWidth={borderWidth} borderColor={stateColor.hex} style={{overflow:'hidden'}}>
                <View style={{position:'absolute', top:-borderWidth, left:-borderWidth, width: innerSize, height:innerSize, backgroundColor:colors.white.hex}}>
                  <View style={{position:'absolute', top:0, left:0, width: innerSize, height:innerSize, borderRadius:0.5*(innerSize), borderWidth:24, borderColor: stateColorInner}}/>
                  <View style={{position:'absolute', top:-5, left:0.35*innerSize, width: innerSize*0.3, height:0.5*innerSize, backgroundColor:colors.white.hex}}/>
                  <View style={{position:'absolute', top:-5, left:0.5*innerSize - 15, width: 2, height:0.4*innerSize, borderRadius:0.5*(innerSize), borderWidth:15, borderColor: stateColorInner}}/>
                </View>
                <Text style={{color: colors.csBlueDark.hex, fontSize:23, fontWeight:'600'}}>{label}</Text>
              </AnimatedCircle>
            </AnimatedCircle>
          </AnimatedCircle>
        </TouchableOpacity>
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
          onPress={() => {core.eventBus.emit('showLockOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId })}}
          style={wrapperStyle}>
          <Icon name={"md-unlock"} color={colors.white.rgba(0.5)} size={30}/>
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
    }
  }

  _getBackgroundIconOverlay(stone) {
    let iconColor = colors.white.rgba(0.15);
    let size = screenWidth*1.3;
    return (
      <View style={{position:'absolute', top:-0.1*size,left:-0.3*size, width: size, height:size}}>
        <View style={{width: size, height:size, borderRadius:0.5*size, borderWidth:size*0.04, borderColor: iconColor, alignItems:'center', justifyContent:'center'}}>
          <Icon size={size*0.7} name={stone.config.icon} color={iconColor} />
        </View>
      </View>
    )
  }

  _getMenuIcons() {
    return (
      <View style={{width:screenWidth, height:screenWidth/5, marginTop:10, marginBottom:10, alignItems:'center', flexDirection:'row'}}>
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Abilities"} icon={'ios-school'} backgroundColor={colors.green.rgba(1.0)} callback={() => {}} />
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Behaviour"} icon={'c1-brain'} backgroundColor={colors.green.rgba(0.7)}  callback={() => { NavigationUtil.launchModal( "DeviceSmartBehaviour", {stoneId: this.props.stoneId, sphereId: this.props.sphereId })}} />
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Power usage"} image={require("../../../images/icons/graph.png")} backgroundColor={colors.green.rgba(0.33)}  callback={() => {}} />
        <View style={{flex:1}} />
        <DeviceMenuIcon label={"Settings"} icon={'ios-settings'} backgroundColor={colors.green.rgba(0.0)}  callback={() => {NavigationUtil.launchModal( "DeviceEdit", {stoneId: this.props.stoneId, sphereId: this.props.sphereId })}} />
        <View style={{flex:1}} />
      </View>
    )
  }


  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    let showDimmingText = stone.config.dimmingAvailable === false && stone.config.dimmingEnabled === true && StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false;

    return (
      <View style={{flex:1, paddingBottom: 35, paddingTop:8}}>
        { this._getBackgroundIconOverlay(stone) }
        { this._getMenuIcons() }
        <View style={{flex:1.5}} />
        { StoneInformation({stoneId: this.props.stoneId, sphereId: this.props.sphereId, canSelectRoom: Permissions.inSphere(this.props.sphereId).moveCrownstone}) }
        { showDimmingText ? <Text style={deviceStyles.explanation}>{xUtil.spreadString(lang("The_dimmer_is_starting_up"))}</Text> : undefined }
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems: 'center'}}>{this._getButton(stone)}</View>
        <View style={{flex:0.5}} />
        { this._getLockIcon(stone) }
      </View>
    )
  }
}

export function StoneInformation(props : {stoneId: string, sphereId: string, canSelectRoom: boolean}) {
  let state = core.store.getState();
  let sphere = state.spheres[props.sphereId];
  if (!sphere) { return }
  const stone = sphere.stones[props.stoneId];
  if (!stone) { return }
  const location = Util.data.getLocationFromStone(sphere, stone);

  let locationPart = (
    <View style={{width:0.57*screenWidth}}>
      <Text style={{color: colors.white.hex, fontSize:20, fontStyle:"italic"}}>{lang("Location_")}</Text>
      <Text style={{color: colors.white.hex, fontSize:28, fontWeight:'bold'}}>{location.config.name}</Text>
    </View>
  );

  if (props.canSelectRoom) {
    locationPart = (
      <TouchableOpacity style={{width:0.57*screenWidth}} onPress={() => {
        core.eventBus.emit('showListOverlay', {
          title: lang("Select_Room"),
          getItems: () => {
            const state = core.store.getState();
            const sphere = state.spheres[props.sphereId];
            let items = [];
            Object.keys(sphere.locations).forEach((locationId) => {
              let location = sphere.locations[locationId];
              items.push( {id: locationId, component:<RoomList
                  icon={location.config.icon}
                  name={location.config.name}
                  hideSubtitle={true}
                  showNavigationIcon={false}
                  small={true}
                />})
            });

            return items;
          },
          callback: (locationId) => {
            core.store.dispatch({type:"UPDATE_STONE_LOCATION", sphereId: props.sphereId, stoneId: props.stoneId, data:{locationId: locationId}})
          },
          allowMultipleSelections: false,
          selection: stone.config.locationId,
          image: require("../../../images/overlayCircles/roomsCircle.png")
        })
      }}>
        <Text style={{color: colors.white.hex, fontSize:20, fontStyle:"italic"}}>{lang("Location_")}</Text>
        <Text style={{color: colors.white.hex, fontSize:28, fontWeight:'bold'}}>{location.config.name}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{flexDirection:'row', padding:10, width:screenWidth}}>
      {locationPart}
      <View style={{flex:1}} />
      <View>
        <Text style={{textAlign:'right', color: colors.white.hex, fontSize:20, fontStyle:"italic"}}>{lang("Energy_Usage_")}</Text>
        <Text style={{textAlign:'right', color: colors.white.hex, fontSize:28, fontWeight:'bold'}}>{ lang("_W",stone.state.currentUsage) }</Text>
      </View>
    </View>
  )
}

export function DeviceMenuIcon(props) {
  let size = screenWidth/5;
  let borderWidth = 4;
  let innerSize = size-2*borderWidth;

  return (
    <TouchableOpacity onPress={() => { if (props.callback) { props.callback() }}} style={{alignItems:'center', justifyContent:'center'}}>
      <Text style={{fontSize: 12, color:colors.white.hex, textAlign:'center', padding:2}}>{props.label}</Text>
      <View style={{width:size, height:size, borderRadius:0.5*size, borderWidth: borderWidth, borderColor: colors.csBlueDark.rgba(0.8)}}>
        <View style={{
          width:innerSize,
          height:innerSize,
          borderRadius:0.5*innerSize,
          borderWidth: 2,
          borderColor: colors.white.hex,
          backgroundColor: props.backgroundColor || "transparent",
          alignItems:'center',
          justifyContent:'center'
        }}>
          {
            props.image ?
              <Image source={props.image} style={{width:innerSize*0.55, height:innerSize*0.55}} /> :
              <Icon name={props.icon} color={colors.white.hex} size={innerSize*0.65} />
          }
        </View>
      </View>
    </TouchableOpacity>
  )


}



let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  text: {
    color: textColor.hex,
    fontSize: 18,
    fontWeight:'600'
  },
  clickableText: {
    color: textColor.hex,
    fontSize: 18,
    fontWeight:'600',
  },
  subText: {
    color: textColor.rgba(0.75),
    fontSize: 14,
    textAlign:'center'
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 14,
    textAlign:'center'
  }
});