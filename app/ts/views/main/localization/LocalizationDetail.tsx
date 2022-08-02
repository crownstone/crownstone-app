
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationDetail", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  Text,
  View,
} from "react-native";


import { colors, deviceStyles, background, topBarHeight, styles, screenHeight, screenWidth } from "../../styles";
import {Background} from "../../components/Background";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { Get } from "../../../util/GetUtil";
import {FingerprintUtil, PenaltyList} from "../../../util/FingerprintUtil";
import {getStars} from "./localizationMenu/LocalizationMenu_active";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";


export function LocalizationDetail(props: {sphereId: string, locationId: string}) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState']);

  let penalties = FingerprintUtil.calculateLocationPenalties(props.sphereId, props.locationId);
  let score     = FingerprintUtil.calculateLocationScore(props.sphereId, props.locationId);

  let items = [];
  items.push({
    type:'navigation',
    label: 'Add more training data...',
    callback: () => {
      NavigationUtil.launchModal("RoomTraining_inHand_intro", {sphereId: props.sphereId, locationId: props.locationId, minRequiredSamples: 20});
    },
  })
  items.push({
    type:'navigation',
    label: 'Find and fix difficult spots...',
    callback: () => {
      NavigationUtil.launchModal("LocalizationFindAndFix", {sphereId: props.sphereId, locationId: props.locationId});
    },
  })

  let deleteButton = [
    {
      type:  'button',
      label: 'DELETE ALL COLLECTED DATA',
      numberOfLines:3,
      callback: () => {}
    },
    {
      type: 'explanation', label:'Careful, you will need to retrain this room again if you delete all the data.', below: true
    }];


  return (
    <Background>
      <View style={{height:topBarHeight}}/>
      <ScrollView>
        <Text style={styles.header}>{"Training quality"}</Text>
        <View style={{flexDirection:'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
          { getStars(score, 30, colors.csBlue) }
        </View>
        <View style={{height:15}} />
        { FingerprintUtil.isScoreGoodEnough(score) ?
          <Text style={styles.boldLeftExplanation}>{"Add more stars by:"}</Text> :
          <Text style={styles.boldLeftExplanation}>{"Address the issues by:"}</Text>
        }
          <Improvements {...props} score={score} penalties={penalties} />

        { FingerprintUtil.isScoreGoodEnough(score) &&  <View style={{height:25}} /> }
        { FingerprintUtil.isScoreGoodEnough(score) &&  <Text style={styles.boldLeftExplanation}>{"Further improve localization by:"}</Text> }
        { FingerprintUtil.isScoreGoodEnough(score) &&  <ListEditableItems items={items} /> }

        <View style={{height:25}} />
        <Text style={styles.boldLeftExplanation}>{"Permanently delete all localization data for this room for a fresh start. This will affect the localization for everyone..."}</Text>
        <ListEditableItems items={deleteButton} />
      </ScrollView>

    </Background>
  );
}


LocalizationDetail.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);

  return TopBarUtil.getOptions({ title: location?.config?.name || "Unknown room" });
}

function Improvements(props: {sphereId: string, locationId: string, score: number, penalties: PenaltyList}) {
  let penalties = props.penalties;

  let improvements = [];

  if (penalties.missingInPocket < 0) {
    improvements.push([penalties.missingInPocket,{
      type: 'navigation',
      label: "Adding an in-pocket training set...",
      icon: <StarImprovement penalty={penalties.missingInPocket} />,
      numberOfLines:2,
      callback: () => {
        NavigationUtil.launchModal("RoomTraining_inPocket_intro", {sphereId: props.sphereId, locationId: props.locationId});
      }
    }]);
  }

  if (penalties.unknownDeviceType < 0 || penalties.insufficientAmountOfData < 0) {
    improvements.push([penalties.unknownDeviceType + penalties.insufficientAmountOfData,{
      type: 'navigation',
      label: "Retraining the room on this device...",
      icon: <StarImprovement penalty={penalties.unknownDeviceType + penalties.insufficientAmountOfData} />,
      numberOfLines:2,
      callback: () => {
        NavigationUtil.launchModal("RoomTraining_inHand_intro", {sphereId: props.sphereId, locationId: props.locationId});
      }
    }]);
  }

  if (penalties.missingCrownstones < 0) {
    improvements.push([penalties.missingCrownstones, {
      type: 'navigation',
      label: "Retraining to include new Crownstones...",
      icon: <StarImprovement penalty={penalties.missingCrownstones} />,
      numberOfLines:2,
      callback: () => {
        NavigationUtil.launchModal("RoomTraining_inHand_intro", {sphereId: props.sphereId, locationId: props.locationId});
      }
    }]);
  }

  if (penalties.missingTransform < 0) {
    improvements.push([penalties.missingTransform, {
      type:  'navigation',
      label: 'Optimizing for your phone...',
      icon: <StarImprovement penalty={penalties.missingTransform} />,
      numberOfLines:2,
      callback: () => {}
    }]);
  }

  improvements.sort((a,b) => { return a[0] - b[0] });
  let items = [];
  for (let improvement of improvements) {
    items.push(improvement[1]);
  }

  return (
    <React.Fragment>
      { improvements.length > 0 && <ListEditableItems items={items} /> }
    </React.Fragment>
  );
}

function StarImprovement(props) {
  let stars = getStars(-1*props.penalty, 13, colors.green, false);
  if (stars.length > 3) {
    return (
      <View style={{alignItems:'center', justifyContent:'center', width: 45, height: 50}}>
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
        <Text style={{color:colors.green.hex, fontWeight:'bold'}}>+</Text>
        {stars.slice(0,3)}
        </View>
        <View style={{flexDirection:'row'}}>
          {stars.slice(3)}
        </View>
      </View>
    );
  }
  return (
    <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', width: 45, height: 50}}>
      <Text style={{color:colors.green.hex, fontWeight:'bold'}}>+</Text>
      {getStars(-1*props.penalty, 13, colors.green, false)}
    </View>
  )
}


