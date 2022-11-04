
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationDetail", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View
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
import {LocalizationUtil} from "../../../util/LocalizationUtil";
import {DataUtil} from "../../../util/DataUtil";


export function LocalizationDetail(props: {sphereId: string, locationId: string}) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState']);

  let penalties = FingerprintUtil.calculateLocationPenalties(props.sphereId, props.locationId);
  let score     = FingerprintUtil.calculateLocationScore(props.sphereId, props.locationId);

  let items = [];
  items.push({
    type:'navigation',
    label: lang("Add_more_training_data___"),
    callback: () => {
      NavigationUtil.launchModal("RoomTraining_inHand_intro", {sphereId: props.sphereId, locationId: props.locationId, isModal: true, minRequiredSamples: 20});
    },
  })
  items.push({
    type:'navigation',
    label: lang("Find_and_fix_difficult_sp"),
    callback: () => {
      NavigationUtil.launchModal("LocalizationFindAndFix", {sphereId: props.sphereId, locationId: props.locationId});
    },
  })

  let deleteButton = [
    {
      type:  'button',
      label: lang("DELETE_ALL_COLLECTED_DATA"),
      numberOfLines:3,
      callback: () => {
        Alert.alert(
lang("_Are_you_sure___You_will__header"),
lang("_Are_you_sure___You_will__body"),
[{text: lang("_Are_you_sure___You_will__left"), style: 'cancel'},
            {
text: lang("_Are_you_sure___You_will__right"), style:'destructive', onPress: () => {
              LocalizationUtil.deleteAllLocalizationData(props.sphereId, props.locationId);
              NavigationUtil.back();
            }},
          ],
          {cancelable: false}
        )
      }
    },
    {
      type: 'explanation', label: lang("Careful__you_will_need_to"), below: true
    }];


  let advancedButton = [
    {
      type:  'button',
      label: lang("Manage_fingerprints"),
      style: {color: colors.blue.hex},
      callback: () => {
        NavigationUtil.launchModal("LocalizationFingerprintManager", {sphereId: props.sphereId, locationId: props.locationId});
      }
    },
    {
      type: 'explanation', label: lang("DEV__Delete_individual_fi"), below: true
    }];


  return (
    <Background>
      <View style={{height:topBarHeight}}/>
      <ScrollView>
        <Text style={styles.header}>{ lang("Training_quality") }</Text>
        <View style={{flexDirection:'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
          { getStars(score, 30, FingerprintUtil.isScoreGoodEnough(score) ? colors.csBlue : colors.csOrange) }
        </View>
        <View style={{height:15}} />
        { FingerprintUtil.isScoreGoodEnough(score) ?
          <Text style={styles.boldLeftExplanation}>{ lang("Add_more_stars_by_") }</Text> :
          <Text style={styles.boldLeftExplanation}>{ lang("Address_the_issue_by_") }</Text>
        }
          <Improvements {...props} score={score} penalties={penalties} />

        { FingerprintUtil.isScoreGoodEnough(score) &&  <View style={{height:25}} /> }
        { FingerprintUtil.isScoreGoodEnough(score) &&  <Text style={styles.boldLeftExplanation}>{ lang("Further_improve_localizat") }</Text> }
        { FingerprintUtil.isScoreGoodEnough(score) &&  <ListEditableItems items={items} /> }

        <View style={{height:25}} />
        <Text style={styles.boldLeftExplanation}>{ lang("Permanently_delete_all_lo") }</Text>
        <ListEditableItems items={deleteButton} />
        { <ListEditableItems items={advancedButton} /> }
      </ScrollView>

    </Background>
  );
}


LocalizationDetail.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);

  return TopBarUtil.getOptions({ title: lang("Unknown_room",location.config.name)});
}

function Improvements(props: {sphereId: string, locationId: string, score: number, penalties: PenaltyList}) {
  let penalties = props.penalties;

  let improvements = [];

  if (penalties.missingInPocket < 0) {
    improvements.push([penalties.missingInPocket,{
      type: 'navigation',
      label: lang("Adding_an_in_pocket_train"),
      icon: <StarImprovement penalty={penalties.missingInPocket} />,
      numberOfLines:2,
      callback: () => {
        NavigationUtil.launchModal("RoomTraining_inPocket_intro", {sphereId: props.sphereId, locationId: props.locationId, isModal:true});
      }
    }]);
  }

  if (penalties.unknownDeviceType < 0 || penalties.insufficientAmountOfData < 0) {
    improvements.push([penalties.unknownDeviceType + penalties.insufficientAmountOfData,{
      type: 'navigation',
      label: lang("Retraining_the_room_on_th"),
      icon: <StarImprovement penalty={penalties.unknownDeviceType + penalties.insufficientAmountOfData} />,
      numberOfLines:2,
      callback: () => {
        NavigationUtil.launchModal("RoomTraining_inHand_intro", {sphereId: props.sphereId, locationId: props.locationId, isModal:true});
      }
    }]);
  }

  if (penalties.missingCrownstones < 0) {
    improvements.push([penalties.missingCrownstones, {
      type: 'navigation',
      label: lang("Retraining_to_include_new"),
      icon: <StarImprovement penalty={penalties.missingCrownstones} />,
      numberOfLines:2,
      callback: () => {
        NavigationUtil.launchModal("RoomTraining_inHand_intro", {sphereId: props.sphereId, locationId: props.locationId, isModal:true});
      }
    }]);
  }

  if (penalties.missingTransform < 0) {
    improvements.push([penalties.missingTransform, {
      type:  'navigation',
      label: lang("Optimizing_for_your_phone"),
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
  );
}


