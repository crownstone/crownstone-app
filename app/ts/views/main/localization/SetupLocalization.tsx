
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SetupLocalization", key)(a,b,c,d,e);
}
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
import { SettingsScrollView } from "../../components/SettingsScrollView";


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
      <SettingsScrollView contentContainerStyle={{ flexGrow: 1, alignItems:'center' }}>
        <View style={{height:30}}/>
        <Text style={styles.header}>{ lang("To_use_indoor_localizatio") }</Text>
        <View style={{height:30}}/>
        <View style={styles.centered}>
          <ScaledImage source={require("../../../../assets/images/map_house.png")} sourceWidth={1185} sourceHeight={835} targetHeight={screenHeight*0.3} />
        </View>
        <View style={{height:30}}/>
        <Text style={styles.explanation}>{ lang("We_need_to_gather_data_in",toDoRooms.length,1) }</Text>
        <ListEditableItems items={toDoRooms} style={{width: screenWidth}}/>
        <View style={{height:30}}/>
        { finishedRooms.length > 0 && <Text style={styles.explanation}>{ lang("These_rooms_are_already_d",finishedRooms.length,1) }</Text> }
        { finishedRooms.length > 0 && <ListEditableItems items={finishedRooms} style={{width: screenWidth}}/> }
        { toDoRooms.length > 1 && finishedRooms.length === 0 && <Text style={styles.header}>{ lang("Pick_a_room_to_get_starte") }</Text> }
      </SettingsScrollView>
    </SettingsBackground>
  );
}

SetupLocalization.options = (props) => {
  return TopBarUtil.getOptions({ title: lang("Setup_Localization"), closeModal: props.isModal ?? false, help: () => { openLocalizationHelpWebsite(); } });
}


function SetupFinished(props) {
  return (
    <SettingsBackground testID={"SetupLocalization"}>
      <SettingsScrollView contentContainerStyle={{alignItems:'center', minHeight: availableModalHeight }}>
        <View style={{height:30}}/>
        <Text style={styles.title}>{ lang("All_done_") }</Text>
        <View style={{height:30}}/>
        <View style={styles.centered}>
          <ScaledImage source={require("../../../../assets/images/map_house_finished.png")} sourceWidth={1193} sourceHeight={825} targetWidth={screenWidth} />
        </View>
        <View style={{height:30}}/>
        <Text style={styles.explanation}>
          <Text>{ lang("If_you_want_to_improve_th") }</Text>
          <Text style={{ fontWeight:'bold' }}>{ lang("Improve_Localization") }</Text>
          <Text>{ lang("_option_is_now_available_") }</Text>
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
      </SettingsScrollView>
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
