
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View, Alert, Linking
} from "react-native";


import { colors, deviceStyles, background } from "../../styles";
import {Background} from "../../components/Background";
import {IconButton} from "../../components/IconButton";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { ListEditableItems } from "../../components/ListEditableItems";
import {
  DataUtil,
  enoughCrownstonesForIndoorLocalization
} from "../../../util/DataUtil";
import {Icon} from "../../components/Icon";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import {FingerprintUtil} from "../../../util/FingerprintUtil";



export function LocalizationMenu(props) {
  bindTopbarButtons(props);
  useDatabaseChange(['changeFingerprint','changeSphereState']);


  let items = [];
  let enoughCrownstones = enoughCrownstonesForIndoorLocalization(props.sphereId);
  let trainingRequired  = FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(props.sphereId);

  items.push({ label: "INDOOR LOCALIZATION", type: 'largeExplanation' });
  if (enoughCrownstones) {
    if (trainingRequired) {
      getTrainingRoomItems(items, props.sphereId);
    }
    else {
      getExitingLocalizationItems(items, props.sphereId);
    }
  }
  else {
    getLearnAboutLocalizationItems(items, props.sphereId)
  }

  items.push({type:'spacer'});
  items.push({type:'spacer'});
  items.push({type:'spacer'});

  return (
    <Background image={background.main} hasNavBar={false} testID={"LocalizationMenu"}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ListEditableItems items={items} />
      </ScrollView>
    </Background>
  );

}

LocalizationMenu.options = TopBarUtil.getOptions({ title: "Localization", closeModal: true });


function getExitingLocalizationItems(items: any[], sphereId: sphereId) {
  items.push({
    label: "Improve localization",
    type: 'navigation',
    testID: 'ImproveLocalization',
    icon: <Icon name='c1-locationPin1' size={25} color={colors.csBlue.hex}/>,
    callback: () => {

    }
  });
  items.push({label: "Is the localization not working correctly? This will take you through the steps to identify the problem and improve the localization!",  type:'explanation', below: true});

  items.push({
    label: "Localization quick fix",
    type: 'navigation',
    numberOfLines: 2,
    testID: 'LocalizationMistake',
    icon: <Icon name='c1-router' size={28} color={colors.blue.hex}/>,
    callback: () => {

    }
  });
  items.push({label: "If the localization was wrong and you've been in the same room for at least 2 minutes, use this to quickly fix the problem!",  type:'explanation', below: true});

  getLearnAboutLocalizationItems(items, sphereId);
}


function getTrainingRoomItems(items: any[], sphereId: sphereId) {
  let disabled = false;
  let label = "By teaching the localization where all your rooms are, you can use your location for behaviour!"
  if (!DataUtil.inSphere(sphereId)) {
    disabled = true;
    label = "You have to be in the sphere to setup indoor localization...";
  }

  items.push({
    label: "Let's setup localization!",
    type: 'navigation',
    disabled: disabled,
    testID: 'setupLocalization',
    icon: <Icon name='c1-locationPin1' size={24} color={colors.green.hex}/>,
    callback: () => {
      NavigationUtil.navigate( "SetupLocalization", {sphereId: sphereId});
    }
  });
  items.push({label: label,  type:'explanation', below: true});
  items.push({type:'spacer'});

  getLearnAboutLocalizationItems(items, sphereId);
}


function getLearnAboutLocalizationItems(items: any[], sphereId: sphereId) {
  items.push({
    label: "Learn about indoor localization",
    type: 'navigation',
    numberOfLines: 3,
    testID: 'ImproveLocalization',
    icon: <Icon name='md-book' size={25} color={colors.blueDark.hex}/>,
    callback: () => {
      Linking.openURL('https://crownstone.rocks/positioning-users/').catch(err => {})
    }
  });
  items.push({label: "You need at least 4 Crownstones to enable indoor localization. Find out why this is, and what it can do for you!",  type:'explanation', below: true});
}
