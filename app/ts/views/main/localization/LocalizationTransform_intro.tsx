
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationAdvancedSettings", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Text, View, Alert, Linking } from "react-native";


import {colors, styles, topBarHeight} from "../../styles";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { bindTopbarButtons } from "../../components/hooks/viewHooks";
import { SettingsBackground } from "../../components/SettingsBackground";
import { core } from "../../../Core";
import {Get} from "../../../util/GetUtil";
import {SphereDeleted} from "../../static/SphereDeleted";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {Button} from "../../components/Button";


export function LocalizationTransform_intro(props: {sphereId:sphereId, userId: string, deviceId: string, deviceString: string, isModal?: boolean }) {
  bindTopbarButtons(props);

  let state = core.store.getState();

  let items = [];
  items.push({label: "PEOPLE THAT CAN HELP YOU",  type:'explanation'});

  let sphere = Get.sphere(props.sphereId);
  if (!sphere) { return <SphereDeleted /> }

  let user;
  if (props.userId === state.user.userId) {
    // this is you but with a different device.
    user = state.user;
  }
  else {
    user = sphere.users[props.userId];
  }

  let userName = user.firstName + " " + user.lastName;
  let device = props.deviceString.split("_")[2]

  return (
    <SettingsBackground>
      <View style={{height:topBarHeight}}/>
      <View style={{height:30}}/>
      <Text style={styles.header}>{ "Let's optimize for your phone!" }</Text>
      {props.userId === state.user.userId ?
        <LocalizationTransformSelf  device={device}/> :
        <LocalizationTransformOther userName={userName} device={device}/>
      }
      <Button
        backgroundColor={colors.blue.rgba(0.75)}
        icon={'ios-play'}
        label={ "Next"}
        callback={() => { NavigationUtil.navigate('LocalizationTransform', {sphereId: props.sphereId, userId: props.userId, deviceId: props.deviceId, deviceString: props.deviceString, host:true}); }}
      />
    </SettingsBackground>
  );
}


function LocalizationTransformSelf(props: {device:string }) {
  return (
    <React.Fragment>
      <Text style={styles.boldExplanation}>{ "Go get the other device you used to train the localization (" + props.device + ")." }</Text>
      <Text style={styles.explanation}>{ "This is going to take a few minutes, press Next when you have your other device with the Crownstone app onscreen." }</Text>
    </React.Fragment>
  )
}
function LocalizationTransformOther(props: {userName:string, device: string}) {
  return (
    <React.Fragment>
      <Text style={styles.boldExplanation}>{ "Go get " + props.userName + " so we can get started."}</Text>
      <Text style={styles.explanation}>{ "Tell him/her to bring the phone used to train the localization (" + props.device + ")." }</Text>
      <Text style={styles.explanation}>{ "This is going to take a few minutes, press Next when the other person is next to you and has opened the Crownstone app." }</Text>
    </React.Fragment>
  )
}

LocalizationTransform_intro.options = (props) => { return TopBarUtil.getOptions({ title: "Optimize!", closeModal: props.isModal ?? undefined}); }

