
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Wrapup", key)(a,b,c,d,e);
}
import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle, ScrollView, Alert
} from "react-native";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenWidth,
} from "../../styles";
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { NavigationUtil, NavState } from "../../../util/NavigationUtil";
import { WeekDayList, WeekDayListLarge } from "../../components/WeekDayList";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { Icon } from "../../components/Icon";
import { BehaviourSubmitButton } from "./supportComponents/BehaviourSubmitButton";
import { BEHAVIOUR_TYPES } from "../../../router/store/reducers/stoneSubReducers/rules";


export class DeviceSmartBehaviour_Wrapup extends LiveComponent<{sphereId: string, stoneId: string, rule: string, twilightRule: boolean, ruleId?: string}, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  rule : AicoreBehaviour | AicoreTwilight;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;

    let activeDays = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true };
    if (this.props.ruleId) {
      let rule = stone.rules[this.props.ruleId];
      if (rule) {
        activeDays = rule.activeDays;
      }
    }

    this.state = { activeDays: activeDays };

    if (this.props.twilightRule) {
      // @ts-ignore
      this.rule = new AicoreTwilight(this.props.rule);
    }
    else {
      // @ts-ignore
      this.rule = new AicoreBehaviour(this.props.rule);
    }
  }

  _storeRule() {
    let ruleId = this.props.ruleId || xUtil.getUUID();
    core.store.dispatch({
      type: this.props.ruleId ? "UPDATE_STONE_RULE" : "ADD_STONE_RULE",
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      ruleId: ruleId,
      data: {
        type: this.props.twilightRule ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour,
        data: this.props.rule,
        activeDays: this.state.activeDays,
      }
    });

    return ruleId;
  }

  getOptionContext() {
    if (!this.rule.hasNoOptions()) {
      // @ts-ignore
      if (this.rule.rule.options.type === "SPHERE_PRESENCE_AFTER") {
        return (
          <Text style={deviceStyles.specification}>{ lang("After_this_behaviour__I_w") }</Text>
        );
      }
      else {
        // in room
        return (
          <Text style={deviceStyles.specification}>{ lang("I_wont_turn_off_as_long_a") }</Text>
        );
      }
    }
  }

  submit() {
    let days = Object.keys(this.state.activeDays);
    let atleastOneDay = false;
    for (let i = 0; i < days.length; i++) {
      if (this.state.activeDays[days[i]] === true) {
        atleastOneDay = true;
        break;
      }
    }

    if (!atleastOneDay) {
      Alert.alert(
        lang("_Never___Please_pick_at_l_header"),
        lang("_Never___Please_pick_at_l_body"),
        [{text:lang("_Never___Please_pick_at_l_left")}])
      return;
    }

    this._storeRule();

    // close the wrap up modal to shwo the overview beneath it.
    NavigationUtil.dismissModal();
  }

  render() {
    let header = "Every day?"
    if (this.props.ruleId) {
      header = "When do I do this?"
    }



    return (
      <Background image={core.background.lightBlur} hideNotifications={true} fullScreen={true} dimStatusBar={true} hideOrangeLine={true} orangeLineAboveStatusBar={true}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableModalHeight, alignItems:'center'}}>
            <View style={{flexDirection: 'row', alignItems:'center'}}>
              <TouchableOpacity style={{width:0.15*screenWidth, height:93, justifyContent:'center'}} onPress={() => { NavigationUtil.back(); }}>
                <Icon name={'ios-arrow-back'} size={33} color={colors.csBlueDark.hex} style={{marginLeft:15}} />
              </TouchableOpacity>
              <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text>
              <View style={{width:0.15*screenWidth, height: 93}} />
            </View>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_days_below_to_let") }</Text>

            <View style={{flex:1}} />
            <WeekDayListLarge
              data={this.state.activeDays}
              tight={true}
              darkTheme={false}
              onChange={(fullData, day) => { this.setState({activeDays: fullData}); }}
            />

            <View style={{flex:1}} />
            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <BehaviourSubmitButton callback={() => { this.submit() }} label={lang("Thats_it_")} />
              <View style={{flex:1}} />
            </View>
            <View style={{height: 30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}
