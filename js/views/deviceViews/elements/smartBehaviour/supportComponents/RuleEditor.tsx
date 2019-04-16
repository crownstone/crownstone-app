import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle
} from "react-native";
import { BehaviourConstructor } from "../SmartBehaviourLogic";
import { availableScreenHeight, colors, deviceStyles, screenWidth, styles } from "../../../../styles";
import { SELECTABLE_TYPE } from "../../../../../Enums";
import { RoomList } from "../../../../components/RoomList";
import { core } from "../../../../../core";
import { BehaviourOptionList } from "./BehaviourOptionList";



export class RuleEditor extends Component<{data:behaviour}, any> {
  references = [];
  amountOfLines = 0;
  rule;
  selectedChunk : behaviourChunk;

  constructor(props) {
    super(props);

    this.state = {
      detail:            null,
      detailHeight:      new Animated.Value(availableScreenHeight - 300),
      mainBottomHeight: new Animated.Value(availableScreenHeight - 300),
      detailOpacity:     new Animated.Value(0),
      buttonOpacity:     new Animated.Value(1),
    };
    this.rule = new BehaviourConstructor(this.props.data);
  }

  getRuleSentenceElements() {
    this.amountOfLines = 0;

    let normal      : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.white.hex, fontSize:20, fontWeight:'bold', height:30  };
    let selectable  : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.white.hex, fontSize:20, fontWeight:'bold', height:30, textDecorationLine:'underline' };
    let segmentStyle : ViewStyle = {...styles.centered, flexDirection:'row', width: screenWidth};

    let ruleChunks = this.rule.getLogicChunks();

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
        // TODO: add suggestions?
        return;
      }

      let lastChunk = i == ruleChunks.length -1;
      let words = chunk.label.split(" ");
      wordsOnLine = [];

      let putWordsIntoSegments = () => {
        if (wordsOnLine.length > 0) {
          if (chunk.clickable) {
            segments.push(
              <TouchableOpacity key={"selectable_element_" + i} onPress={() => { this.toggleDetails(chunk); }}>
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


  toggleDetails(chunk) {
    let selectedBehaviourType = null;

    if (chunk !== null) {
      selectedBehaviourType = chunk.type;
    }

    if (this.state.detail === selectedBehaviourType) {
      // selecting the same behaviour twice --> do nothing.
      return;
    }

    let originalHeight = availableScreenHeight - 300;
    let behaviourHeight = availableScreenHeight - 200 - this.amountOfLines*30;
    switch (selectedBehaviourType) {
      case SELECTABLE_TYPE.ACTION:
      case SELECTABLE_TYPE.PRESENCE:
      case SELECTABLE_TYPE.LOCATION:
        break;
      case SELECTABLE_TYPE.TIME:
        behaviourHeight += 130;
    }

    if (this.state.detail === null) {
      // selecting a behaviour type while none was selected before.
      let animation = [];
      this.setState({detail: selectedBehaviourType});
      animation.push(Animated.timing(this.state.detailOpacity,   {toValue: 1, delay: 0,   duration: 100}));
      animation.push(Animated.timing(this.state.buttonOpacity,   {toValue: 0, delay: 100, duration: 100}));
      animation.push(Animated.timing(this.state.detailHeight,    {toValue: behaviourHeight, delay: 0, duration: 200}));
      // animation.push(Animated.timing(this.state.mainBottomHeight,{toValue: originalHeight, delay: 0, duration: 200}));
      Animated.parallel(animation).start(() => { this.state.mainBottomHeight.setValue(0) })
    }
    else if (selectedBehaviourType === null) {
      // deselecting, revert to initial state
      let animation = [];
      this.state.mainBottomHeight.setValue(originalHeight);
      animation.push(Animated.timing(this.state.detailOpacity,     {toValue:0, delay:0, duration: 100}));
      animation.push(Animated.timing(this.state.buttonOpacity,     {toValue:1, delay:100, duration: 100}));
      animation.push(Animated.timing(this.state.detailHeight,      {toValue: originalHeight, delay:0, duration: 200}));
      Animated.parallel(animation).start(() => { this.setState({detail: selectedBehaviourType}); })
    }
    else {
      // changing between selected behaviour types, fade out, and fadein
      let animation = [];
      animation.push(Animated.timing(this.state.detailHeight,     {toValue: behaviourHeight, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.detailHeight,     {toValue: behaviourHeight, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.detailOpacity,    {toValue:0, delay:0, duration: 150}))
      Animated.parallel(animation).start(() => {
        this.setState({detail: selectedBehaviourType}, () => {
          let animation = [];
          animation.push(Animated.timing(this.state.detailOpacity,    {toValue:1, delay:0, duration: 150}));
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
      callback: (value) => { this.selectedChunk.changeAction(value); this.forceUpdate(); },
      selection:  (this.selectedChunk.value < 1 ? this.selectedChunk.value : 0.5),
      image: require("../../../../../images/overlayCircles/dimmingCircleGreen.png")
    })
  }

  _showLocationSelectionPopup(selection) {
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
        this.selectedChunk.changeAction({type:"LOCATION", locationIds: selection});
        this.forceUpdate();
      },
      allowMultipleSelections: true,
      selection: selection,
      image: require("../../../../../images/overlayCircles/roomsCircle.png")
    })
  }

  _showTimeSelectionPopup() {
    core.eventBus.emit('showListOverlay', {
      title: "When?",
      customContent: <View style={{width:100, height:100, backgroundColor:"#f00"}} />,
      callback: (selection) => {
        this.selectedChunk.changeAction({type:"LOCATION", locationIds: selection});
        this.forceUpdate();
      },
      allowMultipleSelections: true,
      selection: null,
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
                isSelected: () => { return this.selectedChunk.value === 1;},
                selectionCallback: () => { this.selectedChunk.changeAction(1); this.forceUpdate(); }
              },
              {
                label: "Dimmed " + Math.round((this.selectedChunk.value < 1 ? this.selectedChunk.value : 0.5) * 100) + "%",
                subLabel: "(tap to change)",
                isSelected: () => { return this.selectedChunk.value < 1;},
                selectionCallback: () => { this._showDimAmountPopup(); }
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
                label: "Somebody",
                isSelected: () => { return this.selectedChunk.value === "SOMEBODY"; },
                selectionCallback: () => { this.selectedChunk.changeAction("SOMEBODY"); this.forceUpdate(); }
              },
              {
                label: "Nobody",
                isSelected: () => { return this.selectedChunk.value === "NOBODY"; },
                selectionCallback: () => { this.selectedChunk.changeAction("NOBODY"); this.forceUpdate(); }
              },
              {
                label: "Ignore",
                isSelected: () => { return this.selectedChunk.value === "IGNORE"; },
                selectionCallback: () => { this.selectedChunk.changeAction("IGNORE"); this.forceUpdate(); }
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
                isSelected: () => { return this.selectedChunk.value && this.selectedChunk.value.type === "SPHERE"; },
                selectionCallback: () => { this.selectedChunk.changeAction({type:"SPHERE"}); this.forceUpdate(); }
              },
              {
                label: "In the room.",
                isSelected: () => {
                  return this.selectedChunk.value &&
                    this.selectedChunk.value.type === "LOCATION" &&
                    this.selectedChunk.value.locationIds.length === 1 &&
                    this.selectedChunk.value.locationIds[0] == getTheId(0)
                },
                selectionCallback: () => {
                  this.selectedChunk.changeAction({
                    type:"LOCATION",
                    locationIds:[getTheId(0)]
                  });
                  this.forceUpdate();
                }
              },
              {
                label: "Select room(s)...",
                subLabel: "(tap to select)",
                isSelected: () => {
                  return this.selectedChunk.value &&
                    this.selectedChunk.value.type === "LOCATION" &&
                    ((this.selectedChunk.value.locationIds.length === 1 && this.selectedChunk.value.locationIds[0] != getTheId(0)) ||
                    this.selectedChunk.value.locationIds.length > 1)
                },
                selectionCallback: () => { this._showLocationSelectionPopup(this.selectedChunk.value.locationIds); },
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
                label: "While it's dark outside.",
                isSelected: () => {
                  console.log(this.selectedChunk)
                  return this.selectedChunk.value.type === "RANGE" &&
                    this.selectedChunk.value.from.type === "SUNSET" &&
                    this.selectedChunk.value.from.offsetMinutes === 0 &&
                    this.selectedChunk.value.to.type === "SUNRISE" &&
                    this.selectedChunk.value.to.offsetMinutes === 0
                },
                selectionCallback: () => {
                  this.selectedChunk.changeAction({
                    type:"RANGE", from: {type:"SUNSET", offsetMinutes:0}, to: {type:"SUNRISE", offsetMinutes:0}
                  });
                  this.forceUpdate();
                }
              },
              {
                label: "While the sun's up.",
                isSelected: () => {
                  return this.selectedChunk.value.type === "RANGE" &&
                    this.selectedChunk.value.from.type === "SUNRISE" &&
                    this.selectedChunk.value.from.offsetMinutes === 0 &&
                    this.selectedChunk.value.to.type === "SUNSET" &&
                    this.selectedChunk.value.to.offsetMinutes === 0
                },
                selectionCallback: () => {
                  this.selectedChunk.changeAction({
                    type:"RANGE", from: {type:"SUNRISE", offsetMinutes:0}, to: {type:"SUNSET", offsetMinutes:0}
                  });
                  this.forceUpdate();
                }
              },
              {
                label: "Always.",
                isSelected: () => {
                  return this.selectedChunk.value.type === "ALWAYS";
                },
                selectionCallback: () => {
                  this.selectedChunk.changeAction({type:"ALWAYS"});
                  this.forceUpdate();
                }
              },
              {
                label: "From 9:30 to 15:00.",
                subLabel: "(tap to customize)",
                isSelected: () => { return false; },
                selectionCallback: () => {
                  this._showTimeSelectionPopup()
                }
              },
              {
                label: "Other...",
                subLabel: "(tap to create)",
                isSelected: () => { return false; },
                selectionCallback: () => {
                  this._showTimeSelectionPopup()
                }
              },
            ]}
          />
        );
    }

    return (
      <Animated.View style={{height: this.state.detailHeight}}>
        <Animated.View style={{opacity: this.state.detailOpacity, height: this.state.detailHeight,     position:'absolute', top:0}}>{details}</Animated.View>
        <Animated.View style={{opacity: this.state.buttonOpacity, height: this.state.mainBottomHeight, position:'absolute', top:0, overflow: 'hidden'}}>
          <Animated.View style={{width:screenWidth, flex:1, alignItems:'center'}}>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => {  }} style={{
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


  render() {
    return (
      <View style={{flex:1}}>
        <View style={{flex:0.8}} />
        { this.getRuleSentenceElements() }
        { this.getDetails() }
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

function getTheId(i) {
  let state = core.store.getState();
  let sphereIds = Object.keys(state.spheres);
  let activeSphere = sphereIds[0]

  let sphere = state.spheres[activeSphere];
  let locationIds = Object.keys(sphere.locations).sort();
  return locationIds[i];
}
