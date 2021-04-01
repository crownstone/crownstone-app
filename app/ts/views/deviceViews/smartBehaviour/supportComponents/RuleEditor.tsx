
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RuleEditor", key)(a,b,c,d,e);
}
import { LiveComponent }          from "../../../LiveComponent";
import * as React from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle
} from "react-native";
import {
  availableModalHeight,
  availableScreenHeight,
  colors,
  deviceStyles,
  screenWidth,
  styles
} from "../../../styles";
import { SELECTABLE_TYPE } from "../../../../Enums";
import { RoomList } from "../../../components/RoomList";
import { core } from "../../../../core";
import { BehaviourOptionList } from "./BehaviourOptionList";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreUtil } from "../supportCode/AicoreUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";
import { BehaviourSubmitButton } from "./BehaviourSubmitButton";
import { DataUtil } from "../../../../util/DataUtil";
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from "../../../../ExternalConfig";
import { Button } from "../../../components/Button";


export class RuleEditor extends LiveComponent<
  {data: behaviour | twilight, sphereId: string, stoneId: string, ruleId?: string, selectedDay?: string, twilightRule: boolean},
  {detail: any, containerHeight: Animated.Value,  detailHeight: Animated.Value,  detailOpacity: Animated.Value,  mainBottomHeight: Animated.Value, mainBottomOpacity: Animated.Value, selectedDetailField: string, showCustomTimeData:boolean}
  > {
  references = [];
  amountOfLines = 0;
  rule : AicoreBehaviour | AicoreTwilight;
  selectedChunk : selectableAicoreBehaviourChunk;

  exampleBehaviours : any;
  baseHeight = Math.max(4*70, (availableModalHeight-60)*0.5);

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];

    this.state = {
      detail:            null,
      containerHeight:   new Animated.Value(this.baseHeight),
      detailHeight:      new Animated.Value(this.baseHeight),
      detailOpacity:     new Animated.Value(0),
      mainBottomHeight:  new Animated.Value(this.baseHeight),
      mainBottomOpacity: new Animated.Value(1),
      selectedDetailField: null,
      showCustomTimeData: this.props.ruleId ? true : false,
    };


    if (this.props.twilightRule) {
      // @ts-ignore
      this.rule =   new AicoreTwilight(this.props.data);
      let customIntensity = 40;

      if (this.rule.rule.action.data !== 60 && this.rule.rule.action.data !== 80) {
        customIntensity = this.rule.rule.action.data;
      }


      this.exampleBehaviours = {
        action: {
          dimming8: new AicoreTwilight().setActionState(80),
          dimming6: new AicoreTwilight().setActionState(60),
          dimming4: new AicoreTwilight().setActionState(customIntensity),
        },
        time: {
          dark:     new AicoreTwilight().setTimeWhenDark(),
          sunUp:    new AicoreTwilight().setTimeWhenSunUp(),
          allDay:   new AicoreTwilight().setTimeAllday(),
          specific: this.props.ruleId &&  this.rule.isUsingClockTime() ? this.rule : new AicoreTwilight().setTimeFrom(9,30).setTimeTo(15,0),
          custom:   this.props.ruleId && !this.rule.isUsingClockTime() ? this.rule : new AicoreTwilight().setTimeFromSunset(-30).setTimeTo(23,0),
        },
      }
    }
    else {
      // @ts-ignore
      this.rule =   new AicoreBehaviour(this.props.data);
      this.exampleBehaviours = {
        action: {
          on:       new AicoreBehaviour(),
          dimming:  new AicoreBehaviour().setActionState(this.rule.rule.action.data < 100 ? this.rule.rule.action.data : 50),
        },
        presence: {
          somebody: new AicoreBehaviour().setPresenceSomebody(),
          nobody:   new AicoreBehaviour().setPresenceNobody(),
          ignore:   new AicoreBehaviour().ignorePresence(),
        },
        location: {
          sphere:   new AicoreBehaviour().setPresenceSomebodyInSphere(),
          inRoom:   new AicoreBehaviour().setPresenceSomebodyInLocations([DataUtil.locationIdToUid(this.props.sphereId, stone.config.locationId)]),
          custom:   new AicoreBehaviour().setPresenceSomebodyInLocations([]),
        },
        time: {
          dark:     new AicoreBehaviour().setTimeWhenDark(),
          sunUp:    new AicoreBehaviour().setTimeWhenSunUp(),
          allDay:   new AicoreBehaviour().setTimeAllday(),
          specific: this.props.ruleId &&  this.rule.isUsingClockTime() ? this.rule : new AicoreBehaviour().setTimeFrom(9,30).setTimeTo(15,0),
          custom:   this.props.ruleId && !this.rule.isUsingClockTime() ? this.rule : new AicoreBehaviour().setTimeFromSunset(-30).setTimeTo(23,0),
        },
        option: {
          inSphere: new AicoreBehaviour().setEndConditionWhilePeopleInSphere(),
          inRoom:   new AicoreBehaviour().setEndConditionWhilePeopleInLocation(DataUtil.locationIdToUid(this.props.sphereId, stone.config.locationId)),
          noOption: new AicoreBehaviour().setNoEndCondition(),
        }
      }
    }
  }



  getRuleSentenceElements() {
    this.amountOfLines = 0;

    let normal      : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.csBlueDark.hex, fontSize:20, fontWeight:'bold', height:30  };
    let selectable  : TextStyle = {...normal, textDecorationLine:'underline' };
    let segmentStyle : ViewStyle = {...(styles.centered as ViewStyle), flexDirection:'row', width: screenWidth};

    let ruleChunks = this.rule.getSelectableChunkData(this.props.sphereId);

    let segments = [];
    let result = [];
    let paddingForRules = 7;
    let letterLengthOnLine = 0;
    let wordsOnLine = [];

    let putSegmentsIntoLine = () => {
      if (segments.length > 0) {
        result.push(<View key={"descriptionLine_" + this.amountOfLines} style={segmentStyle}>{segments}</View>);
        this.amountOfLines++;
        letterLengthOnLine = 0;
        segments = [];
        wordsOnLine = [];
      }
    };

    ruleChunks.forEach((chunk,i) => {
      // refresh the selected chunk for the UI
      if (chunk.type === this.state.detail) { this.selectedChunk = chunk; }

      // hidden chunks are imply that they are not part of the sentence. We do however need their data for the selection.
      if (chunk.hidden) {
        return;
      }

      let lastChunk = i == ruleChunks.length -1;
      let words = chunk.label.split(" ");
      wordsOnLine = [];

      let putWordsIntoSegments = () => {
        if (wordsOnLine.length > 0) {
          if (chunk.clickable) {
            segments.push(
              <TouchableOpacity key={"selectable_element_" + i} onPress={() => { this.toggleDetails(chunk.type); }}>
                <Text style={[selectable, {color: this.state.detail === chunk.type ? colors.blue.hex : colors.csBlueDark.hex}]}>{wordsOnLine.join(" ")}</Text>
              </TouchableOpacity>
            );
          }
          else {
            segments.push(<View key={"label_element_" + i}><Text style={normal}>{wordsOnLine.join(" ")}</Text></View>);
          }
        }
      };


      // this piece of code guesses the length of the line so we can do manual wrapping.
      // Normal RN wrapping does not support partially touchable elements.
      for (let i = 0; i < words.length; i++) {
        let lastWordLength = 0;
        if (words[i]) {
          lastWordLength = AicoreUtil.getWordLength(words[i] + (lastChunk ? "" : ' '));
          letterLengthOnLine += lastWordLength;
        }
        if (letterLengthOnLine > screenWidth - paddingForRules*2 && !lastChunk) {
          putWordsIntoSegments();
          putSegmentsIntoLine();
          letterLengthOnLine += lastWordLength;
        }
        wordsOnLine.push(words[i]);
      }

      putWordsIntoSegments();
    });

    putSegmentsIntoLine();

    return result;
  }

  toggleDetails(type) {
    let selectedBehaviourType = null;

    if (type !== null) {
      selectedBehaviourType = type;
    }

    if (this.state.detail === selectedBehaviourType) {
      // selecting the same behaviour twice --> do nothing.
      return;
    }

    let baseHeight = this.baseHeight;
    let numberOfSlots = this._getNumberOfDetailSlots(selectedBehaviourType);
    let expectedHeight = 60 + numberOfSlots*50 +30+60+20; // 60 for introduction, 50 for a slot, 30 for padding, 60 for OK button, 20 for additional padding.
    let behaviourHeight = Math.max(expectedHeight, (availableModalHeight-60)*0.5); - this.amountOfLines*30;

    if (this.state.detail === null) {
      // selecting a behaviour type while none was selected before.
      let animation = [];
      this.setState({detail: selectedBehaviourType, selectedDetailField: null});
      this.state.detailHeight.setValue(behaviourHeight);
      animation.push(Animated.timing(this.state.detailOpacity,     {toValue: 1, delay: 100, useNativeDriver: false, duration: 100}));
      animation.push(Animated.timing(this.state.mainBottomOpacity, {toValue: 0, delay: 0, useNativeDriver: false, duration: 100}));
      animation.push(Animated.timing(this.state.containerHeight  , {toValue: behaviourHeight, delay: 0, useNativeDriver: false, duration: 200}));
      animation.push(Animated.timing(this.state.mainBottomHeight  ,{toValue: behaviourHeight, delay: 0, useNativeDriver: false, duration: 200}));
      // animation.push(Animated.timing(this.state.mainBottomHeight,{toValue: originalHeight, delay: 0, useNativeDriver: false, duration: 200}));
      Animated.parallel(animation).start(() => { this.state.mainBottomHeight.setValue(0) })
    }
    else if (selectedBehaviourType === null) {
      // deselecting, revert to initial state
      let animation = [];
      if (this._shouldShowSuggestions().showAnySuggestions === true) {
        baseHeight = this.baseHeight + this._shouldShowSuggestions().amountOfSuggestions * 25;
      }
      this.state.mainBottomHeight.setValue(baseHeight);
      animation.push(Animated.timing(this.state.detailOpacity,    {toValue:0, delay:0, useNativeDriver: false, duration: 100}));
      animation.push(Animated.timing(this.state.mainBottomOpacity,{toValue:1, delay:100, useNativeDriver: false, duration: 100}));
      animation.push(Animated.timing(this.state.containerHeight,  {toValue: baseHeight, delay:0, useNativeDriver: false, duration: 200}));
      animation.push(Animated.timing(this.state.detailHeight,     {toValue: baseHeight, delay:0, useNativeDriver: false, duration: 200}));
      Animated.parallel(animation).start(() => { this.setState({detail: selectedBehaviourType, selectedDetailField: null}); })
    }
    else {
      // changing between selected behaviour types, fade out, and fadein
      let animation = [];
      animation.push(Animated.timing(this.state.detailHeight,     {toValue: behaviourHeight, delay:0, useNativeDriver: false, duration: 200}));
      animation.push(Animated.timing(this.state.containerHeight,  {toValue: behaviourHeight, delay:0, useNativeDriver: false, duration: 200}));
      animation.push(Animated.timing(this.state.detailOpacity,    {toValue:0, delay:0, useNativeDriver: false, duration: 150}));
      Animated.parallel(animation).start(() => {
        this.setState({detail: selectedBehaviourType, selectedDetailField: null}, () => {
          let animation = [];
          animation.push(Animated.timing(this.state.detailOpacity,{toValue:1, delay:0, useNativeDriver: false, duration: 150}));
          Animated.parallel(animation).start()
        })
      })
    }
  }


  _shouldShowSuggestions() {
    let shouldShowTimeConflict = false;
    let showPresenceSuggestion = this.props.twilightRule === false && this.rule.isUsingPresence() === false;

    let showTimeSuggestion = this.rule.isActiveAllDay() === true;
    let showEndConditionSuggestion = this.props.twilightRule === false &&
      (
        (this.rule.isUsingClockEndTime() && this.rule.getHour() !== null && this.rule.getHour() >= 20)
        || this.rule.isUsingSunsetAsEndTime()
      ) &&
      this.rule.hasNoEndCondition();

    return {
      showPresenceSuggestion:     showPresenceSuggestion     && !shouldShowTimeConflict,
      showTimeSuggestion:         showTimeSuggestion         && !shouldShowTimeConflict,
      showEndConditionSuggestion: showEndConditionSuggestion && !shouldShowTimeConflict,
      shouldShowTimeConflict:     shouldShowTimeConflict,
      showAnySuggestions:         showPresenceSuggestion || showTimeSuggestion || showEndConditionSuggestion,
      amountOfSuggestions:        (showPresenceSuggestion ? 1 : 0)  + (showTimeSuggestion ? 1 : 0) + (showEndConditionSuggestion ? 1 : 0)
    };
  }

  _getSuggestions() {
    let {showPresenceSuggestion, showTimeSuggestion, showEndConditionSuggestion, shouldShowTimeConflict } = this._shouldShowSuggestions();
    let suggestionArray = [];
    let paddingIndex = 0;
    if (shouldShowTimeConflict) {
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(
        <Button
          backgroundColor={colors.blue.rgba(0.6)}
          iconColor={colors.red.hex}
          icon={'md-remove-circle'}
          key={"timeConflictSuggestion"}
          label={ lang("There_aleady_is_an_active", this.props.twilightRule,this.rule.getTimeString()) }
          callback={() => { this.toggleDetails(SELECTABLE_TYPE.TIME); }}
      />);
    }
    if (showPresenceSuggestion) {
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<Button key={"presenceSuggestion"}
        label={ lang("Would_you_like_me_to_react")}
        callback={() => { this.toggleDetails(SELECTABLE_TYPE.PRESENCE); }}
      />);
    }
    if (showTimeSuggestion) {
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<Button key={"timeSuggestion"}
        label={ lang("Shall_I_do_this_at_a_certa")}
        callback={() => { this.toggleDetails(SELECTABLE_TYPE.TIME); }}
      />);
    }
    if (showEndConditionSuggestion) {
      let timeStr = this.rule.isUsingSunsetAsEndTime() ? AicoreUtil.getSunsetTimeString(this.props.sphereId) : AicoreUtil.getClockTimeStr(this.rule.getHour(), this.rule.getMinutes());
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<Button
        key={"optionSuggestion"}
        label={lang("Is_it_OK_if_I_turn_off_at", timeStr)}
        callback={() => { this.toggleDetails(SELECTABLE_TYPE.OPTION); }}
      />);
    }
    suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex} />);

    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        { suggestionArray }
      </View>
    )
  }

  _showDimAmountPopup(exampleBehaviour, selectionDescription : string = null) {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];

    core.eventBus.emit("showDimLevelOverlay",{
      initialValue: this.rule.willDim() ? this.rule.getDimPercentage() : exampleBehaviour.getDimPercentage(),
      callback: (value) => {
        exampleBehaviour.setDimPercentage(value);
        this.rule.setDimPercentage(value);
        this.setState({selectedDetailField: selectionDescription})
      }
    })
  }

  _showLocationSelectionPopup() {
    core.eventBus.emit('showListOverlay', {
      title: lang("Select_Rooms"),
      getItems: () => {
        const state = core.store.getState();
        const sphere = state.spheres[this.props.sphereId];
        let items = [];
        Object.keys(sphere.locations).forEach((locationId) => {
          let location = sphere.locations[locationId];
          items.push( {id: location.config.uid, component:<RoomList
              icon={location.config.icon}
              name={location.config.name}
              hideSubtitle={true}
              showNavigationIcon={false}
              small={true}
            />})
        });

        return items;
      },
      callback: (selection) => {
        if (selection.length > 0) {
          this.exampleBehaviours.location.custom.setPresenceInLocations(selection);
          this.rule.setPresenceInLocations(selection);
        }
        this.setState({selectedDetailField: SELECTABLE_TYPE.LOCATION + "3"})
      },
      themeColor: colors.green.rgba(0.8),
      allowMultipleSelections: true,
      selection: this.rule.getLocationUids(),
      image: require("../../../../../assets/images/overlayCircles/roomsCircle.png")
    })
  }


  /**
   * The example origin field is meant to allow the system to update the custom fields based on the user selection.
   * @param exampleOriginField
   * @param useData
   * @private
   */
  _showTimeSelectionPopup(exampleOriginField, onSelect, useData = true) {
    core.eventBus.emit('showAicoreTimeCustomizationOverlay', {
      callback: (newTime : aicoreTime) => {
        this.exampleBehaviours.time[exampleOriginField].setTime(newTime);
        this.rule.setTime(newTime);

        onSelect();
      },
      time: useData ? this.exampleBehaviours.time[exampleOriginField].getTime() : null,
      image: require("../../../../../assets/images/overlayCircles/time.png")
    })
  }

  _evaluateSelection( selectedDescription ) {
    // we check the selection by state because the 3rd option can be valid together with
    // some of the others. This is sloppy for the UI.
    if (this.state.selectedDetailField === selectedDescription) {
      return true;
    }
    else if (this.state.selectedDetailField) {
      return false;
    }
    return false;
  }

  _evaluateActionSelection( selectedDescription, ruleToMatch ) {
    return this._evaluateSelection(selectedDescription) || this.rule.doesActionMatch(ruleToMatch);
  }
  _evaluateTimeSelection( selectedDescription, ruleToMatch ) {
    return this._evaluateSelection(selectedDescription) || this.rule.doesTimeMatch(ruleToMatch);
  }
  _evaluatePresenceLocationSelection( selectedDescription, ruleToMatch ) {
    return this._evaluateSelection(selectedDescription) || this.rule.doesPresenceLocationMatch(ruleToMatch);
  }
  _evaluateOptionSelection( selectedDescription, ruleToMatch ) {
    return this._evaluateSelection(selectedDescription) || this.rule.doesEndConditionMatch(ruleToMatch);
  }


  _getNumberOfDetailSlots(selectedBehaviourType) {
    let details = null;
    if (this.props.twilightRule) {
      switch (selectedBehaviourType) {
        case SELECTABLE_TYPE.ACTION:
          return 3 + 1; // 1 for explanation
        case SELECTABLE_TYPE.TIME:
          return 5;
      }
    }
    else {
      switch (selectedBehaviourType) {
        case SELECTABLE_TYPE.ACTION:
          return 2 + 1; // 1 for explanation
        case SELECTABLE_TYPE.PRESENCE:
          return 3;
        case SELECTABLE_TYPE.LOCATION:
          return 3;
        case SELECTABLE_TYPE.TIME:
          return 5;
        case SELECTABLE_TYPE.OPTION:
          return 3;
      }
    }
    return details
  }

  _getDetails() {
    let details = null;
    if (this.props.twilightRule) {
      switch (this.state.detail) {
        case SELECTABLE_TYPE.ACTION:
          details = (
            <BehaviourOptionList
              header={ lang("What_should_I_be_")}
              explanation={ lang("My_behaviour_defines_when")}
              closeCallback={() => { this.toggleDetails(null); }}
              closeLabel={ lang("Sounds_about_right_")}
              selectedDetailField={this.state.selectedDetailField}
              elements={[
                {
                  label: lang("Dimmed____", 80),
                  isSelected: () => {
                    return this._evaluateActionSelection(SELECTABLE_TYPE.ACTION + "1", this.exampleBehaviours.action.dimming8);
                  },
                  onSelect: () => {
                    this.rule.setDimPercentage(80);
                    this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "1"})
                  }
                },
                {
                  label: lang("Dimmed____", 60),
                  isSelected: () => {
                    return this._evaluateActionSelection(SELECTABLE_TYPE.ACTION + "4", this.exampleBehaviours.action.dimming6);
                  },
                  onSelect: () => {
                    this.rule.setDimPercentage(60);
                    this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "2"})
                  }
                },
                {
                  label: lang("Dimmed____",Math.round(this.exampleBehaviours.action.dimming4.getDimPercentage())),
                  subLabel: "(tap to change)",
                  isSelected: () => {
                    return this._evaluateActionSelection(SELECTABLE_TYPE.ACTION + "3", this.exampleBehaviours.action.dimming4);
                  },
                  onSelect: () => { this._showDimAmountPopup(this.exampleBehaviours.action.dimming4, SELECTABLE_TYPE.ACTION + "3"); }
                },
              ]}
            />
          );
          break;
        case SELECTABLE_TYPE.TIME:
          details = (
            <BehaviourOptionList
              header={ lang("When_should_I_do_this_")}
              closeCallback={() => { this.toggleDetails(null); }}
              closeLabel={ lang("Will_do_")}
              selectedDetailField={this.state.selectedDetailField}
              elements={[
                {
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.dark.rule)) + ".",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "1", this.exampleBehaviours.time.dark);
                  },
                  onSelect: () => {
                    this.rule.setTimeWhenDark();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "1"})
                  }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.sunUp.rule)) + ".",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "2", this.exampleBehaviours.time.sunUp);
                  },
                  onSelect: () => {
                    this.rule.setTimeWhenSunUp();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "2"})
                  }
                },
                {
                  label: lang("All_day"),
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "3", this.exampleBehaviours.time.allDay);
                  },
                  onSelect: () => {
                    this.rule.setTimeAllday();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "3"})
                  }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.specific.rule)) + ".",
                  subLabel: "(tap to customize)",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "4", this.exampleBehaviours.time.specific);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('specific',
                      () => {
                        this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "4"})
                      })
                  }
                },
                {
                  label: lang("Other___"),
                  subLabel: "(tap to create)",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "5", this.exampleBehaviours.time.custom);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('custom', () => {
                      this.setState({showCustomTimeData: true, selectedDetailField: SELECTABLE_TYPE.TIME + "5"})
                    }, this.state.showCustomTimeData)
                  }
                },
              ]}
            />
          );
          break;
      }
    }
    else {
      switch (this.state.detail) {
        case SELECTABLE_TYPE.ACTION:
          details = (
            <BehaviourOptionList
              header={ lang("What_should_I_be_")}
              explanation={ lang("My_behaviour_defines_when")}
              closeCallback={() => { this.toggleDetails(null); }}
              closeLabel={ lang("Sounds_about_right_")}
              selectedDetailField={this.state.selectedDetailField}
              elements={[
                {
                  label: lang("On"),
                  isSelected: () => { return this.rule.doesActionMatch(this.exampleBehaviours.action.on) },
                  onSelect: () => {this.rule.setActionState(100); this.forceUpdate(); }
                },
                {
                  label: lang("Dimmed____", Math.round(this.rule.willDim() ? this.rule.getDimPercentage() : 50)),
                  subLabel: lang("_tap_to_change_"),
                  isSelected: () => { return this.rule.doesActionMatch(this.exampleBehaviours.action.dimming)},
                  onSelect: () => { this._showDimAmountPopup(this.exampleBehaviours.action.dimming); }
                },
              ]}
            />
          );
          break;
        case SELECTABLE_TYPE.PRESENCE:
          details = (
            <BehaviourOptionList
              header={ lang("Who_shall_I_look_for_")}
              closeCallback={() => { this.toggleDetails(null); }}
              closeLabel={lang("Thats_it_")}
              selectedDetailField={this.state.selectedDetailField}
              elements={[
                {
                  label: xUtil.capitalize(AicoreUtil.extractPresenceStrings(this.exampleBehaviours.presence.somebody.rule).presenceStr),
                  isSelected: () => { return this.rule.doesPresenceTypeMatch(this.exampleBehaviours.presence.somebody); },
                  onSelect: () => { this.rule.setPresenceSomebody(); this.forceUpdate(); }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractPresenceStrings(this.exampleBehaviours.presence.nobody.rule).presenceStr),
                  isSelected: () => { return this.rule.doesPresenceTypeMatch(this.exampleBehaviours.presence.nobody); },
                  onSelect: () => { this.rule.setPresenceNobody(); this.forceUpdate(); }
                },
                {
                  label: lang("Ignore_presence"),
                  isSelected: () => { return this.rule.doesPresenceTypeMatch(this.exampleBehaviours.presence.ignore); },
                  onSelect: () => { this.rule.setPresenceIgnore(); this.forceUpdate(); }
                },
              ]}
            />
          );
          break;
        case SELECTABLE_TYPE.LOCATION:
          details = (
            <BehaviourOptionList
              header={ lang("Where_should_I_look_")}
              closeCallback={() => { this.toggleDetails(null); }}
              closeLabel={ lang("Got_it_")}
              selectedDetailField={this.state.selectedDetailField}
              elements={[
                {
                  label: lang("Anywhere_in_the_house_"),
                  isSelected: () => {
                    return this._evaluatePresenceLocationSelection(SELECTABLE_TYPE.LOCATION + "1", this.exampleBehaviours.location.sphere);
                  },
                  onSelect: () => { this.rule.setPresenceInSphere(); this.setState({selectedDetailField: SELECTABLE_TYPE.LOCATION + "1"}) }
                },
                {
                  label: lang("In_the_room_"),
                  isSelected: () => {
                    return this._evaluatePresenceLocationSelection(SELECTABLE_TYPE.LOCATION + "2", this.exampleBehaviours.location.inRoom);
                  },
                  onSelect: () => {
                    if (AicoreUtil.canBehaviourUseIndoorLocalization(
                      this.props.sphereId,
                      lang("You_can_use_in_the_house_w", AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION)) === false) {
                      return false;
                    }

                    let state = core.store.getState();
                    let sphere = state.spheres[this.props.sphereId];
                    let stone = sphere.stones[this.props.stoneId];
                    this.rule.setPresenceInLocations([DataUtil.locationIdToUid(this.props.sphereId, stone.config.locationId)]);
                    this.setState({selectedDetailField: SELECTABLE_TYPE.LOCATION + "2"})
                  }
                },
                {
                  label: lang("Select_room_s____"),
                  subLabel: lang("_tap_to_select_"),
                  isSelected: () => {
                    return this._evaluatePresenceLocationSelection(SELECTABLE_TYPE.LOCATION + "3", this.exampleBehaviours.location.custom);
                  },
                  onSelect: () => {
                    if (AicoreUtil.canBehaviourUseIndoorLocalization(
                      this.props.sphereId,
                      lang("You_can_use_in_the_house_", AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION)) === false) {
                      return false;
                    }

                    this._showLocationSelectionPopup();
                  },
                },
              ]}
            />
          );
          break;
        case SELECTABLE_TYPE.TIME:
          details = (
            <BehaviourOptionList
              header={ lang("When_should_I_do_this_")}
              closeCallback={() => { this.toggleDetails(null); }}
              closeLabel={ lang("Will_do_")}
              selectedDetailField={this.state.selectedDetailField}
              elements={[
                {
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.dark.rule)) + ".",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "1", this.exampleBehaviours.time.dark);
                  },
                  onSelect: () => {
                    this.rule.setTimeWhenDark().setNoEndCondition();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "1"})
                  }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.sunUp.rule)) + ".",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "2", this.exampleBehaviours.time.sunUp);
                  },
                  onSelect: () => {
                    this.rule.setTimeWhenSunUp();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "2"})
                  }
                },
                {
                  label: lang("All_day"),
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "3", this.exampleBehaviours.time.allDay);
                  },
                  onSelect: () => {
                    this.rule.setTimeAllday().setNoEndCondition();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "3"})
                  }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.specific.rule)) + ".",
                  subLabel: lang("_tap_to_customize_"),
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "4", this.exampleBehaviours.time.specific);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('specific', () => {
                      this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "4"})
                    })
                  }
                },
                {
                  label: lang("Other___"),
                  subLabel: lang("_tap_to_create_"),
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "5", this.exampleBehaviours.time.custom);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('custom', () => {
                      this.setState({showCustomTimeData: true, selectedDetailField: SELECTABLE_TYPE.TIME + "5"})
                    }, this.state.showCustomTimeData)
                  }
                },
              ]}
            />
          );
          break;
        case SELECTABLE_TYPE.OPTION:
          details = (
            <BehaviourOptionList
              header={ lang("Can_I_turn_off_afterwards_")}
              closeCallback={() => { this.toggleDetails(null); }}
              closeLabel={ lang("Will_do_")}
              selectedDetailField={this.state.selectedDetailField}
              elements={[
                {
                  label: xUtil.capitalize(AicoreUtil.extractEndConditionStrings(this.exampleBehaviours.option.inRoom.rule).endConditionStr) + ".",
                  isSelected: () => {
                    return this._evaluateOptionSelection(SELECTABLE_TYPE.OPTION + "1", this.exampleBehaviours.option.inRoom);
                  },
                  onSelect: () => {
                    this.rule.setEndConditionWhilePeopleInLocation(DataUtil.getLocationUIdFromStone(this.props.sphereId, this.props.stoneId));
                    this.setState({selectedDetailField: SELECTABLE_TYPE.OPTION + "1"})
                  }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractEndConditionStrings(this.exampleBehaviours.option.inSphere.rule).endConditionStr) + ".",
                  isSelected: () => {
                    return this._evaluateOptionSelection(SELECTABLE_TYPE.OPTION + "2", this.exampleBehaviours.option.inSphere);
                  },
                  onSelect: () => {
                    this.rule.setEndConditionWhilePeopleInSphere();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.OPTION + "2"})
                  }
                },
                {
                  label: lang("Yes__just_turn_off_afterwa"),
                  isSelected: () => {
                    return this._evaluateOptionSelection(SELECTABLE_TYPE.OPTION + "3", this.exampleBehaviours.option.noOption) || this.rule.hasNoEndCondition();
                  },
                  onSelect: () => {
                    this.rule.setNoEndCondition();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.OPTION + "3"})
                  }
                },
              ]}
            />
          );
      }
    }
    return details
  }

  getDetails() {
    let details = this._getDetails();
    let showSuggestions = this._shouldShowSuggestions();
    return (
      <Animated.View   style={{height: this.state.containerHeight}}>
        <Animated.View style={{opacity: this.state.detailOpacity,     height: this.state.detailHeight,     position:'absolute', top:0}}>{details}</Animated.View>
        <Animated.View style={{opacity: this.state.mainBottomOpacity, height: this.state.mainBottomHeight, position:'absolute', top:0, overflow: 'hidden'}}>
          <Animated.View style={{width:screenWidth, flex:2, alignItems:'center'}}>
            { showSuggestions.shouldShowTimeConflict || <View style={{flex:0.25}} /> }
            { this._getSuggestions() }
            { showSuggestions.shouldShowTimeConflict || <View style={{flex:1}} /> }
            { showSuggestions.shouldShowTimeConflict ||

            <BehaviourSubmitButton callback={() => {
              NavigationUtil.navigate("DeviceSmartBehaviour_Wrapup", {
                sphereId: this.props.sphereId,
                stoneId: this.props.stoneId,
                ruleId: this.props.ruleId,
                rule: this.rule.stringify(),
                selectedDay: this.props.selectedDay,
                twilightRule: this.props.twilightRule,
              })}}
             label={lang("Use_Behaviour_")} />

            }
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  }


  render() {
    return (
      <View style={{flex:1}}>
        <View style={{flex:0.75}} />
        { this.getRuleSentenceElements() }
        <View style={{flex:0.25}} />
        { this.getDetails() }
      </View>
    );
  }
}



function DimmerPermissionOverlay(props) {
  return (
    <View style={{flex: 1, alignItems:'center', justifyContent:"center", paddingHorizontal:10}}>
      <View style={{flex:0.2}} />
      <Text style={deviceStyles.subHeader}>{ lang("Dimming_ability_required_") }</Text>
      <View style={{flex:1}} />
      <Text style={deviceStyles.text}>{ lang("You_need_to_enable_dimmin") }</Text>
      <View style={{flex:1}} />
      <BehaviourSubmitButton callback={() => { props.callback() }} label={ lang("Enable_dimming_")} />
      <View style={{flex:0.25}} />
      <BehaviourSubmitButton callback={() => { props.hideOverlayCallback() }} label={ lang("Not_right_now___")} color={colors.csOrange.hex} />
    </View>
  )
}