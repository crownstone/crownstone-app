import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { Icon } from "../../../components/Icon";
import { colors } from "../../../styles";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import { Background } from "../../../components/Background";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { Get } from "../../../../util/GetUtil";
import { FingerprintUtil } from "../../../../util/FingerprintUtil";
import { RoomList } from "../../../components/RoomList";



export function LocalizationMenu_active(props) {
  let items = [];
  items.push({
    label: "I have moved a Crownstone..",
    type: 'navigation',
    numberOfLines: 2,
    testID: 'LocalizationMistake',
    icon: <Icon name='c1-crownstone' size={28} color={colors.blue.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationQuickFix', {sphereId: props.sphereId});
    }
  });

  items.push({
    label: "Improve from localization mistake...",
    type: 'navigation',
    numberOfLines: 2,
    testID: 'LocalizationMistake',
    icon: <Icon name='c1-router' size={28} color={colors.blue.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationQuickFix', {sphereId: props.sphereId});
    }
  });
  items.push({label: "If the localization was wrong and you've been in the same room for at least 3 minutes, use this to quickly fix the problem!",  type:'explanation', below: true});

  let sphere = Get.sphere(props.sphereId);


  return (
    <SettingsBackground testID={"LocalizationMenu_active"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ListEditableItems items={items} />
        <LocalizationLocationList sphereId={props.sphereId} />
      </ScrollView>
    </SettingsBackground>
  );
}


/**
 * Component that displays the list of rooms that are in the sphere.
 * @param props
 * @constructor
 */
function LocalizationLocationList(props : {sphereId: sphereId}) {
  let sphere = Get.sphere(props.sphereId);
  if (!sphere) { return null; }

  let items = [];
  for (let locationId in sphere.locations) {
    items.push(<LocalizationLocation key={locationId} sphereId={props.sphereId} locationId={locationId} />);
  }

  return <React.Fragment>{items}</React.Fragment>;
}

function LocalizationLocation(props: { sphereId: sphereId, locationId: locationId }) {
  let location = Get.location(props.sphereId, props.locationId);
  if (!location) { return <View />; }

  let fingerprints = location.fingerprints.raw;
  let scores = {};
  let sum = 0;
  for (let fingerprintId in fingerprints) {
    scores[fingerprintId] = FingerprintUtil.calculateScore(props.sphereId, props.locationId, fingerprintId);
    sum += scores[fingerprintId];
  }

  return <RoomList name={location.config.name} icon={location.config.icon} hideSubtitle />;

}
