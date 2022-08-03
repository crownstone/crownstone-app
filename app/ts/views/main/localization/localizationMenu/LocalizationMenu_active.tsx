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
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { Get } from "../../../../util/GetUtil";
import { FingerprintUtil } from "../../../../util/FingerprintUtil";
import { LocalizationUtil } from "../../../../util/LocalizationUtil";



export function LocalizationMenu_active(props) {
  let items = [];
  let secondItems = [];
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
  items.push({label: "If the localization was wrong and you've been in the same room for at least 3 minutes, tap this to quickly improve localization!",  type:'explanation', below: true});


  let locationsAttention = LocalizationUtil.getLocationsInNeedOfAttention(props.sphereId);
  let goodLocations      = LocalizationUtil.getLocationsWithGoodFingerprints(props.sphereId);
  let alreadyPadded      = true;
  if (locationsAttention.length > 0) {
    items.push({label: "THESE ROOMS NEED ATTENTION",  type:'explanation', alreadyPadded: alreadyPadded});
    alreadyPadded = !alreadyPadded;
  }

  if (goodLocations.length > 0) {
    secondItems.push({label: "LOCALIZATION TRAINING QUALITY",  type:'explanation', alreadyPadded: alreadyPadded});
  }

  return (
    <SettingsBackground testID={"LocalizationMenu_active"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom:30 }}>
        <ListEditableItems items={items} />
        <LocalizationLocationList sphereId={props.sphereId} locations={locationsAttention} backgroundColor={colors.csOrange.rgba(0.5)}  />
        <ListEditableItems items={secondItems} />
        <LocalizationLocationList sphereId={props.sphereId} locations={goodLocations} />
      </ScrollView>
    </SettingsBackground>
  );
}


/**
 * Component that displays the list of rooms that are in the sphere.
 * @param props
 * @constructor
 */
function LocalizationLocationList(props : {sphereId: sphereId, locations: LocationData[], backgroundColor?: string }) {
  let sphere = Get.sphere(props.sphereId);
  if (!sphere) { return null; }

  if (props.locations.length === 0) { return null; }

  let items = [];
  items.push(<View style={{height:1, width:screenWidth, backgroundColor: menuStyles.separator.backgroundColor}}/>);

  let locationIds = props.locations.map(location => location.id);
  locationIds.sort((a,b) => { return sphere.locations[a].config.name.localeCompare(sphere.locations[b].config.name); });

  for (let locationId of locationIds) {
    items.push(<RoomItem key={locationId} {...props} locationId={locationId} />);
  }

  return <React.Fragment>{items}</React.Fragment>;
}

function RoomItem(props : { sphereId: sphereId, locationId: locationId, backgroundColor?: string }) {
  let fontSize = 16;

  let location = Get.location(props.sphereId, props.locationId);
  if (!location) { return <React.Fragment />; }

  let score = FingerprintUtil.calculateLocationScore(props.sphereId, props.locationId);

  return (
    <TouchableOpacity style={{
      flexDirection:'row',
      alignItems:'center',
      paddingVertical: 12,
      paddingHorizontal:10,
      borderBottomWidth:1,
      borderColor: menuStyles.separator.backgroundColor,
      backgroundColor: props.backgroundColor ?? menuStyles.listView.backgroundColor
    }}
      onPress={() => { NavigationUtil.navigate("LocalizationDetail",{sphereId: props.sphereId, locationId: props.locationId}); }}>
      <Icon name={location.config.icon} size={35} color={colors.black.hex} />
      <View style={{flexDirection:'column', flex:1, paddingLeft:10}}>
        <Text style={{fontSize:fontSize}}>{location.config.name}</Text>
      </View>
      { getStars(score) }
      <Icon name="ios-arrow-forward" size={18} color={'#888'} style={{paddingRight:0, paddingLeft:15}} />
    </TouchableOpacity>
  )
}

/**
 * Get the stars for a given score.
 * @param score
 * @param size    Icon size
 * @param color   Icon color
 */
export function getStars(score: number, size: number = 19, color = colors.black, showEmptyStars = true) {
  let stars = [];
  for (let i = 0; i < 5; i++) {
    score -= 20;
    if (score >= -5) {
      stars.push(<Icon key={`star_${i}`} name="fa-star" size={size} color={color.hex} />);
    }
    else if (score >= -15) {
      stars.push(<Icon key={`star_half_o_${i}`} name="fa-star-half-o" size={size} color={color.hex}/>);
    }
    else {
      if (showEmptyStars) {
        stars.push(<Icon key={`star_o_${i}`} name="fa-star-o" size={size} color={color.rgba(0.5)}/>);
      }
    }
  }
  return stars;
}
