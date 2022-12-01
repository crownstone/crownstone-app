
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationMenu_gettingStarted", key)(a,b,c,d,e);
}
import * as React from 'react';
import { DataUtil } from "../../../../util/DataUtil";
import { Icon } from "../../../components/Icon";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import { colors, screenWidth, styles } from "../../../styles";
import { getLearnAboutLocalizationItems } from "./LocalizationMenu_shared";
import { ListEditableItems } from "../../../components/ListEditableItems";
import { SettingsBackground } from "../../../components/SettingsBackground";
import { SettingsScrollView } from "../../../components/SettingsScrollView";
import { ScaledImage } from "../../../components/ScaledImage";
import { Text, View } from "react-native";




export function LocalizationMenu_gettingStarted(props) {
  let items = [];
  let disabled = false;
  let label = "By teaching the localization where all your rooms are, you can use your location for behaviour!"
  if (!DataUtil.inSphere(props.sphereId)) {
    disabled = true;
    label = "You have to be in the sphere to setup indoor localization...";
  }

  items.push({label: lang("LETS_GET_STARTED"),  type:'explanation'});
  items.push({
    label: lang("Setup_localization_"),
    type: 'navigation',
    disabled: disabled,
    testID: 'setupLocalization',
    icon: <Icon name='c1-locationPin1' size={24} color={colors.green.hex}/>,
    callback: () => {
      NavigationUtil.navigate( "SetupLocalization", {sphereId: props.sphereId});
    }
  });
  items.push({label: label,  type:'explanation', below: true});
  items.push({type:'spacer'});

  getLearnAboutLocalizationItems(items);

  items.push({
    label: lang("Advanced_Settings"),
    type: 'navigation',
    numberOfLines: 1,
    testID: 'LocalizationAdvancedSettings',
    icon: <Icon name='ios-cog' size={28} color={colors.csBlue.hex}/>,
    callback: () => {
      NavigationUtil.navigate('LocalizationAdvancedSettings', {sphereId: props.sphereId});
    }
  });
  items.push({label: lang('Look_here_to_configure_sm'),  type:'explanation', below: true});

  return (
    <SettingsBackground testID={"LocalizationMenu_gettingStarted"}>
      <SettingsScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{height:20}}/>
        <Text style={styles.header}>{ lang("indoor_localization") }</Text>
        <View style={{height:30}}/>
        <View style={styles.centered}>
          <ScaledImage source={require("../../../../../assets/images/map_house_4_crownstones.png")} sourceWidth={1193} sourceHeight={842} targetWidth={screenWidth*0.9} />
        </View>
        <ListEditableItems items={items} />
      </SettingsScrollView>
    </SettingsBackground>
  );
}



