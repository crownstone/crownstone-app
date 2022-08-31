
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Ability_SwitchcraftSettings", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text, View
} from "react-native";


import { colors, screenHeight, screenWidth, styles } from "../../../styles";
import {IconButton} from "../../../components/IconButton";
import {ScaledImage} from "../../../components/ScaledImage";
import { core } from "../../../../Core";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { Separator } from "../../../components/Separator";
import { ButtonBar } from "../../../components/editComponents/ButtonBar";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import { NavigationBar } from "../../../components/editComponents/NavigationBar";
import { ABILITY_TYPE_ID } from "../../../../database/reducers/stoneSubReducers/abilities";
import {SettingsBackground} from "../../../components/SettingsBackground";
import {ListEditableItems} from "../../../components/ListEditableItems";
import {Icon} from "../../../components/Icon";


export class Ability_SwitchcraftSettings extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Switchcraft_Settings")});
  }

  disable() {
    core.store.dispatch({type:"UPDATE_ABILITY", sphereId: this.props.sphereId, stoneId: this.props.stoneId, abilityId: ABILITY_TYPE_ID.switchcraft, data: { enabledTarget: false }});
    NavigationUtil.back();
  }

  render() {
    let items = [];
    items.push({
      type:"navigation",
      icon: <Icon name="md-information-circle" size={30} radius={10} color={colors.green.hex} />,
      label: lang("Installation___Informatio"),
      callback:() => { this.props.information(); }
    });
    items.push({
      type:"navigation",
      icon: <Icon name="ion5-sunny" size={30} radius={10} color={colors.blue.hex} />,
      label: "Double tap features",
      callback:() => { NavigationUtil.navigate("Ability_DoubleTapSwitchcraft", {sphereId: this.props.sphereId, stoneId: this.props.stoneId}) }
    });
    items.push({
      type:"button",
      icon: <Icon name="md-remove-circle" size={30} radius={10} color={colors.menuRed.hex} />,
      label: lang("Disable_Switchcraft"),
      callback:() => { this.disable() }
    });

    return (
      <SettingsBackground>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../../assets/images/overlayCircles/switchcraft.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ lang("This_Crownstone_is_config") }</Text>
            <Text style={styles.explanation}>{ lang("Tap_the_installation___in") }</Text>
            <Text style={styles.explanation}>{ lang("Swichcraft_should_only_be") }</Text>
            <View style={{height:10}} />
            <View style={{width:screenWidth}}>
              <ListEditableItems items={items} />
            </View>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </SettingsBackground>
    )
  }
}
