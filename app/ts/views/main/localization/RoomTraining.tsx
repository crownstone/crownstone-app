
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import {colors, screenHeight, screenWidth, styles, topBarHeight} from "../../styles";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import {bindTopbarButtons} from "../../components/hooks/viewHooks";
import {TextButtonLight} from "../../components/InterviewComponents";
import {openLocalizationHelpWebsite} from "./localizationMenu/LocalizationMenu_shared";
import { ScaledImage } from "../../components/ScaledImage";




export function RoomTraining(props) {
  bindTopbarButtons(props)

  return (
    <Background>
      <View style={{height:topBarHeight}}/>
      <KeepAwake />
      <View style={{height:30}}/>
      <Text style={styles.boldExplanation}>{ lang("In_order_for_me_to_know_w") }</Text>
      <Text style={styles.explanation}>{ lang("By_walking_around_the_roo") }</Text>

      <View style={{flex:1, ...styles.centered}}>
        <ScaledImage source={require("../../../../assets/images/map_focus.png")} sourceWidth={1193} sourceHeight={789} targetWidth={screenWidth*0.9} />
      </View>

      <Text style={styles.explanation}>{ lang("Ill_guide_you_in_this_pro") }</Text>
      <Text style={styles.explanation}>{ lang("Are_you_ready_to_get_star") }</Text>
      <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
        <TextButtonLight
          selected={false}
          label={ lang("Continue")}
          danger={false}
          textAlign={ lang("right")}
          testID={"RoomTraining_continue"}
          callback={() => { NavigationUtil.navigate('RoomTraining_inHand_intro', props); }}
        />
      </View>
    </Background>
  );
}

RoomTraining.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);
  return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, closeModal: true, help: () => { openLocalizationHelpWebsite(); } });
};

