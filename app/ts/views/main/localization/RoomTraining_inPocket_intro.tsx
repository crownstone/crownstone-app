
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining_inPocket_intro", key)(a,b,c,d,e);
}
import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import {bindTopbarButtons} from "../../components/hooks/viewHooks";
import { ScrollView } from 'react-native';
import Video from 'react-native-video';
import {openLocalizationHelpWebsite} from "./localizationMenu/LocalizationMenu_shared";




export function RoomTraining_inPocket_intro(props) {
  bindTopbarButtons(props);

return (
    <Background>
      <ScrollView contentContainerStyle={{flexGrow:1, paddingTop: topBarHeight}} contentInsetAdjustmentBehavior={"never"}>
        <KeepAwake />
        <View style={{height:20}}/>
        <Text style={styles.boldExplanation}>{ lang("We_walk_around_the_room_i") }</Text>
        <Text style={styles.explanation}>{ lang("Stand_in_places_you_commo") }</Text>

        <View style={{flex:1}}/>
        <Video
          source={require('../../../../assets/video/inpocket.mov')}
          style={{height:0.35*screenHeight, width:screenWidth}}
          repeat={true}
          playInBackground={false}
          resizeMode={'cover'}
        />
        <View style={{flex:1}}/>

        <Text style={styles.explanation}>{ lang("Collect_as_much_as_you_ca") }</Text>
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.blue.rgba(0.75)}
            icon={'ios-play'}
            label={ "Start!"}
            callback={() => { NavigationUtil.navigate('RoomTraining_training', {sphereId: props.sphereId, locationId: props.locationId, type: "IN_POCKET"}); }}
          />
        </View>
      </ScrollView>
    </Background>
  );
}


RoomTraining_inPocket_intro.options = (props) => {
  let location = Get.location(props.sphereId, props.locationId);
  return TopBarUtil.getOptions({title: `Additional training`, closeModal: true, help: () => { openLocalizationHelpWebsite(); } });
}
