
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationTransform_intro", key)(a,b,c,d,e);
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
import {SafeAreaView} from "react-native-safe-area-context";


export function LocalizationTransform_intro(props: {sphereId:sphereId, userId: string, deviceId: string, deviceString: string, isModal?: boolean }) {
  bindTopbarButtons(props);

  let state = core.store.getState();

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
      <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', paddingVertical:30}}>
        <Text style={styles.header}>{ lang("Lets_optimize_for_your_ph") }</Text>
        {props.userId === state.user.userId ?
          <LocalizationTransformSelf  device={device}/> :
          <LocalizationTransformOther userName={userName} device={device}/>
        }
        <View style={{flex:1}} />
        <Button
          backgroundColor={colors.blue.rgba(0.75)}
          icon={'ios-play'}
          label={ lang("Next")}
          callback={() => { NavigationUtil.navigate('LocalizationTransform', {sphereId: props.sphereId, otherUserId: props.userId, otherDeviceId: props.deviceId, deviceString: props.deviceString, isHost:true}); }}
        />
      </SafeAreaView>
    </SettingsBackground>
  );
}


function LocalizationTransformSelf(props: {device:string }) {
  return (
    <React.Fragment>
      <Text style={styles.boldExplanation}>{ lang("Go_get_the_other_device_y",props.device) }</Text>
      <Text style={styles.explanation}>{ lang("The_more_Crownstones_you_") }</Text>
      <Text style={styles.explanation}>{ lang("This_is_going_to_take_a_f") }</Text>
    </React.Fragment>
  )
}
function LocalizationTransformOther(props: {userName:string, device: string}) {
  return (
    <React.Fragment>
      <Text style={styles.boldExplanation}>{ lang("Go_get__so_we_can_get_sta",props.userName) }</Text>
      <Text style={styles.explanation}>{ lang("Tell_him_her_to_bring_the",props.device) }</Text>
      <Text style={styles.explanation}>{ lang("The_more_Crownstones_you_h") }</Text>
      <Text style={styles.explanation}>{ lang("This_is_going_to_take_a_fe") }</Text>
    </React.Fragment>
  )
}

LocalizationTransform_intro.options = (props) => { return TopBarUtil.getOptions({ title: lang("Optimize_"), closeModal: props.isModal ?? undefined}); }

