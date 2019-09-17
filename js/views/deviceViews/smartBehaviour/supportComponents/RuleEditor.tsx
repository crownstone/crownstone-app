
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
import { availableScreenHeight, colors, screenWidth, styles } from "../../../styles";
import { SELECTABLE_TYPE } from "../../../../Enums";
import { RoomList } from "../../../components/RoomList";
import { core } from "../../../../core";
import { BehaviourOptionList } from "./BehaviourOptionList";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreUtil } from "../supportCode/AicoreUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { BehaviourSuggestion } from "./BehaviourSuggestion";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";
import { BehaviourSubmitButton } from "./BehaviourSubmitButton";



export class RuleEditor extends LiveComponent<
  {data: behaviour | twilight, sphereId: string, stoneId: string, ruleId?: string, twilightRule: boolean},
  {detail: any, containerHeight: Animated.Value,  detailHeight: Animated.Value,  detailOpacity: Animated.Value,  mainBottomHeight: Animated.Value, mainBottomOpacity: Animated.Value, selectedDetailField: string, showCustomTimeData:boolean, userHidPresence: boolean, userHidTime: boolean}
  > {
  references = [];
  amountOfLines = 0;
  rule : AicoreBehaviour | AicoreTwilight;
  stone: any;
  selectedChunk : selectableAicoreBehaviourChunk;

  exampleBehaviours : any;
  baseHeight = availableScreenHeight - 300;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];
    this.stone = stone;


    this.state = {
      detail:            null,
      containerHeight:   new Animated.Value(this.baseHeight),
      detailHeight:      new Animated.Value(this.baseHeight),
      detailOpacity:     new Animated.Value(0),
      mainBottomHeight:  new Animated.Value(this.baseHeight),
      mainBottomOpacity: new Animated.Value(1),
      selectedDetailField: null,
      showCustomTimeData: false,
      userHidPresence: false,
      userHidTime: false
    };

    if (this.props.twilightRule) {
      // @ts-ignore
      this.rule = new AicoreTwilight(this.props.data);

      this.exampleBehaviours = {
        action: {
          dimming8: new AicoreTwilight().setActionState(0.8),
          dimming6: new AicoreTwilight().setActionState(0.6),
          dimming4: new AicoreTwilight().setActionState(0.4),
        },
        time: {
          dark: new AicoreTwilight().setTimeWhenDark(),
          sunUp: new AicoreTwilight().setTimeWhenSunUp(),
          specific: new AicoreTwilight().setTimeFrom(9,30).setTimeTo(15,0),
          custom: new AicoreTwilight().setTimeFromSunset(-30).setTimeTo(23,0),
        },
      }
    }
    else {
      // @ts-ignore
      this.rule = new AicoreBehaviour(this.props.data);
      this.exampleBehaviours = {
        action: {
          on: new AicoreBehaviour(),
          dimming: new AicoreBehaviour().setActionState(0.5),
        },
        presence: {
          somebody: new AicoreBehaviour().setPresenceSomebody(),
          nobody: new AicoreBehaviour().setPresenceNobody(),
          ignore: new AicoreBehaviour().ignorePresence(),
        },
        location: {
          sphere: new AicoreBehaviour().setPresenceSomebodyInSphere(),
          inRoom: new AicoreBehaviour().setPresenceSomebodyInStoneLocation([stone.config.locationId]),
          custom: new AicoreBehaviour().setPresenceSomebodyInLocations([]),
        },
        time: {
          dark: new AicoreBehaviour().setTimeWhenDark(),
          sunUp: new AicoreBehaviour().setTimeWhenSunUp(),
          allDay: new AicoreBehaviour().setTimeAllday(),
          specific: new AicoreBehaviour().setTimeFrom(9,30).setTimeTo(15,0),
          custom: new AicoreBehaviour().setTimeFromSunset(-30).setTimeTo(23,0),
        },
        option: {
          inSphere: new AicoreBehaviour().setOptionStayOnWhilePeopleInSphere(),
          inRoom: new AicoreBehaviour().setOptionStayOnWhilePeopleInLocation(),
          noOption: new AicoreBehaviour().setNoOptions(),
        }
      }
    }
  }


  getRuleSentenceElements() {
    this.amountOfLines = 0;

    let normal      : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.csBlueDark.hex, fontSize:20, fontWeight:'bold', height:30  };
    let selectable  : TextStyle = {...normal, textDecorationLine:'underline' };
    let segmentStyle : ViewStyle = {...(styles.centered as ViewStyle), flexDirection:'row', width: screenWidth};

    let ruleChunks = this.rule.getSelectableChunkData();

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
                <Text style={[selectable, {color: this.state.detail === chunk.type ? colors.menuTextSelected.hex : colors.csBlueDark.hex}]}>{wordsOnLine.join(" ")}</Text>
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
    let behaviourHeight = availableScreenHeight - 200 - this.amountOfLines*30;
    switch (selectedBehaviourType) {
      case SELECTABLE_TYPE.ACTION:
      case SELECTABLE_TYPE.PRESENCE:
      case SELECTABLE_TYPE.LOCATION:
        break;
      case SELECTABLE_TYPE.TIME:
        behaviourHeight += 130;
        break;
      case SELECTABLE_TYPE.OPTION:
        behaviourHeight += 50;
        break
    }

    if (this.state.detail === null) {
      // selecting a behaviour type while none was selected before.
      let animation = [];
      this.setState({detail: selectedBehaviourType, selectedDetailField: null});
      this.state.detailHeight.setValue(behaviourHeight);
      animation.push(Animated.timing(this.state.detailOpacity,     {toValue: 1, delay: 100, duration: 100}));
      animation.push(Animated.timing(this.state.mainBottomOpacity, {toValue: 0, delay: 0, duration: 100}));
      animation.push(Animated.timing(this.state.containerHeight  , {toValue: behaviourHeight, delay: 0, duration: 200}));
      animation.push(Animated.timing(this.state.mainBottomHeight  ,{toValue: behaviourHeight, delay: 0, duration: 200}));
      // animation.push(Animated.timing(this.state.mainBottomHeight,{toValue: originalHeight, delay: 0, duration: 200}));
      Animated.parallel(animation).start(() => { this.state.mainBottomHeight.setValue(0) })
    }
    else if (selectedBehaviourType === null) {
      // deselecting, revert to initial state
      let animation = [];
      if (this._shouldShowSuggestions().showAnySuggestions === true) {
        baseHeight = this.baseHeight + this._shouldShowSuggestions().amountOfSuggestions * 25;
      }
      this.state.mainBottomHeight.setValue(baseHeight);
      animation.push(Animated.timing(this.state.detailOpacity,    {toValue:0, delay:0, duration: 100}));
      animation.push(Animated.timing(this.state.mainBottomOpacity,{toValue:1, delay:100, duration: 100}));
      animation.push(Animated.timing(this.state.containerHeight,  {toValue: baseHeight, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.detailHeight,     {toValue: baseHeight, delay:0, duration: 200}));
      Animated.parallel(animation).start(() => { this.setState({detail: selectedBehaviourType, selectedDetailField: null}); })
    }
    else {
      // changing between selected behaviour types, fade out, and fadein
      let animation = [];
      animation.push(Animated.timing(this.state.detailHeight,     {toValue: behaviourHeight, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.containerHeight,  {toValue: behaviourHeight, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.detailOpacity,    {toValue:0, delay:0, duration: 150}));
      Animated.parallel(animation).start(() => {
        this.setState({detail: selectedBehaviourType, selectedDetailField: null}, () => {
          let animation = [];
          animation.push(Animated.timing(this.state.detailOpacity,{toValue:1, delay:0, duration: 150}));
          Animated.parallel(animation).start()
        })
      })
    }
  }

  _shouldShowSuggestions() {
    let showPresenceSuggestion = this.rule.isUsingPresence() === false && this.state.userHidPresence === true;
    let showTimeSuggestion = this.rule.isAlwaysActive() === true && this.state.userHidTime === true;
    let showOptionSuggestion = this.props.twilightRule === false &&
      (
        (this.rule.isUsingClockEndTime() && this.rule.getHour() >= 20)
        || this.rule.isUsingSunsetAsEndTime()
      ) &&
      this.rule.hasNoOptions();

    return {
      showPresenceSuggestion,
      showTimeSuggestion,
      showOptionSuggestion,
      showAnySuggestions: showPresenceSuggestion || showTimeSuggestion || showOptionSuggestion,
      amountOfSuggestions: (showPresenceSuggestion ? 1 : 0)  + (showTimeSuggestion ? 1 : 0) + (showOptionSuggestion ? 1 : 0)
    };
  }

  _getSuggestions() {
    let {showPresenceSuggestion, showTimeSuggestion, showOptionSuggestion } = this._shouldShowSuggestions();
    let suggestionArray = [];
    let paddingIndex = 0;
    if (showPresenceSuggestion) {
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<BehaviourSuggestion key={"presenceSuggestion"}
        label={ lang("Would_you_like_me_to_react")}
        callback={() => { this.toggleDetails(SELECTABLE_TYPE.PRESENCE); }}
      />);
    }
    if (showTimeSuggestion) {
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<BehaviourSuggestion key={"timeSuggestion"}
        label={ lang("Shall_I_do_this_at_a_certa")}
        callback={() => { this.toggleDetails(SELECTABLE_TYPE.TIME); }}
      />);
    }
    if (showOptionSuggestion) {
      let timeStr = AicoreUtil.getClockTimeStr(this.rule.getHour(), this.rule.getMinutes());
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<BehaviourSuggestion
        key={"optionSuggestion"}
        label={"Is it OK if I turn off at " + timeStr + " if there are still people around?"}
        callback={() => { this.toggleDetails(SELECTABLE_TYPE.OPTION); }}
      />);
    }
    suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex} />);



    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        {suggestionArray}
      </View>
    )
  }

  _showDimAmountPopup(exampleBehaviour, selectionDescription : string = null) {
    let dimmerOptions = [];
    dimmerOptions.push({ label: lang("x_percent",90), id: 0.9});
    dimmerOptions.push({ label: lang("x_percent",80), id: 0.8});
    dimmerOptions.push({ label: lang("x_percent",70), id: 0.7});
    dimmerOptions.push({ label: lang("x_percent",60), id: 0.6});
    dimmerOptions.push({ label: lang("x_percent",50), id: 0.5});
    dimmerOptions.push({ label: lang("x_percent",40), id: 0.4});
    dimmerOptions.push({ label: lang("x_percent",30), id: 0.3});
    dimmerOptions.push({ label: lang("x_percent",20), id: 0.2});
    dimmerOptions.push({ label: lang("x_percent",10), id: 0.1});

    core.eventBus.emit('showListOverlay', {
      title: lang("Dim_how_much_"),
      getItems: () => { return dimmerOptions; },
      callback: (value) => {
        exampleBehaviour.setDimAmount(value);
        this.rule.setDimAmount(value);
        this.setState({selectedDetailField: selectionDescription})
      },
      selection: this.rule.willDim() ? this.rule.getDimAmount() : exampleBehaviour.getDimAmount(),
      image: require("../../../../images/overlayCircles/dimmingCircleGreen.png")
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
          items.push( {id: locationId, component:<RoomList
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
      themeColor: colors.lightGreen2.hex,
      allowMultipleSelections: true,
      selection: this.rule.getLocationIds(),
      image: require("../../../../images/overlayCircles/roomsCircle.png")
    })
  }


  /**
   * The example origin field is meant to allow the system to update the custom fields based on the user selection.
   * @param exampleOriginField
   * @param useData
   * @private
   */
  _showTimeSelectionPopup(exampleOriginField, useData = true) {
    core.eventBus.emit('showAicoreTimeCustomizationOverlay', {
      callback: (newTime : aicoreTime) => {
        this.exampleBehaviours.time[exampleOriginField].setTime(newTime);
        this.rule.setTime(newTime);

        // Yes, this is ugly. I also don't want to mark a field as "default" in the behaviour, nor allow null as a behaviour value.
        if (exampleOriginField === "custom") {
          this.setState({showCustomTimeData: true, selectedDetailField: SELECTABLE_TYPE.TIME + "4"})
        }
        else {
          this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "3"})
        }
      },
      time: useData ? this.exampleBehaviours.time[exampleOriginField].getTime() : null,
      image: require("../../../../images/overlayCircles/time.png")
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
    return this._evaluateSelection(selectedDescription) || this.rule.doesOptionMatch(ruleToMatch);
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
              elements={[
                {
                  label: lang("Dimmed____", 80),
                  isSelected: () => {
                    return this._evaluateActionSelection(SELECTABLE_TYPE.ACTION + "1", this.exampleBehaviours.action.dimming8);
                  },
                  onSelect: () => {
                    this.rule.setDimAmount(0.8);
                    this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "1"})
                  }
                },
                {
                  label: lang("Dimmed____", 60),
                  isSelected: () => {
                    return this._evaluateActionSelection(SELECTABLE_TYPE.ACTION + "4", this.exampleBehaviours.action.dimming6);
                  },
                  onSelect: () => {
                    this.rule.setDimAmount(0.6);
                    this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "2"})
                  }
                },
                {
                  label: lang("Dimmed__",Math.round(this.exampleBehaviours.action.dimming4.getDimAmount() * 100)),
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
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.specific.rule)) + ".",
                  subLabel: "(tap to customize)",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "3", this.exampleBehaviours.time.specific);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('specific')
                  }
                },
                {
                  label: lang("Other___"),
                  subLabel: "(tap to create)",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "4", this.exampleBehaviours.time.custom);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('custom', this.state.showCustomTimeData)
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
              elements={[
                {
                  label: lang("On"),
                  isSelected: () => { return this.rule.doesActionMatch(this.exampleBehaviours.action.on) },
                  onSelect: () => {this.rule.setActionState(1); this.forceUpdate(); }
                },
                {
                  label: lang("Dimmed__", Math.round(this.rule.willDim() ? this.rule.getDimAmount() : 0.5 * 100)),
                  subLabel: "(tap to change)",
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
              closeLabel={"That's it!"}
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
                  onSelect: () => { this.rule.setPresenceIgnore(); this.setState({userHidPresence: true}) }
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
                    this.rule.setPresenceSomebodyInStoneLocation([this.stone.config.locationId]);
                    this.setState({selectedDetailField: SELECTABLE_TYPE.LOCATION + "2"})
                  }
                },
                {
                  label: lang("Select_room_s____"),
                  subLabel: "(tap to select)",
                  isSelected: () => {
                    return this._evaluatePresenceLocationSelection(SELECTABLE_TYPE.LOCATION + "3", this.exampleBehaviours.location.custom);
                  },
                  onSelect: () => { this._showLocationSelectionPopup(); },
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
                  label: lang("Always_"),
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "3", this.exampleBehaviours.time.allDay);
                  },
                  onSelect: () => {
                    this.rule.setTimeAllday();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "3", userHidTime: true})
                  }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.specific.rule)) + ".",
                  subLabel: "(tap to customize)",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "4", this.exampleBehaviours.time.specific);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('specific')
                  }
                },
                {
                  label: lang("Other___"),
                  subLabel: "(tap to create)",
                  isSelected: () => {
                    return this._evaluateTimeSelection(SELECTABLE_TYPE.TIME + "5", this.exampleBehaviours.time.custom);
                  },
                  onSelect: () => {
                    this._showTimeSelectionPopup('custom', this.state.showCustomTimeData)
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
              elements={[
                {
                  label: xUtil.capitalize(AicoreUtil.extractOptionStrings(this.exampleBehaviours.option.inRoom.rule).optionStr) + ".",
                  isSelected: () => {
                    return this._evaluateOptionSelection(SELECTABLE_TYPE.OPTION + "1", this.exampleBehaviours.option.inRoom);
                  },
                  onSelect: () => {
                    this.rule.setOptionStayOnWhilePeopleInLocation();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.OPTION + "1"})
                  }
                },
                {
                  label: xUtil.capitalize(AicoreUtil.extractOptionStrings(this.exampleBehaviours.option.inSphere.rule).optionStr) + ".",
                  isSelected: () => {
                    return this._evaluateOptionSelection(SELECTABLE_TYPE.OPTION + "2", this.exampleBehaviours.option.inSphere);
                  },
                  onSelect: () => {
                    this.rule.setOptionStayOnWhilePeopleInSphere();
                    this.setState({selectedDetailField: SELECTABLE_TYPE.OPTION + "2"})
                  }
                },
                {
                  label: lang("Yes__just_turn_off_afterwa"),
                  isSelected: () => {
                    return this._evaluateOptionSelection(SELECTABLE_TYPE.OPTION + "3", this.exampleBehaviours.option.noOption) || this.rule.hasNoOptions();
                  },
                  onSelect: () => {
                    this.rule.setNoOptions();
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

    return (
      <Animated.View style={{height: this.state.containerHeight}}>
        <Animated.View style={{opacity: this.state.detailOpacity, height: this.state.detailHeight, position:'absolute', top:0}}>{details}</Animated.View>
        <Animated.View style={{opacity: this.state.mainBottomOpacity, height: this.state.mainBottomHeight, position:'absolute', top:0, overflow: 'hidden'}}>
          <Animated.View style={{width:screenWidth, flex:1, alignItems:'center'}}>
            { this._getSuggestions() }
            <BehaviourSubmitButton callback={() => {
              NavigationUtil.navigate("DeviceSmartBehaviour_Wrapup", {
                sphereId: this.props.sphereId,
                stoneId: this.props.stoneId,
                ruleId: this.props.ruleId,
                rule: this.rule.stringify(),
                twilightRule: this.props.twilightRule,
              })}}
             label={lang("Use_Behaviour_")} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  }


  render() {
    return (
      <View style={{flex:1}}>
        <View style={{flex:1}} />
        { this.getRuleSentenceElements() }
        { this.getDetails() }
        <View style={{flex:1}} />
      </View>
    );
  }
}

