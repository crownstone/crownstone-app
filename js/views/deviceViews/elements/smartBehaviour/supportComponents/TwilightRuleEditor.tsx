import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle
} from "react-native";
import { availableScreenHeight, colors, deviceStyles, screenWidth, styles } from "../../../../styles";
import { SELECTABLE_TYPE } from "../../../../../Enums";
import { core } from "../../../../../core";
import { BehaviourOptionList } from "./BehaviourOptionList";
import { AicoreUtil } from "../supportCode/AicoreUtil";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";
import { NavigationUtil } from "../../../../../util/NavigationUtil";



export class TwilightRuleEditor extends Component<{data:twilight,sphereId: string, stoneId:string, ruleId?:string}, any> {
  references = [];
  amountOfLines = 0;
  rule : AicoreTwilight;
  selectedChunk : selectableAicoreBehaviourChunk;

  exampleBehaviours : any;
  baseHeight = availableScreenHeight - 300

  constructor(props) {
    super(props);


    this.rule = new AicoreTwilight(this.props.data);

    this.state = {
      detail:            null,
      containerHeight:   new Animated.Value(this.baseHeight),
      detailHeight:      new Animated.Value(this.baseHeight),
      detailOpacity:     new Animated.Value(0),
      mainBottomHeight:  new Animated.Value(this.baseHeight),
      mainBottomOpacity: new Animated.Value(1),
      selectedDetailField: null,
      showCustomTimeData: false,
    };

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
          lastWordLength = AicoreUtil.getWordLength(words[i] + (lastChunk ? "" : ' '))
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
        this.exampleBehaviours.action.dimming4.setDimAmount(value);
        this.rule.setDimAmount(value);
        this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "3"})
      },
      selection: this.rule.getDimAmount(),
      image: require("../../../../../images/overlayCircles/dimmingCircleGreen.png")
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
        if (newTime.type === "RANGE") {
          let time = { from: newTime.from, to: newTime.to }
          this.exampleBehaviours.time[exampleOriginField].setTime(newTime);
          this.rule.setTime(time);

          // Yes, this is ugly. I also don't want to mark a field as "default" in the behaviour, nor allow null as a behaviour value.
          if (exampleOriginField === "custom") {
            this.setState({ showCustomTimeData: true, selectedDetailField: SELECTABLE_TYPE.TIME + "5" })
          } else {
            this.setState({ selectedDetailField: SELECTABLE_TYPE.TIME + "4" })
          }
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
                label: "Dimmed 80%",
                isSelected: () => {
                  // we check the selection by state because the 3rd option can be valid together with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.ACTION + "1") {
                    return true;
                  }
                  return this.rule.doesActionMatch(this.exampleBehaviours.action.dimming8); },
                onSelect: () => {
                  this.rule.setDimAmount(0.8);
                  this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "1"})
                }
              },
              {
                label: "Dimmed 60%",
                isSelected: () => {
                  // we check the selection by state because the 3rd option can be valid together with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.ACTION + "2") {
                    return true;
                  }
                  return this.rule.doesActionMatch(this.exampleBehaviours.action.dimming6); },
                onSelect: () => {
                  this.rule.setDimAmount(0.6);
                  this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "2"})
                }
              },
              {
                label: "Dimmed 60%",
                isSelected: () => {
                  // we check the selection by state because the 3rd option can be valid together with
                  // some of the others. This is sloppy for the UI.
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.ACTION + "2") {
                    return true;
                  }
                  return this.rule.doesActionMatch(this.exampleBehaviours.action.dimming6); },
                onSelect: () => {
                  this.rule.setDimAmount(0.6);
                  this.setState({selectedDetailField: SELECTABLE_TYPE.ACTION + "2"})
                }
              },
              {
                label: "Dimmed " + Math.round(this.exampleBehaviours.action.dimming4.getDimAmount() * 100) + "%",
                subLabel: "(tap to change)",
                isSelected: () => {
                  if (this.state.selectedDetailField === SELECTABLE_TYPE.ACTION + "3") {
                    return true;
                  }
                  return this.rule.doesActionMatch(this.exampleBehaviours.action.dimming4); },
                onSelect: () => { this._showDimAmountPopup(); }
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
    }

    return (
      <Animated.View style={{height: this.state.containerHeight}}>
        <Animated.View style={{opacity: this.state.detailOpacity, height: this.state.detailHeight, position:'absolute', top:0}}>{details}</Animated.View>
        <Animated.View style={{opacity: this.state.mainBottomOpacity, height: this.state.mainBottomHeight, position:'absolute', top:0, overflow: 'hidden'}}>
          <Animated.View style={{width:screenWidth, flex:1, alignItems:'center'}}>
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
      ruleId: this.props.ruleId || undefined,
      data: {
        type:"TWILIGHT",
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

