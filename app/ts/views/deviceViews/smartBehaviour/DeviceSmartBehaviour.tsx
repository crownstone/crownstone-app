
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react';
import { DeviceSmartBehaviour_TypeSelector } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../Core";
import { Background } from "../../components/Background";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import {
  availableModalHeight, background,
  colors,
  deviceStyles,
  screenHeight,
  screenWidth, styles
} from "../../styles";
import { SlideFadeInView } from "../../components/animated/SlideFadeInView";
import { WeekDayList } from "../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { SmartBehaviourRule } from "./supportComponents/SmartBehaviourRule";
import { BackButtonHandler } from "../../../backgroundProcesses/BackButtonHandler";
import { StoneUtil } from "../../../util/StoneUtil";
import { ScaledImage } from "../../components/ScaledImage";
import { DataUtil } from "../../../util/DataUtil";
import { AicoreUtil } from "./supportCode/AicoreUtil";
import { DAY_INDICES_SUNDAY_START } from "../../../Constants";
import { Permissions } from "../../../backgroundProcesses/PermissionManager";
import { StoneDataSyncer } from "../../../backgroundProcesses/StoneDataSyncer";
import { xUtil } from "../../../util/StandAloneUtil";
import ResponsiveText from "../../components/ResponsiveText";
import { BEHAVIOUR_TYPES } from "../../../Enums";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { Button } from "../../components/Button";
import { NoRulesYet } from "./DeviceSmartBehaviour_NoRulesYet";
import { BehaviourCopyFromButton } from "./buttons/Behaviour_CopyFromButton";
import { BehaviourSyncButton } from "./buttons/Behaviour_SyncButton";


let className = "DeviceSmartBehaviour";


export class DeviceSmartBehaviour extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props, {});
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    let weekday = new Date().getDay();
    this.state = { editMode: false, activeDay: DAY_INDICES_SUNDAY_START[weekday] };
  }


  navigationButtonPressed({ buttonId }) {
    let updateTopBar = () => {
      getTopBarProps(this.props, this.state);
      TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
    }
    if (buttonId === 'edit') {
      this.setState({ editMode: true  }, updateTopBar);
      BackButtonHandler.override(className, () => {
        BackButtonHandler.clearOverride(className);
        this.setState({ editMode: false  }, updateTopBar);
      })
    }
    if (buttonId === 'closeEdit') {
      BackButtonHandler.clearOverride(className);
      this.setState({ editMode: false  }, updateTopBar); }
  }


  componentDidMount(): void {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSphereSmartHomeState ||
        change.stoneChangeRules      && change.stoneChangeRules.stoneIds[this.props.stoneId] ||
        change.updateStoneCoreConfig && change.updateStoneCoreConfig.stoneIds[this.props.stoneId]
      ) {
        getTopBarProps(this.props, this.state);
        TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount(): void {
    this.unsubscribeStoreEvents();
    BackButtonHandler.clearOverride(className);
  }

  copySelectedRulesToStones(stoneIds) {
    let state = core.store.getState();

    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;
    let rules = stone.rules;
    let ruleIds = Object.keys(rules);

    stoneIds.forEach((toStoneId) => {
      StoneUtil.copyRulesBetweenStones(this.props.sphereId, this.props.stoneId, toStoneId, ruleIds);
    })
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
    let activeRules = {};
    let activityMap = {};

    let previousDay = (DAY_INDICES_SUNDAY_START.indexOf(this.state.activeDay) + 6) % 7;

    let hasRules = ruleIds.length;

    if (!hasRules && !this.state.editMode) {
      return <NoRulesYet sphereId={this.props.sphereId} stoneId={this.props.stoneId} />;
    }

    ruleIds.sort((a,b) => {
      let aIsYesterday = !rules[a].activeDays[this.state.activeDay] && rules[a].activeDays[DAY_INDICES_SUNDAY_START[previousDay]];
      if (aIsYesterday) { return -1; }
      let bIsYesterday = !rules[b].activeDays[this.state.activeDay] && rules[b].activeDays[DAY_INDICES_SUNDAY_START[previousDay]];
      if (bIsYesterday) { return 1; }

      if (AicoreUtil.aStartsBeforeB(rules[a], rules[b], this.props.sphereId)) {
        return 1;
      }
      return -1;
    })

    let presenceRulePresent = false;
    let roomBasedPresenceRulePresent = false;
    let behaviourOverridden = stone.state.behaviourOverridden;

    ruleIds.forEach((ruleId) => {
      let rule = rules[ruleId];
      let active = rule.activeDays[this.state.activeDay];
      let partiallyActive = !active && rule.activeDays[DAY_INDICES_SUNDAY_START[previousDay]] && AicoreUtil.endsNextDay(rule, this.props.sphereId);

      if (active || (partiallyActive && !this.state.editMode)) {
        activeRules[ruleId] = rules[ruleId];
        activityMap[ruleId] = {
          yesterday: rules[ruleId].activeDays[DAY_INDICES_SUNDAY_START[previousDay]],
          today:     rules[ruleId].activeDays[this.state.activeDay],
        };

        let overrideActive = false;

        let overrideCheck = (ruleObj) => {
          if (ruleObj && ruleObj.isCurrentlyActive(this.props.sphereId)) {
            if (Math.round(100*stone.state.state) !== ruleObj.getDimPercentage() && behaviourOverridden) {
              overrideActive = true;
            }
          }
        }


        if (rule.type === BEHAVIOUR_TYPES.behaviour) {
          let ruleObj = new AicoreBehaviour(rule.data);
          overrideCheck(ruleObj)
          if (ruleObj.isUsingPresence()) {
            if (ruleObj.isUsingMultiRoomPresence() || ruleObj.isUsingSingleRoomPresence()) {
              roomBasedPresenceRulePresent = true;
            }
            presenceRulePresent = true;
          }
        }
        else {
          let ruleObj = new AicoreTwilight(rule.data);
          overrideCheck(ruleObj)
        }

        let ruleComponent = (
          <SmartBehaviourRule
            key={"description" + ruleId}
            rule={rule}
            sphereId={this.props.sphereId}
            stoneId={this.props.stoneId}
            activeDay={this.state.activeDay}
            indoorLocalizationDisabled={state.app.indoorLocalizationEnabled !== true}
            startedYesterday={!rules[ruleId].activeDays[this.state.activeDay] && rules[ruleId].activeDays[DAY_INDICES_SUNDAY_START[previousDay]]}
            ruleId={ruleId}
            overrideActive={overrideActive}
            editMode={this.state.editMode}
            faded={partiallyActive}
          />
        );

        ruleComponents.push(ruleComponent);
      }
    });

    return (
      <Background image={background.lightBlurLighter} hasNavBar={false}>
        {!sphere.state.smartHomeEnabled && sphere.state.present === true && <DisabledBehaviourBanner sphereId={this.props.sphereId} /> }
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={{ flexGrow: 1, alignItems:'center', paddingTop:30 }}>
            <ResponsiveText style={{...deviceStyles.header, width: 0.7*screenWidth}} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ lang("My_Behaviour", stone.config.name) }</ResponsiveText>
            <View style={{height: 0.2*iconSize}} />
            <SlideFadeInView visible={true} height={1.5*(screenWidth/9)}>
              <WeekDayList
                data={{
                  Mon: this.state.activeDay === DAY_INDICES_SUNDAY_START[1],
                  Tue: this.state.activeDay === DAY_INDICES_SUNDAY_START[2],
                  Wed: this.state.activeDay === DAY_INDICES_SUNDAY_START[3],
                  Thu: this.state.activeDay === DAY_INDICES_SUNDAY_START[4],
                  Fri: this.state.activeDay === DAY_INDICES_SUNDAY_START[5],
                  Sat: this.state.activeDay === DAY_INDICES_SUNDAY_START[6],
                  Sun: this.state.activeDay === DAY_INDICES_SUNDAY_START[0],
                }}
                tight={true}
                darkTheme={false}
                onChange={(fullData, day) => {
                  if (this.state.activeDay !== day) {
                    this.setState({activeDay:day})
                  }
                }}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={!this.state.editMode} height={0.1*iconSize + 90}>
              <View style={{height: 0.1*iconSize}} />
              <SmartBehaviourSummaryGraph rules={activeRules} activityMap={activityMap} sphereId={this.props.sphereId} />
            </SlideFadeInView>
            { stone.config.locked && <Text style={{color: colors.csOrange.hex, fontWeight:"bold", fontSize:15, textAlign:'center', padding: 20}}>{ lang("This_Crownstone_is_locked") }</Text> }
            <View style={{flex:1}} />
            {ruleComponents}
            <View style={{flex:2}} />

            <SlideFadeInView visible={this.state.editMode} height={80}>
              <Button
                backgroundColor={colors.blue.rgba(0.5)}
                label={ lang("Add_more___")}
                callback={() => { NavigationUtil.launchModal('DeviceSmartBehaviour_TypeSelector', this.props); }}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={this.state.editMode} height={80}>
              <BehaviourCopyFromButton sphereId={this.props.sphereId} stoneId={this.props.stoneId} rulesAvailable={ruleIds.length > 0}/>
            </SlideFadeInView>
            <SlideFadeInView visible={this.state.editMode} height={80}>
              <Button
                backgroundColor={ colors.blue.rgba(0.5) }
                label={ lang("Copy_to___") }
                callback={() => {
                  let requireDimming = StoneUtil.doRulesRequireDimming(this.props.sphereId, this.props.stoneId, ruleIds);

                  NavigationUtil.navigate('DeviceSmartBehaviour_CopyStoneSelection', {
                    sphereId: this.props.sphereId,
                    stoneId: this.props.stoneId,
                    copyType: "TO",
                    originId: this.props.stoneId,
                    rulesRequireDimming: requireDimming,
                    callback:(stoneIds) => {
                      this.copySelectedRulesToStones(stoneIds);
                      BehaviourCopySuccessPopup();
                    }});
                }}
                icon={'md-log-out'}
                iconSize={14}
                iconColor={colors.purple.blend(colors.blue, 0.5).rgba(0.75)}
              />
            </SlideFadeInView>

            <SlideFadeInView visible={this.state.editMode && state.development.show_sync_button_in_behaviour} height={80}>
              <BehaviourSyncButton sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
            </SlideFadeInView>

            <SlideFadeInView visible={!this.state.editMode} height={80} style={styles.centered}>
              <Text style={{...deviceStyles.explanationText, paddingHorizontal:15}}>{ lang("Ill_be_off_if_Im_not_supp",presenceRulePresent,roomBasedPresenceRulePresent) }</Text>
            </SlideFadeInView>

            <View style={{height:30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}


function DisabledBehaviourBanner(props) {
  return (
    <TouchableOpacity
      style={{height:65, width: screenWidth, backgroundColor: colors.blue.hex, justifyContent:'space-evenly', alignItems:'center', borderBottomWidth:2, borderColor: colors.white.hex}}
      onPress={() => {
        BluenetPromiseWrapper.broadcastBehaviourSettings(props.sphereId, true).catch(() => {});
        core.store.dispatch({
          type: "SET_SPHERE_SMART_HOME_STATE",
          sphereId: props.sphereId,
          data: { smartHomeEnabled: true }
        })
      }}
    >
      <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ lang("Behaviour_is_currently_di") }</Text>
      <Text style={{fontSize: 15, color: colors.white.hex}}>{ lang("Tap_here_to_re_enable_beh") }</Text>
    </TouchableOpacity>
  )
}


export const BehaviourCopySuccessPopup = function() {
  Alert.alert(
lang("_Success___Behaviour_has__header"),
lang("_Success___Behaviour_has__body"),
[{text:lang("_Success___Behaviour_has__left"), onPress:() => { NavigationUtil.back();}}], {onDismiss: () => { NavigationUtil.back();}})
}


function getTopBarProps(props, viewState) {
  const stone = DataUtil.getStone(props.sphereId,props.stoneId);
  if (!stone) {
    NAVBAR_PARAMS_CACHE = {
      title: lang("Stone_deleted_"),
      closeModal: true,
    }
    return NAVBAR_PARAMS_CACHE
  }
  if (Object.keys(stone.rules).length === 0 && viewState.editMode !== true) {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      closeModal: true,
    };
    return NAVBAR_PARAMS_CACHE;
  }


  if (viewState.editMode === true) {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      leftText: {id:'closeEdit', text:'Back'},
    };
  }
  else {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      edit: Permissions.inSphere(props.sphereId).canChangeBehaviours,
      closeModal: true,
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;