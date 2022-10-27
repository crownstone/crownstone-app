
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_CopyStoneSelection", key)(a,b,c,d,e);
}
import * as React from 'react';
import { core } from "../../../Core";
import { Background } from "../../components/Background";
import { Alert, ScrollView, Text, TextStyle, TouchableOpacity, View,Image, ViewStyle } from "react-native";
import { LiveComponent } from "../../LiveComponent";
import {
  availableModalHeight, background,
  colors,
  deviceStyles, getRoomStockImage,
  screenWidth, statusBarHeight, topBarHeight
} from "../../styles";
import { Icon } from "../../components/Icon";
import { Circle } from "../../components/Circle";
import { SlideSideFadeInView } from "../../components/animated/SlideFadeInView";
import { useState } from "react";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { ABILITY_TYPE_ID } from "../../../database/reducers/stoneSubReducers/abilities";
import {
  SettingsCustomTopBarBackground,
} from "../../components/SettingsBackground";
import { CustomTopBarWrapper } from "../../components/CustomTopBarWrapper";
import { LocationRow } from "../../selection/SelectCrownstone";



/**
 *
 * We're going to copy a number of behaviours from the origin Crownstone to a number of other Crownstones.
 *
 * Possible Conflicts:
 *  A - behaviour requires dimming, but the candidate crownstone can't dim
 *  B - Candidate Crownstone already has a behaviour at that timepoint.
 *
 * Possible solutions for A:
 *  1 - During selection, provide an "Enable dimming" button before the Crownstone can be selected.
 *  2 - Change the behaviour from "40% dimmed" to "on" but keep the behaviour times and conditions the same (Twilight will be ignored).
 *  3 - Decline the copying of the behaviours that require dimming and copy the remainder.
 *  4 - Just blindly copy the behaviour and twilight and let the Crownstone decide to what to do. If it can't dim, it will turn on.
 *
 * Possible solutions for B:
 *  1 - Detect if the behaviour has the exact same timeslots and replace, if not, merge. (example: copied behaviour from 15-20, existing from 14-21 --> 14-15 old 15-20 copied 20-21 old)
 *  2 - Delete existing conflicting behaviour and replace with new one.
 *  3 - Block the copy fully
 *  4 - Only ignore the copying of the conflicting behaviours.
 *
 * Decision:
 *  We go with A1 for the dimming and warn the user about the override (similar button system) and do B2
 *
 *  UPDATE: We copy ALL the behaviours from 1 Crownstone to another.
 *
 */
export class DeviceSmartBehaviour_CopyStoneSelection extends LiveComponent<{copyType: string, callback(data: any): void, sphereId: string, originId: string, behavioursRequireDimming: true, isModal: boolean}, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  unsubscribeStoreEvents;
  callback;

  constructor(props) {
    super(props);

    this.state = { selectionMap: {} }

    // define the callback based on the multiselect.
    this.callback = this.props.callback;
    if (this.props.copyType === "TO") {
      this.callback = (stoneId) => {
        let newMap = {...this.state.selectionMap};

        if (this.state.selectionMap[stoneId]) {
          delete newMap[stoneId];
        }
        else {
          newMap[stoneId] = true;
        }

        this.setState({ selectionMap: newMap })
      }
    }
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.stoneChangeBehaviours || change.stoneChangeAbilities
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount(): void {
    this.unsubscribeStoreEvents();
  }

  _getLocationStoneList() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stones = sphere.stones;
    let locations = sphere.locations;
    let locationIds = Object.keys(locations);
    locationIds.sort((a,b) => { return locations[a].config.name > locations[b].config.name ? 1 : -1});

    let stoneIds = Object.keys(stones);
    stoneIds.sort((a,b) => { return stones[a].config.name > stones[b].config.name ? 1 : -1})

    let components = [];

    locationIds.forEach((locationId) => {
      let stoneDataArray = stoneIds
        .filter((stoneId) => { return stones[stoneId].config.locationId === locationId;  })
        .map((stoneId) => { return { id: stoneId, stone: stones[stoneId], selected: this.state.selectionMap[stoneId] }; })

      components.push(
        <LocationStoneList
          key={locationId}
          sphereId={this.props.sphereId}
          location={locations[locationId]}
          stoneDataArray={stoneDataArray}
          callback={this.callback}
          behavioursRequired={this.props.copyType === "FROM"} // if we want to copy behaviour from a Crownstone it must have behaviour
          dimmingRequired={this.props.copyType === "TO" ? this.props.behavioursRequireDimming : false} // if we are copying to, it is important to know if dimming is required.
          originId={this.props.originId}
        />
        )
    })

    return (
      <React.Fragment>
        { components }
      </React.Fragment>
    )
  }

  render() {
    return (
      <SettingsCustomTopBarBackground>
        <CustomTopBarWrapper
          title={this.props.copyType === "FROM" ? lang("Copy_from_whom_") : lang("Copy_to_whom_")}
          leftAction={() => { this.props.isModal ? NavigationUtil.dismissModal() : NavigationUtil.back() }}
          leftLabel={ lang("Back")}
          rightAction={() => {
            if (Object.keys(this.state.selectionMap).length === 0) {
              Alert.alert(
                lang("_No_Crownstone_selected___header"),
                lang("_No_Crownstone_selected___body"),
        [{text:lang("_No_Crownstone_selected___left")}]
              );
            }
            else {
              this.props.callback(Object.keys(this.state.selectionMap));
            }
          }}
          right={this.props.copyType === "FROM" ? null : lang("Select")}
        >
          <ScrollView contentContainerStyle={{paddingTop: topBarHeight - statusBarHeight}}>
            <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center'}}>
              { this._getLocationStoneList() }
            </View>
          </ScrollView>
        </CustomTopBarWrapper>
      </SettingsCustomTopBarBackground>
    )
  }
}

function LocationStoneList({location, sphereId, stoneDataArray, callback, originId, dimmingRequired = false, behavioursRequired = false }) {
  if (stoneDataArray.length === 0) {
    return <View />
  }
  return (
    <React.Fragment>
      <LocationRow sphereId={sphereId} locationId={location.id} />
      <StoneList stoneDataArray={stoneDataArray} sphereId={sphereId} callback={callback} dimmingRequired={dimmingRequired} behavioursRequired={behavioursRequired} originId={originId} />
      <View style={{height:50}} />
    </React.Fragment>
  );
}


function StoneList({stoneDataArray, sphereId, dimmingRequired, behavioursRequired, originId, callback}) {
  let stoneComponents = [];
  stoneDataArray.forEach((stoneData) => {
    stoneComponents.push(
      <StoneRow
        key={stoneData.id}
        sphereId={sphereId}
        stoneId={stoneData.id}
        isOrigin={stoneData.id === originId}
        stone={stoneData.stone}
        callback={() => { callback(stoneData.id); }}
        selected={stoneData.selected}
        dimmingRequired={dimmingRequired}
        behavioursRequired={behavioursRequired}
      />
    )
  })

  return (
    <React.Fragment>
      { stoneComponents }
    </React.Fragment>
  )
}

function StoneRow({isOrigin, sphereId, stoneId, stone, selected, callback, dimmingRequired, behavioursRequired}) {
  let [allowOverwrite, setAllowOverwrite] = useState(false);

  let height = 80;
  let padding = 10;

  let updateRequired = !xUtil.versions.canIUse(stone.config.firmwareVersion, '4.0.0')

  let containerStyle : ViewStyle = {
    width:screenWidth,
    height: height,
    padding:padding,
    paddingLeft:20,
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: colors.white.rgba(0.8),
    borderColor: colors.black.rgba(0.3),
    borderBottomWidth: 1
  };

  let stoneHasBehaviours = Object.keys(stone.behaviours).length > 0;
  let clickable = true;
  let overrideButton = null;
  let circleBackgroundColor = selected ? colors.green.hex : colors.green.rgba(0.5);
  let subText = null;
  let subTextStyleOverride : TextStyle = {};

  if (behavioursRequired) {
    if (!stoneHasBehaviours) {
      clickable = false;
      circleBackgroundColor = colors.gray.hex;
      subText = lang("No_behaviours_to_copy___");
    }
    else {
      subText = lang("Behaviours_available_to_c");
      circleBackgroundColor = colors.green.hex;
      if (!selected) {
        subText += lang("_n_Tap_to_select_")
      }
    }
  }
  else {
    if (stoneHasBehaviours) {
      if (allowOverwrite === false) {
        clickable = false;
        circleBackgroundColor = colors.csOrange.rgba(0.5);
        subText = lang("Existing_behaviour_will_b");
        overrideButton = (
          <TouchableOpacity style={{backgroundColor: colors.csOrange.hex, borderRadius: 15, padding:10}} onPress={() => { setAllowOverwrite(true) }}>
            <Text style={{fontSize:13, color: colors.white.hex, fontWeight:'bold', textAlign:'center'}}>{ lang("Allow") }</Text>
          </TouchableOpacity>
        );
      }
      else {
        subText = lang("Existing_behaviour_will_be");
        if (!selected) {
          subText += lang("__Tap_to_select_")
        }
        else {
          subTextStyleOverride = {fontWeight:'bold', color: colors.black.rgba(0.8)};
        }
      }
    }
  }


  if (updateRequired) {
    clickable = false;
    subText = lang("Firmware_update_required_");
    overrideButton = null;
    circleBackgroundColor = colors.gray.rgba(0.5);
  }
  else if (dimmingRequired && !isOrigin && !overrideButton) {
    if (stone.abilities.dimming.enabledTarget !== true) {
      clickable = false;
      subText = lang("Dimming_is_required_to_co");
      circleBackgroundColor = colors.csOrange.blend(colors.green, 0.75).rgba(0.5);
      subTextStyleOverride = {};
      overrideButton = (
        <TouchableOpacity style={{backgroundColor: colors.blue.hex, borderRadius: 15, padding:10}} onPress={() => {
          core.store.dispatch({type:'UPDATE_ABILITY', sphereId: sphereId, stoneId: stoneId, abilityId: ABILITY_TYPE_ID.dimming, data: {enabledTarget: true}})
        }}>
          <Text style={{fontSize:13, color: colors.white.hex, fontWeight:'bold', textAlign:'center'}}>{ lang("Enable_nDimming") }</Text>
        </TouchableOpacity>
      );
    }
  }


  if (isOrigin) {
    clickable = false;
    subText = lang("This_is_me_");
    circleBackgroundColor = colors.blue.hex;
    overrideButton = null;
    subTextStyleOverride = {};
  }


  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 15}}>{stone.config.name}</Text>
        { subText ? <Text style={{fontSize: 12, color: colors.black.rgba(0.3), paddingRight:5, ...subTextStyleOverride}}>{subText}</Text> : undefined }
      </View>
      { overrideButton }
    </React.Fragment>
  );

  if (!clickable) {
    return (
      <View style={containerStyle}>
        { content }
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={callback}
    >
      { content }
      <SlideSideFadeInView width={50} visible={!selected} />
      <SlideSideFadeInView width={50} visible={selected}>
        <View style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'ios-checkmark-circle'} color={colors.green.hex} size={26} />
        </View>
      </SlideSideFadeInView>
    </TouchableOpacity>
  )

}

