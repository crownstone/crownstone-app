import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle
} from "react-native";
import { availableScreenHeight, colors, deviceStyles, screenWidth, styles } from "../../../../styles";
import { SELECTABLE_TYPE } from "../../../../../Enums";
import { RoomList } from "../../../../components/RoomList";
import { core } from "../../../../../core";
import { BehaviourOptionList } from "./BehaviourOptionList";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreUtil } from "../supportCode/AicoreUtil";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { BehaviourQuestion, BehaviourSuggestion } from "./BehaviourSuggestion";
import { NavigationUtil } from "../../../../../util/NavigationUtil";



export class BehaviourRuleEditor extends Component<{data:behaviour, sphereId: string, stoneId: string, ruleId?: string}, any> {
  references = [];
  amountOfLines = 0;
  rule : AicoreBehaviour;
  selectedChunk : selectableAicoreBehaviourChunk;

  exampleBehaviours : any;
  baseHeight = availableScreenHeight - 300

  constructor(props) {
    super(props);


    this.rule = new AicoreBehaviour(this.props.data);
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
        inRoom: new AicoreBehaviour().setPresenceSomebodyInStoneLocation([getLocationId(0)]), // TODO: get actual room ID
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

  getRuleSentenceElements() {
    this.amountOfLines = 0;

    let normal      : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.white.hex, fontSize:20, fontWeight:'bold', height:30  };
    let selectable  : TextStyle = {...normal, textDecorationLine:'underline' };
    let segmentStyle : ViewStyle = {...styles.centered, flexDirection:'row', width: screenWidth};

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
    }

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
                <Text style={[selectable, {color: this.state.detail === chunk.type ? colors.green.hex : colors.white.hex}]}>{wordsOnLine.join(" ")}</Text>
              </TouchableOpacity>
            );
          }
          else {
            segments.push(<View key={"label_element_" + i}><Text style={normal}>{wordsOnLine.join(" ")}</Text></View>);
          }
        }
      }


      // this piece of code guesses the length of the line so we can do manual wrapping.
      // Normal RN wrapping does not support partially touchable elements.
      for (let i = 0; i < words.length; i++) {
        let lastWordLength = 0;
        if (words[i]) {
          lastWordLength = getWordLength(words[i] + (lastChunk ? "" : ' '))
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
        break
      case SELECTABLE_TYPE.OPTION:
        behaviourHeight += 50;
        break
    }

    if (this.state.detail === null) {
      // selecting a behaviour type while none was selected before.
      let animation = [];
      this.setState({detail: selectedBehaviourType, selectedDetailField: false});
      this.state.detailHeight.setValue(behaviourHeight)
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
      Animated.parallel(animation).start(() => { this.setState({detail: selectedBehaviourType, selectedDetailField: false}); })
    }
    else {
      // changing between selected behaviour types, fade out, and fadein
      let animation = [];
      animation.push(Animated.timing(this.state.detailHeight,     {toValue: behaviourHeight, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.containerHeight,  {toValue: behaviourHeight, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.detailOpacity,    {toValue:0, delay:0, duration: 150}))
      Animated.parallel(animation).start(() => {
        this.setState({detail: selectedBehaviourType, selectedDetailField: false}, () => {
          let animation = [];
          animation.push(Animated.timing(this.state.detailOpacity,{toValue:1, delay:0, duration: 150}));
          Animated.parallel(animation).start()
        })
      })
    }
  }

  _shouldShowSuggestions() {
    console.log(this.state, this)

    let showPresenceSuggestion = this.rule.isUsingPresence() === false && this.state.userHidPresence === true;
    let showTimeSuggestion = this.rule.isAlwaysActive() === true && this.state.userHidTime === true;
    let showOptionSuggestion = this.rule.isUsingClockEndTime() && this.rule.getHour() > 21 && this.rule.hasNoOptions();

    return {
      showPresenceSuggestion,
      showTimeSuggestion,
      showOptionSuggestion,
      showAnySuggestions: showPresenceSuggestion || showTimeSuggestion || showOptionSuggestion,
      amountOfSuggestions: (showPresenceSuggestion ? 1 : 0)  + (showTimeSuggestion ? 1 : 0) + (showOptionSuggestion ? 1 : 0)
    };
  }

  _getSuggestions() {
    let {showPresenceSuggestion, showTimeSuggestion, showOptionSuggestion } = this._shouldShowSuggestions()
    let suggestionArray = [];
    let paddingIndex = 0;
    if (showPresenceSuggestion) {
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<BehaviourSuggestion key={"presenceSuggestion"}
        label={"Would you like me to react to presence?"}
        callback={() => { this.toggleDetails(SELECTABLE_TYPE.PRESENCE); }}
      />);
    }
    if (showTimeSuggestion) {
      suggestionArray.push(<View style={{flex:1}} key={"padding_" + paddingIndex++} />);
      suggestionArray.push(<BehaviourSuggestion key={"timeSuggestion"}
        label={"Shall I do this at a certain time?"}
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

  _showDimAmountPopup() {
    let dimmerOptions = [];
    dimmerOptions.push({ label: "90%", id: 0.9});
    dimmerOptions.push({ label: "80%", id: 0.8});
    dimmerOptions.push({ label: "70%", id: 0.7});
    dimmerOptions.push({ label: "60%", id: 0.6});
    dimmerOptions.push({ label: "50%", id: 0.5});
    dimmerOptions.push({ label: "40%", id: 0.4});
    dimmerOptions.push({ label: "30%", id: 0.3});
    dimmerOptions.push({ label: "20%", id: 0.2});
    dimmerOptions.push({ label: "10%", id: 0.1});

    core.eventBus.emit('showListOverlay', {
      title: "Dim how much?",
      getItems: () => { return dimmerOptions; },
      callback: (value) => {
        this.exampleBehaviours.action.dimming.setDimAmount(value);
        this.rule.setDimAmount(value);
        this.forceUpdate();
      },
      selection: this.rule.willDim() ? this.rule.getDimAmount() : this.exampleBehaviours.action.dimming.getDimAmount(),
      image: require("../../../../../images/overlayCircles/dimmingCircleGreen.png")
    })
  }

  _showLocationSelectionPopup() {
    core.eventBus.emit('showListOverlay', {
      title: "Select Rooms",
      getItems: () => {
        const state = core.store.getState();
        let sphereIds = Object.keys(state.spheres);
        let activeSphere = sphereIds[0]
        const sphere = state.spheres[activeSphere];
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
        })

        return items;
      },
      callback: (selection) => {
        if (selection.length > 0) {
          this.exampleBehaviours.location.custom.setPresenceInLocations(selection);
          this.rule.setPresenceInLocations(selection);
        }
        this.setState({selectedDetailField: SELECTABLE_TYPE.LOCATION + "3"})
      },
      allowMultipleSelections: true,
      selection: this.rule.getLocationIds(),
      image: require("../../../../../images/overlayCircles/roomsCircle.png")
    })
  }


  /**
   * The example origin field is meant to allow the system to update the custom fields based on the user selection.
   * @param exampleOriginField
   * @private
   */
  _showTimeSelectionPopup(exampleOriginField, useData = true) {
    core.eventBus.emit('showAicoreTimeCustomizationOverlay', {
      callback: (newTime : aicoreTime) => {
        this.exampleBehaviours.time[exampleOriginField].setTime(newTime);
        this.rule.setTime(newTime);

        // Yes, this is ugly. I also don't want to mark a field as "default" in the behaviour, nor allow null as a behaviour value.
        if (exampleOriginField === "custom") {
          this.setState({showCustomTimeData: true, selectedDetailField: SELECTABLE_TYPE.TIME + "5"})
        }
        else {
          this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "4"})
        }
      },
      time: useData ? this.exampleBehaviours.time[exampleOriginField].getTime() : null,
      image: require("../../../../../images/overlayCircles/time.png")
    })
  }


  getDetails() {
    let details = null;
    switch (this.state.detail) {
      case SELECTABLE_TYPE.ACTION:
        details = (
          <BehaviourOptionList
            header={"What should I be?"}
            explanation={"My behaviour defines when I should be on. I will be off when I should not be on."}
            closeCallback={() => { this.toggleDetails(null); }}
            closeLabel={"Sounds about right!"}
            elements={[
              {
                label: "On",
                isSelected: () => { return this.rule.doesActionMatch(this.exampleBehaviours.action.on) },
                onSelect: () => {this.rule.setActionState(1); this.forceUpdate(); }
              },
              {
                label: "Dimmed " + Math.round((this.rule.willDim() ? this.rule.getDimAmount() : 0.5) * 100) + "%",
                subLabel: "(tap to change)",
                isSelected: () => { return this.rule.doesActionMatch(this.exampleBehaviours.action.dimming)},
                onSelect: () => { this._showDimAmountPopup(); }
              },
            ]}
          />
        );
        break;
      case SELECTABLE_TYPE.PRESENCE:
        details = (
          <BehaviourOptionList
            header={"Who shall I look for?"}
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
                label: "Ignore presence",
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
            header={"Where should I look?"}
            closeCallback={() => { this.toggleDetails(null); }}
            closeLabel={"Got it!"}
            elements={[
              {
                label: "Anywhere in the house!",
                isSelected: () => {
                  // we check the selection by state because the second and custom option can both be valid. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.LOCATION + "1") {
                    return true;
                  }
                  return this.rule.doesPresenceLocationMatch(this.exampleBehaviours.location.sphere);
                },
                onSelect: () => { this.rule.setPresenceInSphere(); this.setState({selectedDetailField: SELECTABLE_TYPE.LOCATION + "1"}) }
              },
              {
                label: "In the room.",
                isSelected: () => {
                  // we check the selection by state because the second and custom option can both be valid. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.LOCATION + "2") {
                    return true;
                  }
                  return this.rule.doesPresenceLocationMatch(this.exampleBehaviours.location.inRoom);
                },
                onSelect: () => {
                  this.rule.setPresenceSomebodyInStoneLocation([getLocationId(0)]);
                  this.setState({selectedDetailField: SELECTABLE_TYPE.LOCATION + "2"})
                }
              },
              {
                label: "Select room(s)...",
                subLabel: "(tap to select)",
                isSelected: () => {
                  // we check the selection by state because the second and custom option can both be valid. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.LOCATION + "3") {
                    return true;
                  }
                  return this.rule.doesPresenceLocationMatch(this.exampleBehaviours.location.custom);
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
            header={"When should I do this?"}
            closeCallback={() => { this.toggleDetails(null); }}
            closeLabel={"Will do!"}
            elements={[
              {
                label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.dark.rule)) + ".",
                isSelected: () => {
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.TIME + "1") {
                    return true;
                  }
                  return this.rule.doesTimeMatch(this.exampleBehaviours.time.dark); },
                onSelect: () => {
                  this.rule.setTimeWhenDark();
                  this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "1"})
                }
              },
              {
                label: xUtil.capitalize(AicoreUtil.extractTimeString(this.exampleBehaviours.time.sunUp.rule)) + ".",
                isSelected: () => {
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.TIME + "2") {
                    return true;
                  }
                  return this.rule.doesTimeMatch(this.exampleBehaviours.time.sunUp);
                },
                onSelect: () => {
                  this.rule.setTimeWhenSunUp();
                  this.setState({selectedDetailField: SELECTABLE_TYPE.TIME + "2"})
                }
              },
              {
                label: "Always.",
                isSelected: () => {
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.TIME + "3") {
                    return true;
                  }
                  return this.rule.doesTimeMatch(this.exampleBehaviours.time.allDay);
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
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.TIME + "4") {
                    return true;
                  }
                  return this.rule.doesTimeMatch(this.exampleBehaviours.time.specific);
                },
                onSelect: () => {
                  this._showTimeSelectionPopup('specific')
                }
              },
              {
                label: "Other...",
                subLabel: "(tap to create)",
                isSelected: () => {
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.TIME + "5") {
                    return true;
                  }
                  return this.rule.doesTimeMatch(this.exampleBehaviours.time.custom);
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
            header={"Can I turn off afterwards?"}
            closeCallback={() => { this.toggleDetails(null); }}
            closeLabel={"Will do!"}
            elements={[
              {
                label: xUtil.capitalize(AicoreUtil.extractOptionStrings(this.exampleBehaviours.option.inRoom.rule).optionStr) + ".",
                isSelected: () => {
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.OPTION + "1") {
                    return true;
                  }
                  return this.rule.doesOptionMatch(this.exampleBehaviours.option.inRoom);
                },
                onSelect: () => {
                  this.rule.setOptionStayOnWhilePeopleInLocation();
                  this.setState({selectedDetailField: SELECTABLE_TYPE.OPTION + "1"})
                }
              },
              {
                label: xUtil.capitalize(AicoreUtil.extractOptionStrings(this.exampleBehaviours.option.inSphere.rule).optionStr) + ".",
                isSelected: () => {
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.OPTION + "2") {
                    return true;
                  }
                  return this.rule.doesOptionMatch(this.exampleBehaviours.option.inSphere); },
                onSelect: () => {
                  this.rule.setOptionStayOnWhilePeopleInSphere();
                  this.setState({selectedDetailField: SELECTABLE_TYPE.OPTION + "2"})
                }
              },
              {
                label: "Yes, just turn off afterwards.",
                isSelected: () => {
                  // we check the selection by state because the 4th and 5th option can both be valid with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.OPTION + "3") {
                    return true;
                  }
                  return this.rule.doesOptionMatch(this.exampleBehaviours.option.noOption);
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

    return (
      <Animated.View style={{height: this.state.containerHeight}}>
        <Animated.View style={{opacity: this.state.detailOpacity, height: this.state.detailHeight, position:'absolute', top:0}}>{details}</Animated.View>
        <Animated.View style={{opacity: this.state.mainBottomOpacity, height: this.state.mainBottomHeight, position:'absolute', top:0, overflow: 'hidden'}}>
          <Animated.View style={{width:screenWidth, flex:1, alignItems:'center'}}>
            { this._getSuggestions() }
            <TouchableOpacity onPress={() => {
              this._storeRule();
              NavigationUtil.backTo("DeviceSmartBehaviour")
            }} style={{
              width:0.5*screenWidth, height:60, borderRadius:20,
              backgroundColor: colors.green.hex, alignItems:'center', justifyContent: 'center'
            }}>
              <Text style={{fontSize:16, fontWeight:'bold'}}>Use Behaviour!</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    );
  }


  _storeRule() {
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
    core.store.dispatch({
      type:"ADD_STONE_RULE",
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      ruleId: this.props.ruleId || xUtil.getUUID(),
      data: {
        type:"BEHAVIOUR",
        data: this.rule.stringify(),
        activeDays: activeDays,
        syncedToCrownstone: false
      }
    });
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


function getWordLength(word) {
  let result = 0;
  let letterWidthMap = { I:4," ": 5, m:16, w:16, rest:11, ".":2 };
  for (let i = 0; i < word.length; i++) {
    if (word[i]) {
      result += letterWidthMap[word[i]] || letterWidthMap.rest;
    }
  }
  return result;
}

function getLocationId(i) {
  let state = core.store.getState();
  let sphereIds = Object.keys(state.spheres);
  let activeSphere = sphereIds[0]

  let sphere = state.spheres[activeSphere];
  let locationIds = Object.keys(sphere.locations).sort();
  return locationIds[i];
}
