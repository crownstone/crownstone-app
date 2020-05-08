
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react';
import { core } from "../../../core";
import { Background } from "../../components/Background";
import {  ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenHeight,
  screenWidth
} from "../../styles";
import { SlideFadeInView } from "../../components/animated/SlideFadeInView";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { SmartBehaviourRule } from "./supportComponents/SmartBehaviourRule";
import ResponsiveText from "../../components/ResponsiveText";
import { Button } from "../../components/Button";


/**
 *
 * We're going to copy a number of rules from the origin Crownstone to a number of other Crownstones.
 *
 * Possible Conflicts:
 *  A - Rule requires dimming, but the candidate crownstone can't dim
 *  B - Candidate Crownstone already has a rule at that timepoint.
 *
 * Possible solutions for A:
 *  1 - During selection, provide an "Enable dimming" button before the Crownstone can be selected.
 *  2 - Change the rule from "40% dimmed" to "on" but keep the behaviour times and conditions the same (Twilight will be ignored).
 *  3 - Decline the copying of the rules that require dimming and copy the remainder.
 *  4 - Just blindly copy the behaviour and twilight and let the Crownstone decide to what to do. If it can't dim, it will turn on.
 *
 * Possible solutions for B:
 *  1 - Detect if the rule has the exact same timeslots and replace, if not, merge. (example: copied behaviour from 15-20, existing from 14-21 --> 14-15 old 15-20 copied 20-21 old)
 *  2 - Delete existing conflicting rule and replace with new one.
 *  3 - Block the copy fully
 *  4 - Only ignore the copying of the conflicting rules.
 *
 * Decision:
 *  We go with A1 for the dimming and warn the user about the override (similar button system) and do B2
 *
 *  UPDATE: We copy ALL the rules from 1 Crownstone to another.
 *
 *  This class is unused but may be future work.
 *
 */
export class DeviceSmartBehaviour_RuleSelector extends LiveComponent<any, any> {
  static options(props) {
    const stone = core.store.getState().spheres[props.sphereId].stones[props.stoneId];
    return TopBarUtil.getOptions({title: stone.config.name});
  }

  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    this.state = { selectionMap: {} }
  }


  render() {
    let iconSize = 0.15*screenHeight;

    let state = core.store.getState();

    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return <View />;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return <View />;
    let rules = stone.rules;

    let ruleIds = Object.keys(rules);

    let ruleComponents = [];

    ruleIds.forEach((ruleId) => {
      let rule = rules[ruleId];
      let ruleComponent = (
        <SmartBehaviourRule
          key={"description" + ruleId}
          rule={rule}
          indoorLocalizationDisabled={state.app.indoorLocalizationEnabled !== true}
          sphereId={this.props.sphereId}
          stoneId={this.props.stoneId}
          ruleId={ruleId}
          editMode={this.state.editMode}
          ruleSelection={this.state.ruleSelection}
          selected={this.state.selectionMap[ruleId] === true}
          faded={false}
        />
      );

      ruleComponents.push(<TouchableOpacity key={'ruleSelect' + ruleId} onPress={() => {
        let newMap = {...this.state.selectionMap};

        if (this.state.selectionMap[ruleId]) {
          delete newMap[ruleId];
        }
        else {
          newMap[ruleId] = true;
        }

        this.setState({selectionMap: newMap })
      }}>{ruleComponent}</TouchableOpacity>);
    });

    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <ResponsiveText style={{...deviceStyles.header, width: 0.7*screenWidth}} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ "Tap behaviours to copy!" }</ResponsiveText>
            <View style={{height: 0.2*iconSize}} />

            <View style={{flex:1}} />
            {ruleComponents}
            <View style={{flex:1}} />
            <SlideFadeInView visible={true} height={80}>
              <Button
                label={ 'Copy selected behaviour(s)' }
                callback={() => {
                  this.props.callback(this.state.selectionMap);
                }}
                icon={'md-log-out'}
                iconSize={14}
                iconColor={colors.purple.blend(colors.blue, 0.5).rgba(0.75)}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={true} height={80}>
              <Button
                label={ 'Back' }
                callback={() => { NavigationUtil.back()  }}
                icon={'md-close-circle'}
                backgroundColor={ colors.green.rgba(0.5) }
                iconSize={14}
                iconColor={colors.blue.rgba(0.5)}
              />
            </SlideFadeInView>
            <View style={{flex:3}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}

