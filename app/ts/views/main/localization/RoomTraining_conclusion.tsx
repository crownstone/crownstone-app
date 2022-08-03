import * as React from 'react';
import { SettingsBackground } from '../../components/SettingsBackground';
import {TopBarUtil} from "../../../util/TopBarUtil";
import {ScrollView, Text, View} from "react-native";
import {colors, screenHeight, screenWidth, styles, topBarHeight} from "../../styles";
import {Button} from "../../components/Button";
import {NavigationUtil} from "../../../util/navigation/NavigationUtil";
import {Spacer} from "../../components/Spacer";
import {Get} from "../../../util/GetUtil";
import {FingerprintUtil} from "../../../util/FingerprintUtil";




export function RoomTraining_conclusion(props: { sphereId: string, locationId: string }) {
  let location = Get.location(props.sphereId, props.locationId);

  let showImprovementSuggestion = true;
  if (FingerprintUtil.hasInPocketSet(location)) {
    showImprovementSuggestion = false;
  }

  let finalizationButton;
  let label;
  if (FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(props.sphereId)) {
    label = "This room can be used for indoor localization once all other rooms are trained!";
    finalizationButton = (
      <Button
        backgroundColor={colors.csBlue.hex}
        icon={'c1-locationPin1'}
        iconSize={11}
        label={ "Train other rooms!"}
        callback={() => { NavigationUtil.dismissModal() }}
      />
    );
  }
  else {
    label = "This room can now be used for indoor localization!";
    finalizationButton = (
      <Button
        backgroundColor={colors.csBlue.hex}
        icon={'c1-locationPin1'}
        iconSize={11}
        label={ "Finalize localization!"}
        callback={() => { NavigationUtil.dismissModal(); }}
      />
    );
  }


  return (
    <SettingsBackground testID={"SetupLocalization"}>
      <ScrollView contentContainerStyle={{flexGrow:1, paddingTop: topBarHeight}} contentInsetAdjustmentBehavior={"never"}>
      <View style={{height:20}}/>
      <View style={{height:0.25*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
      <Text style={styles.boldExplanation}>{label}</Text>
        {showImprovementSuggestion && <Text style={styles.explanation}>{"You can further improve the performance by training in a different way too."}</Text> }
      <Spacer />
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          {showImprovementSuggestion && <Button
            backgroundColor={colors.blue.hex}
            icon={'ios-play'}
            label={ "Further improve " + location.config.name + "!"}
            callback={() => { NavigationUtil.navigate('RoomTraining_inPocket_intro', {sphereId: props.sphereId, locationId: props.locationId}); }}
          /> }
          { finalizationButton }
        </View>
      </ScrollView>
    </SettingsBackground>
  );
}

RoomTraining_conclusion.options = TopBarUtil.getOptions({title:"Training complete!", disableBack: true});
