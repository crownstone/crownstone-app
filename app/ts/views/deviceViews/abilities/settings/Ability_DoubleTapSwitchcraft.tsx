
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
import {ScaledImage} from "../../../components/ScaledImage";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { NavigationUtil } from "../../../../util/navigation/NavigationUtil";
import {SettingsBackground} from "../../../components/SettingsBackground";
import {ListEditableItems} from "../../../components/ListEditableItems";
import {Icon} from "../../../components/Icon";
import {Get} from "../../../../util/GetUtil";
import {Util} from "../../../../util/Util";
import {core} from "../../../../Core";
import {SliderBar} from "../../../components/editComponents/SliderBar";
import {xUtil} from "../../../../util/StandAloneUtil";


export class Ability_DoubleTapSwitchcraft extends Component<any, any> {
  timeout;

  static options(props) {
    return TopBarUtil.getOptions({title: "Double tap features"});
  }

  constructor(props) {
    super(props);
    let stone = Get.stone(this.props.sphereId, this.props.stoneId);
    let doubleTapSwitchcraft = stone?.abilities?.switchcraft?.properties?.doubleTapSwitchcraft?.valueTarget ?? false
    let defaultDimValue = stone?.abilities?.switchcraft?.properties?.defaultDimValue?.valueTarget ?? -40
    this.state = {
      doubleTapSwitchcraft: doubleTapSwitchcraft,
      defaultDimValue: defaultDimValue,
    }
  }


  scheduleUpdateDimValue(value) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.updateDimValue(value);
    }, 1000);
  }

  updateDimValue(value) {
    core.store.dispatch({
      type:      "UPDATE_ABILITY_PROPERTY",
      sphereId:   this.props.sphereId,
      stoneId:    this.props.stoneId,
      abilityId: 'switchcraft',
      propertyId:'defaultDimValue',
      data: {
        valueTarget: value,
        syncedToCrownstone: false,
      }});
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
    let stone = Get.stone(this.props.sphereId, this.props.stoneId);
    let defaultDimValue = stone?.abilities?.switchcraft?.properties?.defaultDimValue?.valueTarget ?? -40;
    if (defaultDimValue !== this.state.defaultDimValue) {
      this.updateDimValue(this.state.defaultDimValue);
    }
  }


  render() {
    let stone = Get.stone(this.props.sphereId, this.props.stoneId);
    if (xUtil.versions.canIUse(stone.config.firmwareVersion, '5.7.0')) {
      if (stone.abilities.dimming.enabledTarget) {

        let items = [];
        items.push({
          type:"switch",
          icon: <Icon name="md-information-circle" size={30} radius={10} color={colors.green.hex} />,
          value: this.state.doubleTapValue,
          label: "Double Tap Switchcraft",
          callback:(value) => {
            this.setState({doubleTapSwitchcraft: value})
            core.store.dispatch({
              type:      "UPDATE_ABILITY_PROPERTY",
              sphereId:   this.props.sphereId,
              stoneId:    this.props.stoneId,
              abilityId: 'switchcraft',
              propertyId:'doubleTapSwitchcraft',
              data: {
                valueTarget: value,
                syncedToCrownstone: false,
              }});
          }
        });
        if (this.state.doubleTapSwitchcraft) {
          items.push({
            __item:
              <SliderBar
                label={ "Default dim value"}
                sliderHidden={true}
                icon={<Icon name="ios-options" size={25} color={colors.darkPurple.hex} />}
                callback={(value) => {
                  this.setState({defaultDimValue: value});
                  this.scheduleUpdateDimValue(value);
                }}
                min={10}
                max={90}
                value={this.state.defaultDimValue}
                explanation={"Dim to " + this.state.defaultDimValue + "% if there's no active behaviour/twilight"}
                explanationHeight={30}
                testID={"SliderBar_hide"}
              />
          });
        }
        else {
          items.push({type:'explanation', label: "Enable double tap switchcraft to configure it further..", below: true});
        }

        return (
          <SettingsBackground>
            <ScrollView contentContainerStyle={{flex:1, alignItems:'center',}}>
              <Text style={styles.boldExplanation}>{ "Double Tap Switchcraft allows you to switch between the light being dimmed or fully on." }</Text>
              <Text style={styles.explanation}>{ "Tap the wall switch twice quickly to change between full on and the dimmed intensity." }</Text>
              <Text style={styles.explanation}>{ "The dim value is dependent on the twiligth and behaviour dim value and the time of day." +
                " If there is no dimmed value in twilight or behaviour, the default value is used." }</Text>
              <View style={{height:10}} />
              <View style={{width:screenWidth}}>
                <ListEditableItems items={items} />
              </View>
              <View style={{height:100}} />
            </ScrollView>
          </SettingsBackground>
        );
      }

      return (
        <SettingsBackground>
          <ScrollView contentContainerStyle={{flex:1, alignItems:'center',}}>
            <Text style={styles.boldExplanation}>{ "Double Tap Switchcraft allows you to switch between the light being dimmed or fully on." }</Text>
            <Text style={styles.explanation}>{ "Tap the wall switch twice quickly to change between full on and the dimmed intensity." }</Text>
            <Text style={styles.explanation}>{ "The dim value is dependent on the twiligth and behaviour dim value and the time of day." +
              " If there is no dimmed value in twilight or behaviour, the default value is used." }</Text>
            <View style={{height:10}} />
            <Text style={styles.boldExplanation}>{ "Dimming has to be enabled in order to use double tap switchcraft." }</Text>
          </ScrollView>
        </SettingsBackground>
      );
    }


    return (
      <SettingsBackground>
        <ScrollView contentContainerStyle={{flex:1, alignItems:'center',}}>
          <Text style={styles.boldExplanation}>{ "Update this Crownstone to firmware 5.7.0 or higher to use double tap Switchcraft." }</Text>
        </ScrollView>
      </SettingsBackground>
    );


  }
}
