
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationTransform_userSelect", key)(a,b,c,d,e);
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
  items.push({label: lang("PEOPLE_THAT_CAN_HELP_YOU"),  type:'explanation'});

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
      <Text style={styles.header}>{ lang("You_have_options_") }</Text>
      <Text style={styles.boldExplanation}>{ lang("You_can_transform_the_dat") }</Text>
      <Text style={styles.explanation}>{ lang("Select_someone_from_the_l") }</Text>
      <View style={{height:30}}/>
      <ListEditableItems items={items} />
    </SettingsBackground>
  );
}

LocalizationTransform_userSelect.options = TopBarUtil.getOptions({ title: lang("Select_someone"), closeModal: true});

