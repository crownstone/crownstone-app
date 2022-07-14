import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";
import { Icon } from "../../../components/Icon";
import { colors, menuStyles, screenWidth } from "../../../styles";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import { Background } from "../../../components/Background";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { Get } from "../../../../util/GetUtil";
import { FingerprintUtil } from "../../../../util/FingerprintUtil";
import { RoomList } from "../../../components/RoomList";



export function LocalizationMenu_active(props) {
  let items = [];
  items.push({label: "CHANGES AND QUICKFIX",  type:'explanation'});
  items.push({
    label: "I have moved a Crownstone..",
    type: 'navigation',
    numberOfLines: 2,
    testID: 'LocalizationMistake',
    icon: <Icon name='c2-crownstone' size={31} color={colors.black.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationCrownstoneMoved', {sphereId: props.sphereId});
    }
  });

  items.push({
    label: "Improve from localization mistake...",
    type: 'navigation',
    numberOfLines: 2,
    testID: 'LocalizationMistake',
    icon: <Icon name='fa5-flushed' size={28} color={colors.black.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationQuickFix', {sphereId: props.sphereId});
    }
  });
  items.push({label: "If the localization was wrong and you've been in the same room for at least 3 minutes, tap this to improve localization!",  type:'explanation', below: true});

  items.push({label: "LOCALIZATION TRAINING QUALITY",  type:'explanation', alreadyPadded: true});

  let sphere = Get.sphere(props.sphereId);


  return (
    <SettingsBackground testID={"LocalizationMenu_active"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom:30 }}>
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
  items.push(<View style={{height:1, width:screenWidth, backgroundColor: menuStyles.separator.backgroundColor}}/>);
  let locationIds = Object.keys(sphere.locations);
  locationIds.sort((a,b) => { return sphere.locations[a].config.name.localeCompare(sphere.locations[b].config.name); });
  for (let locationId of locationIds) {
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
    scores[fingerprintId] = FingerprintUtil.calculateFingerprintScore(props.sphereId, props.locationId, fingerprintId);
    sum += scores[fingerprintId];
  }

  return <RoomItem sphereId={props.sphereId} locationId={props.locationId} hideSubtitle />;
}


function RoomItem(props) {
  let size = 50;
  let fontSize = 16;

  let location = Get.location(props.sphereId, props.locationId);
  if (!location) { return <View />; }

  let score = FingerprintUtil.calculateLocationScore(props.sphereId, props.locationId);
  let factor = (100 - score) / 100;
  factor = Math.random();

  return (
    <View style={{
      // backgroundColor: colors.csOrange.blend(colors.green, factor).rgba(0.75),
      flexDirection:'row',
      alignItems:'center',
      paddingVertical: 12,
      paddingHorizontal:10,
      borderBottomWidth:1,
      borderColor: menuStyles.separator.backgroundColor,
    }}>
      <Icon name={location.config.icon} size={35} color={colors.black.hex} />
      <View style={{flexDirection:'column', flex:1, paddingLeft:10}}>
        <Text style={{fontSize:fontSize}}>{location.config.name}</Text>
      </View>
      { props.value ?? <Text style={{fontSize:fontSize, ...(props.valueStyle ?? {})}}>{props.value}</Text> }
      { getStars(factor) }
      <Icon name="ios-arrow-forward" size={18} color={'#888'} style={{paddingRight:0, paddingLeft:15}} />
    </View>
  )
}

function getStars(score: number) {
  let stars = [];
  let size = 19;
  for (let i = 0; i < 5; i++) {
    score -= 0.2;
    if (score >= 0) {
      stars.push(<Icon key={`star_${i}`} name="fa-star" size={size} color={colors.black.hex} />);
    }
    else if (score >= -0.1) {
      stars.push(<Icon key={`star_${i}`} name="fa-star-half-o" size={size} color={colors.black.hex} />);
    }
    else {
      stars.push(<Icon key={`star_o_${i}`} name="fa-star-o" size={size} color={colors.black.rgba(0.3)} />);
    }
  }

  return stars;
}
