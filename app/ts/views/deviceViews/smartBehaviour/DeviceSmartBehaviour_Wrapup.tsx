
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Wrapup", key)(a,b,c,d,e);
}
import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  Text,
  View, ScrollView, Alert, TextStyle
} from "react-native";
import {
  availableModalHeight, background,
  colors,
  deviceStyles,
  screenWidth, styles, tabBarHeight
} from "../../styles";
import { core } from "../../../Core";
import { Background } from "../../components/Background";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import {
  LargeDeleteWeekdayElement,
  WeekDayListLarge
} from "../../components/WeekDayList";
import { xUtil } from "../../../util/StandAloneUtil";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { Icon } from "../../components/Icon";
import { BehaviourSubmitButton } from "./supportComponents/BehaviourSubmitButton";
import { BEHAVIOUR_TYPES } from "../../../database/reducers/stoneSubReducers/behaviours";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { AicoreUtil } from "./supportCode/AicoreUtil";
import { DAY_INDICES_MONDAY_START, DAY_LABEL_MAP, DAYS_LABEL_MAP } from "../../../Constants";
import { SlideSideFadeInView } from "../../components/animated/SlideFadeInView";
import { SettingsBackground } from "../../components/SettingsBackground";
import { SettingsScrollbar } from "../../components/SettingsScrollbar";

const behaviourStyle : TextStyle = {
  fontSize: 15,
  padding:10,
  fontWeight:'bold',
  fontStyle:'italic',
  paddingHorizontal: 20,
  textAlign:'center'
};

export class DeviceSmartBehaviour_Wrapup extends LiveComponent<{
  sphereId: string,
  stoneId: string,
  behaviour: string,
  twilightBehaviour: boolean,
  behaviourId?: string,
  selectedDay?: string,
  deleteBehaviour?: boolean,
  isModal?: boolean,
}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("When_to_do_this_"), closeModal: props.isModal});
  }

  behaviour : AicoreBehaviour | AicoreTwilight;
  behaviourHasChanged = true;
  existingBehaviour : AicoreBehaviour | AicoreTwilight = null;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;

    if (this.props.twilightBehaviour) {
      // @ts-ignore
      this.behaviour = new AicoreTwilight(this.props.behaviour);
    }
    else {
      // @ts-ignore
      this.behaviour = new AicoreBehaviour(this.props.behaviour);
    }

    if (this.props.behaviourId) {
      let behaviour = stone.behaviours[this.props.behaviourId];

      // we want to catch the case where the behaviour was not changed, even though the used pressed edit.
      if (this.props.twilightBehaviour) {
        // @ts-ignore
        this.existingBehaviour = new AicoreTwilight(behaviour.data);
      }
      else {
        // @ts-ignore
        this.existingBehaviour = new AicoreBehaviour(behaviour.data);
      }

      if (this.behaviour.isTheSameAs(this.existingBehaviour) === true) {
        this.behaviourHasChanged = false;
      }
    }

    let { activeDays, conflictDays } = this._getDayData();
    if (this.props.behaviourId) {
      let behaviour = stone.behaviours[this.props.behaviourId];
      if (behaviour) {
        if (this.props.deleteBehaviour && this.props.selectedDay) {
          activeDays = behaviour.activeDays;
        }
        else {
          activeDays = behaviour.activeDays;
        }
      }
    }

    this.state = { activeDays: activeDays, conflictDays: conflictDays, conflictResolving:false };
  }

  _handleSubmit() {
    let mergedId = null;
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;
    let behaviours = stone.behaviours;
    let behaviourIds = Object.keys(behaviours);

    let selectedDays = {...this.state.activeDays};

    let actions = [];

    // define two util functions that take care of sorting out days. We will use them later on.
    let updateBehaviourWithNewActiveDays = (activeDays, behaviour, behaviourId) => {
      // check if there are any days left for the original behaviour
      let activeDayCount = 0;
      for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
        if (activeDays[DAY_INDICES_MONDAY_START[i]]) {
          activeDayCount++;
        }
      }

      if (activeDayCount > 0) {
        actions.push({type:"UPDATE_STONE_BEHAVIOUR", sphereId: this.props.sphereId, stoneId: this.props.stoneId, behaviourId: behaviourId, data: {activeDays: activeDays, syncedToCrownstone: false}});
      }
      else {
        if (behaviour.idOnCrownstone !== null) {
          actions.push({
            type: "MARK_STONE_BEHAVIOUR_FOR_DELETION",
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            behaviourId: behaviourId
          });
        }
        else {
          actions.push({
            type: "REMOVE_STONE_BEHAVIOUR",
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            behaviourId: behaviourId
          });
        }
      }
    }

    let removeActiveDaysFromBehaviour = (behaviour, behaviourId) => {
      // disable the selected days for the previous behaviour

      let newActiveDaysForBehaviour = {...behaviour.activeDays};
      Object.keys(appliedDays).forEach((day) => {
        if (appliedDays[day]) {
          newActiveDaysForBehaviour[day] = false;
        }
      })

      updateBehaviourWithNewActiveDays(newActiveDaysForBehaviour, behaviour, behaviourId);
    }

    // FIRST WE HANDLE DELETE BEHAVIOUR COMMANDS:

    let appliedDays = selectedDays;
    if (this.props.deleteBehaviour) {
      removeActiveDaysFromBehaviour(behaviours[this.props.behaviourId], this.props.behaviourId)
      core.store.batchDispatch(actions);
      NavigationUtil.dismissModal();
      return;
    }


    // NOW WE HANDLE THE EDITED AND NEW ONES:

    // if we have an existing behaviour, we have to update it.
    if (this.props.behaviourId) {
      // if the existing behaviour has been changed, we make a new one and update the old one to not be active on the selected days.
      if (this.behaviourHasChanged) {
        // if the behaviour has been fully changed (for every active day)
        let behaviour = behaviours[this.props.behaviourId];
        if (xUtil.deepCompare(this.state.activeDays, behaviour.activeDays) === true) {
          // this means we change the behaviour for all active days
          actions.push({type:"UPDATE_STONE_BEHAVIOUR", sphereId: this.props.sphereId, stoneId: this.props.stoneId, behaviourId: this.props.behaviourId, data: {data: this.behaviour.stringify(), syncedToCrownstone: false}});
        }
        else {
          // search for behaviour that is the same as the behaviour to see if we can merge them.
          for (let i = 0; i < behaviourIds.length; i++) {
            if (behaviourIds[i] !== this.props.behaviourId) {
              if (this.behaviour.isTheSameAs(behaviours[behaviourIds[i]].data)) {
                mergedId = behaviourIds[i];
                let newActiveDaysForMergeBehaviour = {...behaviours[behaviourIds[i]].activeDays};
                Object.keys(appliedDays).forEach((day) => {
                  if (appliedDays[day]) {
                    newActiveDaysForMergeBehaviour[day] = true;
                  }
                })
                actions.push({type:"UPDATE_STONE_BEHAVIOUR", sphereId: this.props.sphereId, stoneId: this.props.stoneId, behaviourId: mergedId, data: {activeDays: newActiveDaysForMergeBehaviour, syncedToCrownstone: false}});
                break;
              }
            }
          }

          // we could not find a behaviour to merge with, we will make a new behaviour.
          if (!mergedId) {
            let newbehaviourId = xUtil.getUUID();
            actions.push({
              type: "ADD_STONE_BEHAVIOUR",
              sphereId: this.props.sphereId,
              stoneId:  this.props.stoneId,
              behaviourId: newbehaviourId,
              data: {
                type: this.props.twilightBehaviour ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour,
                data: this.behaviour.stringify(),
                activeDays: appliedDays,
                syncedToCrownstone: false
              }
            });
          }

          removeActiveDaysFromBehaviour(behaviours[this.props.behaviourId], this.props.behaviourId)
        }
      }
      else {
        // if the behaviour has not been changed, the active days have been changed.
        updateBehaviourWithNewActiveDays(appliedDays, behaviours[this.props.behaviourId], this.props.behaviourId);
      }
    }
    else {
      // search for behaviour that is the same as the behaviour to see if we can merge them.
      for (let i = 0; i < behaviourIds.length; i++) {
        if (behaviours[behaviourIds[i]].deleted === false && this.behaviour.isTheSameAs(behaviours[behaviourIds[i]].data)) {
          Alert.alert(
            lang("_Behaviour_already_exists_header"),
            lang("_Behaviour_already_exists_body"),
            [{text:lang("_Behaviour_already_exists_left"), onPress:() => { NavigationUtil.dismissModal();}}],
            {cancelable: false}
          );
          return;
        }
      }

      // this is a new behaviour!
      let newbehaviourId = xUtil.getUUID();
      actions.push({
        type: "ADD_STONE_BEHAVIOUR",
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        behaviourId: newbehaviourId,
        data: {
          type: this.props.twilightBehaviour ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour,
          data: this.behaviour.stringify(),
          activeDays: appliedDays,
        }
      });
    }

    // for all conflicting days, disable the conflicting behaviours unless they are the merged behaviours.
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];
      // if we are active that day and there is a conflict
      if (appliedDays[day] && this.state.conflictDays[day].conflict) {
        let conflictingBehaviours = this.state.conflictDays[day].behaviours;
        conflictingBehaviours.forEach((conflictBehaviourData) => {
          if (conflictBehaviourData.behaviourId !== mergedId) {
            removeActiveDaysFromBehaviour(behaviours[conflictBehaviourData.behaviourId], conflictBehaviourData.behaviourId)
          }
        })
      }
    }

    core.store.batchDispatch(actions);
    NavigationUtil.dismissModal();
  }

  getOptionContext() {
    if (!this.behaviour.hasNoEndCondition()) {
      // @ts-ignore
      if (this.behaviour.behaviour.options.type === "SPHERE_PRESENCE_AFTER") {
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

    if (this.props.deleteBehaviour !== true) {
      if (!atleastOneDay) {
        Alert.alert(
          lang("_Never___Please_pick_at_l_header"),
          lang("_Never___Please_pick_at_l_body"),
          [{ text: lang("_Never___Please_pick_at_l_left") }])
        return;
      }
    }
    else {
      // allow nevermind when not deleting anything.
      if (atleastOneDay !== true) {
        return NavigationUtil.dismissModal();
      }
    }


    this._handleSubmit();
  }


  _getDayData() {
    let activeDays = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true };
    let conflictDays = {
      Mon: {behaviours: [], conflict:false },
      Tue: {behaviours: [], conflict:false },
      Wed: {behaviours: [], conflict:false },
      Thu: {behaviours: [], conflict:false },
      Fri: {behaviours: [], conflict:false },
      Sat: {behaviours: [], conflict:false },
      Sun: {behaviours: [], conflict:false }
    };
    if (this.props.deleteBehaviour) {
      return {activeDays, conflictDays};
    }

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];
    let behaviourIds = Object.keys(stone.behaviours);


    // we're editing, by default just highlight the day we edit.
    if (this.props.behaviourId) {
      activeDays[this.props.selectedDay] = true;
    }
    else {
      activeDays = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true };
    }


    let newBehaviour = {type: this.props.twilightBehaviour ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour, data: this.behaviour}
    let newSummary = AicoreUtil.getBehaviourSummary(this.props.sphereId, newBehaviour);
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];
      for (let j = 0; j < behaviourIds.length; j++) {
        let behaviourId = behaviourIds[j];
        let behaviour = stone.behaviours[behaviourId];
        if (behaviourId !== this.props.behaviourId) {
          if (newBehaviour.type !== behaviour.type) { continue; }
          if (this.behaviour.isTheSameAs(stone.behaviours[behaviourId].data)) { continue; }

          let data = AicoreUtil.getOverlapData(newBehaviour, behaviour, day, this.props.sphereId);
          if (data.overlapMins === 0) { continue; }
          if (data.aPercentageOverlapped < 0.4 && data.bPercentageOverlapped < 0.4) { continue; } // no hassle

          let existingSummary = AicoreUtil.getBehaviourSummary(this.props.sphereId, behaviour);

          let isConflicting = false;
          isConflicting = isConflicting || newSummary.usingSingleRoomPresence && existingSummary.usingSingleRoomPresence;
          isConflicting = isConflicting || newSummary.usingMultiRoomPresence  && existingSummary.usingMultiRoomPresence;
          isConflicting = isConflicting || newSummary.usingSpherePresence     && existingSummary.usingSpherePresence;

          if (isConflicting) {
            // just not make this directly selected
            if (data.aPercentageOverlapped <= 0.3 && data.bPercentageOverlapped <= 0.3) {
              // fine.... ignore it.
              continue;
            }
            if ((data.aPercentageOverlapped <= 0.5 && data.bPercentageOverlapped <= 0.5) && (data.aPercentageOverlapped > 0.3 || data.bPercentageOverlapped > 0.3)) {
              activeDays[day] = false; continue;
            }

            // A is in B and B is significantly overlapped
            if (data.aPercentageOverlapped > 0.5 && data.bPercentageOverlapped > 0.5) {
              // replace
              conflictDays[day].conflict = true;
              conflictDays[day].behaviours.push({behaviourId: behaviourId, label: existingSummary.label});
              activeDays[day] = false; continue;
            }
          }
        }
      }
    }

    return {activeDays, conflictDays};
  }


  _getBehaviourComparison() {
    return (
      <View style={styles.centered}>
        <Text style={behaviourStyle}>{ lang("____",this.existingBehaviour.getSentence(this.props.sphereId)) }</Text>
        <Icon name={'ios-arrow-down'} size={10} color={colors.csBlueDark.hex} />
        <Icon name={'ios-arrow-down'} size={20} color={colors.csBlueDark.hex} />
        <Text style={behaviourStyle}>{ lang("____",this.behaviour.getSentence(this.props.sphereId)) }</Text>
      </View>
    )
  }

  _allActiveDaysAreSelected() {
    let result = true;

    if (this.props.behaviourId) {
      let state = core.store.getState();
      let sphere = state.spheres[this.props.sphereId];
      if (!sphere) return;
      let stone = sphere.stones[this.props.stoneId];
      if (!stone) return;

      let behaviour = stone.behaviours[this.props.behaviourId];
      if (behaviour) {
        DAY_INDICES_MONDAY_START.forEach((dayIndex) => {
          if (behaviour.activeDays[dayIndex] && this.state.activeDays[dayIndex] === false) {
            result = false;
          }
        })
      }
    }

    return result;
  }

  _hasMoreThenOneActiveDay() {
    if (this.props.behaviourId) {
      let state = core.store.getState();
      let sphere = state.spheres[this.props.sphereId];
      if (!sphere) return;
      let stone = sphere.stones[this.props.stoneId];
      if (!stone) return;

      let behaviour = stone.behaviours[this.props.behaviourId];

      let count = 0;
      if (behaviour) {
        DAY_INDICES_MONDAY_START.forEach((dayIndex) => {
          if (behaviour.activeDays[dayIndex]) {
            count += 1;
          }
        })
        if (count > 1) {
          return true;
        }
      }
    }

    return false;
  }

  render() {
    let disabledDays = {};

    let header = lang("Every_day_");
    let headerNumberOfLines = 1;
    let body = lang("Tap_the_days_below_to_let");

    let buttonColor = colors.green.hex;
    let buttonLabel = lang("Thats_it_");

    let changeText = null;

    let amountOfUnresolvedConflictingDays = 0;
    let amountOfConflictingDays = 0;
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];
      if (this.state.conflictDays[day].conflict) {
        amountOfConflictingDays += 1;
        if (!this.state.conflictDays[day].resolved) {
          amountOfUnresolvedConflictingDays += 1;
        }
      }
    }
    if (amountOfConflictingDays > 0) {
      header = lang("When_do_I_do_this_")
    }

    // if we have a behaviour ID, this is an edit operation, not a new behaviour
    // there will be a separate header, body text and selection.
    // Conflict resolution is done based on other behaviours than the existing behaviour.
    if (this.props.behaviourId && this.behaviourHasChanged) {
      headerNumberOfLines = 2;
      header = lang("When_shall_I_use_the_modi");
      body = lang("You_can_quickly_apply_you");
      changeText = this._allActiveDaysAreSelected() && lang("Only_change__", DAYS_LABEL_MAP(this.props.selectedDay))  || lang("Change_everywhere_");
    }
    else if (this.props.behaviourId && this.props.deleteBehaviour) {
      headerNumberOfLines = 2;
      header = lang("From_which_days_shall_I_r");
      body = lang("Select_the_days_you_wish_")

      buttonColor = colors.csOrange.hex;
      buttonLabel = lang("Remove_behaviour_")

      changeText = this._allActiveDaysAreSelected() && lang("Remove_only__", DAYS_LABEL_MAP(this.props.selectedDay)) || lang("Remove_everywhere_");

      let state = core.store.getState();
      let sphere = state.spheres[this.props.sphereId];
      let stone = sphere.stones[this.props.stoneId];
      let behaviour = stone.behaviours[this.props.behaviourId];
      disabledDays = {};
      let activeDayCount = 0;
      let disabledCount = 0;
      for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
        let day = DAY_INDICES_MONDAY_START[i];
        if (behaviour.activeDays[day] === false) {
          disabledDays[day] = true;
          disabledCount++;
        }
        if (this.state.activeDays[day] === true) {
          activeDayCount++;
        }
      }

      if (activeDayCount === 7-disabledCount) {
        buttonLabel = lang("Remove_everywhere_")
      }

      if (activeDayCount === 0) {
        buttonColor = colors.green.hex;
        buttonLabel = lang("Never_mind___")
      }
    }

    // it does not make sense to show the quick toggle button from single day to all if there is only one day this is active.
    // by setting changeText to null, the button is not shown.
    if (this._hasMoreThenOneActiveDay() === false) {
      changeText = null;
    }


    return (
      <SettingsBackground>
        <SettingsScrollbar style={{width: screenWidth}} contentContainerStyle={{flexGrow:1}}>
          <View style={{ flexGrow: 1, alignItems:'center', paddingTop:30, paddingBottom: tabBarHeight }}>
            <Text style={{...deviceStyles.header, width: 0.7*screenWidth}} numberOfLines={headerNumberOfLines} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text>
            <View style={{height: 0.02*availableModalHeight}} />

            { this.props.behaviourId && this.props.deleteBehaviour && <Text style={behaviourStyle}>{ lang("____",this.existingBehaviour.getSentence(this.props.sphereId)) }</Text> }
            { this.props.behaviourId && this.behaviourHasChanged && this._getBehaviourComparison() }

            <Text style={deviceStyles.specification}>{ body }</Text>

            <View style={{flex:1}} />

            <View style={{width:screenWidth, flexDirection:'row'}}>
              <SlideSideFadeInView visible={this.state.conflictResolving === false} width={screenWidth}>
                <WeekDayListLarge
                  data={this.state.activeDays}
                  tight={true}
                  customElement={this.props.deleteBehaviour ? LargeDeleteWeekdayElement : null}
                  disabledDays={disabledDays}
                  onChange={(fullData, day) => {
                    if (fullData[day] === true) {
                      if (this.state.conflictDays[day].conflict) {
                        let behaviourList = this.state.conflictDays[day].behaviours[0].label;
                        for (let j = 1; j < this.state.conflictDays[day].behaviours.length; j++) {
                          behaviourList += "\n" + this.state.conflictDays[day].behaviours[j].label;
                        }
                        Alert.alert(lang("This_will_replace_the_fol", DAY_LABEL_MAP(day)), behaviourList,
                          [{ text: lang("Cancel") }, {text: lang("OK"), onPress: () => { this.setState({ activeDays: fullData }); }}]
                        );
                        return;
                      }
                    }
                    this.setState({ activeDays: fullData });
                  }}
                />
              </SlideSideFadeInView>
            </View>

            {/* This button design was not clear, it will be removed for now. */}
            {/*{ changeText && <View style={{flex:1}} />}*/}
            {/*{ changeText && <TouchableOpacity*/}
            {/*  onPress={() => {*/}
            {/*    if (this._allActiveDaysAreSelected()) {*/}
            {/*      let activeDays = { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false };*/}
            {/*      activeDays[this.props.selectedDay] = true;*/}
            {/*      this.setState({activeDays: activeDays})*/}
            {/*    }*/}
            {/*    else {*/}
            {/*      let behaviour = DataUtil.getBehaviour(this.props.sphereId, this.props.stoneId, this.props.behaviourId);*/}
            {/*      if (behaviour) {*/}
            {/*        this.setState({activeDays: behaviour.activeDays})*/}
            {/*      }*/}
            {/*    }*/}
            {/*  }}*/}
            {/*  style={{height: 36, borderColor: colors.white.rgba(0.6), borderWidth:1, backgroundColor: colors.white.rgba(0.3), borderRadius: 18, paddingHorizontal: 25, ...styles.centered}}>*/}
            {/*  <Text style={{fontWeight:'bold', fontSize:14, color: colors.csBlueDark.hex}}>{changeText}</Text>*/}
            {/*</TouchableOpacity>}*/}

            <View style={{flex:2}} />

            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <View>
              <BehaviourSubmitButton
                width={0.8*screenWidth}
                color={ buttonColor }
                label={ buttonLabel }
                callback={() => { this.submit() }}
              />
              </View>
              <View style={{flex:1}} />
            </View>
            <View style={{height: 30}} />
          </View>
        </SettingsScrollbar>
      </SettingsBackground>
    )
  }
}
