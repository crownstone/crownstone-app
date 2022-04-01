
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert
} from "react-native";


import { colors, deviceStyles, background, styles, screenHeight, screenWidth } from "../../styles";
import {Background} from "../../components/Background";
import {IconButton} from "../../components/IconButton";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import { createNewSphere } from "../../../util/CreateSphere";
import { Stacks } from "../../Stacks";
import { ListEditableItems } from "../../components/ListEditableItems";
import { SphereStateManager } from "../../../backgroundProcesses/SphereStateManager";
import {
  canUseIndoorLocalizationInSphere,
  DataUtil,
  enoughCrownstonesForIndoorLocalization
} from "../../../util/DataUtil";
import { Get } from "../../../util/GetUtil";
import { Spacer } from "../../components/Spacer";
import { Button } from "../../components/Button";

const ICON_RADIUS = 12;

export class SetupLocalization extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({ title: "Setup Localization" });
  }

  unsubscribeEventListener = () => {};

  componentDidMount() {
    this.unsubscribeEventListener = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      // enter/exit sphere
      if (change.changeSphereState && change.changeSphereState.sphereIds[this.props.sphereId]) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeEventListener();
  }


  _getFinishedRooms() {
    let items = [];
    let state = core.store.getState();

    let sphere = Get.sphere(this.props.sphereId);
    if (!sphere) { return []; }
    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      if (Object.keys(location.fingerprints).length === 0) {
        items.push({
          label: location.config.name,
          type: 'info',
          icon: <IconButton name={'ios-checkmark-circle'} buttonSize={30} size={20} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.green.hex }}/>,
        })
      }
    }
    return items;
  }


  _getToDoRooms() {
    let items = [];
    let state = core.store.getState();

    let sphere = Get.sphere(this.props.sphereId);
    if (!sphere) { return []; }
    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      if (Object.keys(location.fingerprints).length === 0) {
        items.push({
          label: location.config.name,
          type: 'navigation',
          icon: <IconButton name={'c1-locationPin1'} buttonSize={30} size={20} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.blue.hex }}/>,
          callback: () => {
            NavigationUtil.launchModal('RoomTrainingStep1',{sphereId: this.props.sphereId, locationId: locationId});
          }
        })
      }
    }
    return items;
  }


  render() {
    let toDoRooms     = this._getToDoRooms();
    let finishedRooms = this._getFinishedRooms();

    if (toDoRooms.length === 0) {
      return (
        <Background image={background.main} hasNavBar={false} testID={"SetupLocalization"}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems:'center' }}>
            <View style={{height:30}}/>
            <Text style={styles.title}>{"All done!"}</Text>
            <View style={{height:30}}/>
            <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
            <View style={{height:30}}/>
            <Text style={styles.explanation}>
              <Text>{"If you want to improve the localization performance later on the "}</Text>
              <Text style={{ fontWeight:'bold' }}>{"Improve Localization"}</Text>
              <Text>{" feature is now available from the localization menu."}</Text>
            </Text>
            <Spacer />
            <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
              <Button
                backgroundColor={colors.blue.rgba(0.5)}
                icon={'ios-play'}
                label={ "Finish!"}
                callback={() => { NavigationUtil.back(); }}
              />
            </View>
          </ScrollView>
        </Background>
      );
    }

    return (
      <Background image={background.main} hasNavBar={false} testID={"SetupLocalization"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems:'center' }}>
          <View style={{height:30}}/>
          <Text style={styles.header}>{"To use indoor localization, we have to walk around each room to learn about the Crownstone signals in the rooms."}</Text>
          <View style={{height:30}}/>
          <View style={{height:0.20*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
          <View style={{height:30}}/>
          <Text style={styles.explanation}>{toDoRooms.length > 1 ? "We need to gather data in these rooms:" : "Only one room left to do!"}</Text>
          <ListEditableItems items={toDoRooms} style={{width: screenWidth}}/>
          <View style={{height:30}}/>
          { finishedRooms.length > 0 && <Text style={styles.explanation}>{finishedRooms.length > 1 ? "These rooms are already done:" : "This room is already done:"}</Text> }
          { finishedRooms.length > 0 && <ListEditableItems items={finishedRooms} style={{width: screenWidth}}/> }
          { finishedRooms.length === 0 && <Text style={styles.header}>{"Pick a room to get started!"}</Text> }
        </ScrollView>
      </Background>
    );
  }
}
