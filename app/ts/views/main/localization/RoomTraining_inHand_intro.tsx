import * as React from 'react';
import { Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import {bindTopbarButtons} from "../../components/hooks/viewHooks";
import Video from 'react-native-video';
import {openLocalizationHelpWebsite} from "./localizationMenu/LocalizationMenu_shared";



export function RoomTraining_inHand_intro(props) {
  bindTopbarButtons(props);

  return (
    <Background>
        <View style={{height: topBarHeight}} />
        <KeepAwake />
        <View style={{height:20}}/>
        <Text style={styles.boldExplanation}>{"Walk around the room with the phone in your hand, arm stretched out."}</Text>
        <Text style={styles.explanation}>{"Once the phone vibrates, move it to a new position and hold it there. Repeat this with as many unique positions as possible."}</Text>

        <View style={{flex:1}}/>
        <Video
          source={require('../../../../assets/video/arm_test.mov')}
          style={{height:0.35*screenHeight, width:screenWidth}}
          repeat={true}
          rate={0.1}
          playInBackground={false}
          resizeMode={'cover'}
        />
        <View style={{flex:1}}/>

        <Text style={styles.explanation}>{"Once I have collected enough information, I'll let you know!"}</Text>
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center'}}>
          <Button
            backgroundColor={colors.blue.rgba(0.75)}
            icon={'ios-play'}
            label={ "Start!"}
            callback={() => { NavigationUtil.navigate('RoomTraining_training', {sphereId: props.sphereId, locationId: props.locationId, type: "IN_HAND", minRequiredSamples: props.minRequiredSamples}); }}
          />
        </View>
    </Background>
  );
}

RoomTraining_inHand_intro.options = (props) => {
  return TopBarUtil.getOptions({title: `Training session`, closeModal: props.isModal, help: () => { openLocalizationHelpWebsite(); } });
}
