
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationAdvancedSettings", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Text, View, Alert, Linking } from "react-native";


import {colors, styles, topBarHeight} from "../../styles";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { useDatabaseChange } from "../../components/hooks/databaseHooks";
import { SettingsBackground } from "../../components/SettingsBackground";
import { ListEditableItems } from "../../components/ListEditableItems";
import { core } from "../../../Core";
import {Get} from "../../../util/GetUtil";
import {SphereDeleted} from "../../static/SphereDeleted";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";


export function LocalizationTransform_userSelect(props: {sphereId, options: {userId: string, deviceId: string, deviceString: string}[] }) {
  bindTopbarButtons(props);

  let state = core.store.getState();


  let sphere = Get.sphere(props.sphereId);
  if (!sphere) { return <SphereDeleted /> }

  let items = [];
  items.push({label: "PEOPLE THAT CAN HELP YOU",  type:'explanation'});

  for (let option of props.options) {
    let user;
    if (option.userId === state.user.userId) {
      // this is you but with a different device.
      user = state.user;
    }
    else {
      user = sphere.users[option.userId]
    }

    let userName = user.firstName + " " + user.lastName;
    let device = option.deviceString.split("_")[2]
    items.push({
      type: 'navigation',
      label: `${userName} (${device})`,
      callback: () => {
        NavigationUtil.navigate("LocalizationTransform_intro", { sphereId: props.sphereId, ...option});
      }
    })
  }

  return (
    <SettingsBackground>
      <View style={{height:topBarHeight}}/>
      <View style={{height:30}}/>
      <Text style={styles.header}>{ "You have options!" }</Text>
      <Text style={styles.boldExplanation}>{ "You can transform the datasets trained by other people to be perfect for your phone too!" }</Text>
      <Text style={styles.explanation}>{ "Select someone from the list who is currently available to help you for about 5 minutes." }</Text>
      <View style={{height:30}}/>
      <ListEditableItems items={items} />
    </SettingsBackground>
  );
}

LocalizationTransform_userSelect.options = TopBarUtil.getOptions({ title: "Select someone", closeModal: true});

