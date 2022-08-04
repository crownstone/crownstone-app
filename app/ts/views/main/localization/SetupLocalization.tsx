import * as React from 'react';
import {
  ScrollView,
  Text,
  View
} from "react-native";


import {
  colors,
  styles,
  screenHeight,
  screenWidth,
  availableModalHeight
} from "../../styles";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import { Get } from "../../../util/GetUtil";
import { Spacer } from "../../components/Spacer";
import { Button } from "../../components/Button";
import { SettingsBackground } from "../../components/SettingsBackground";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { Icon } from '../../components/Icon';
import {openLocalizationHelpWebsite} from "./localizationMenu/LocalizationMenu_shared";
import { ScaledImage } from "../../components/ScaledImage";


export function SetupLocalization(props: {sphereId: sphereId}) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeSphereState','changeFingerprint']);

  let toDoRooms     = getToDoRooms(props.sphereId);
  let finishedRooms = getFinishedRooms(props.sphereId);

  if (toDoRooms.length === 0) {
    return <SetupFinished />;
  }

  return (
    <SettingsBackground testID={"SetupLocalization"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems:'center' }}>
        <View style={{height:30}}/>
        <Text style={styles.header}>{"To use indoor localization, we have to walk around each room to learn about the Crownstone signals in the rooms."}</Text>
        <View style={{height:30}}/>
        <View style={styles.centered}>
          <ScaledImage source={require("../../../../assets/images/map_house.png")} sourceWidth={1185} sourceHeight={835} targetHeight={screenHeight*0.3} />
        </View>
        <View style={{height:30}}/>
        <Text style={styles.explanation}>{toDoRooms.length > 1 ? "We need to gather data in these rooms:" : "Only one room left to do!"}</Text>
        <ListEditableItems items={toDoRooms} style={{width: screenWidth}}/>
        <View style={{height:30}}/>
        { finishedRooms.length > 0 && <Text style={styles.explanation}>{finishedRooms.length > 1 ? "These rooms are already done:" : "This room is already done:"}</Text> }
        { finishedRooms.length > 0 && <ListEditableItems items={finishedRooms} style={{width: screenWidth}}/> }
        { toDoRooms.length > 1 && finishedRooms.length === 0 && <Text style={styles.header}>{"Pick a room to get started!"}</Text> }
      </ScrollView>
    </SettingsBackground>
  );
}

SetupLocalization.options = (props) => {
  return TopBarUtil.getOptions({ title: "Setup Localization", closeModal: props.isModal ?? false, help: () => { openLocalizationHelpWebsite(); } });
}


function SetupFinished(props) {
  return (
    <SettingsBackground testID={"SetupLocalization"}>
      <ScrollView contentContainerStyle={{alignItems:'center', minHeight: availableModalHeight }}>
        <View style={{height:30}}/>
        <Text style={styles.title}>{"All done!"}</Text>
        <View style={{height:30}}/>
        <View style={styles.centered}>
          <ScaledImage source={require("../../../../assets/images/map_house_finished.png")} sourceWidth={1193} sourceHeight={825} targetWidth={screenWidth} />
        </View>
        <View style={{height:30}}/>
        <Text style={styles.explanation}>
          <Text>{"If you want to improve the localization performance later on, the "}</Text>
          <Text style={{ fontWeight:'bold' }}>{"Improve Localization"}</Text>
          <Text>{" option is now available from the localization menu."}</Text>
        </Text>
        <Spacer />
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.csBlue.hex}
            icon={'ios-play'}
            label={ "Finish!"}
            callback={() => { NavigationUtil.dismissAllModals(); }}
          />
        </View>
      </ScrollView>
    </SettingsBackground>
  );
}


function getFinishedRooms(sphereId: sphereId) {
  let items = [];
  let sphere = Get.sphere(sphereId);
  if (!sphere) { return []; }
  for (let locationId in sphere.locations) {
    let location = sphere.locations[locationId];
    if (Object.keys(location.fingerprints.raw).length !== 0) {
      items.push({
        label: location.config.name,
        type: 'info',
        icon: <Icon name={'ios-checkmark-circle'}  size={25} color={colors.green.hex} />,
      })
    }
  }
  return items;
}


function getToDoRooms(sphereId: sphereId) {
  let items = [];
  let sphere = Get.sphere(sphereId);
  if (!sphere) { return []; }
  for (let locationId in sphere.locations) {
    let location = sphere.locations[locationId];
    if (Object.keys(location.fingerprints.raw).length === 0) {
      items.push({
        label: location.config.name,
        type: 'navigation',
        icon: <Icon name={'c1-locationPin1'} size={20} color={colors.blue.hex}/>,
        callback: () => {
          NavigationUtil.launchModal('RoomTraining',{sphereId: sphereId, locationId: locationId});
        }
      })
    }
  }
  return items;
}
