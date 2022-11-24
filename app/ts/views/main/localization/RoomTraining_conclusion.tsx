
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining_conclusion", key)(a,b,c,d,e);
}
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
import { ScaledImage } from "../../components/ScaledImage";
import { SettingsScrollView } from "../../components/SettingsScrollView";




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
      <SettingsScrollView>
      <View style={{height:20}}/>
        <View style={{...styles.centered}}>
          <ScaledImage source={require("../../../../assets/images/map_finished.png")} sourceWidth={1193} sourceHeight={909} targetWidth={screenWidth*0.9} />
        </View>
      <Text style={styles.boldExplanation}>{label}</Text>
        {showImprovementSuggestion && <Text style={styles.explanation}>{ lang("You_can_further_improve_t") }</Text> }
      <Spacer />
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          {showImprovementSuggestion && <Button
            backgroundColor={colors.blue.hex}
            icon={'ios-play'}
            label={ "Train in-pocket set"}
            callback={() => {
              NavigationUtil.dismissModal();
              setTimeout(() => {NavigationUtil.launchModal('RoomTraining_inPocket_intro', {sphereId: props.sphereId, locationId: props.locationId});}, 50)
            }}
          /> }
          { finalizationButton }
        </View>
      </SettingsScrollView>
    </SettingsBackground>
  );
}

RoomTraining_conclusion.options = TopBarUtil.getOptions({title: lang("Training_complete_"), disableBack: true});
