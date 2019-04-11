
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  TouchableOpacity,
  ScrollView,
  Text,
  View, TextStyle, ViewStyle
} from "react-native";


import {
  availableScreenHeight,
  colors,
  deviceStyles,
  OrangeLine,
  screenWidth,
  styles
} from "../../../styles";
import { Background } from "../../../components/Background";
import { textStyle } from "./DeviceSmartBehaviour";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { core } from "../../../../core";
import { SELECTABLE_TYPE } from "../../../../Enums";
import { BehaviourConstructor } from "./SmartBehaviourLogic";
import { NavigationUtil } from "../../../../util/NavigationUtil";



export class DeviceSmartBehaviour_Editor extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "A Crownstone",
    }
  };

  constructor(props) {
    super(props)
  }


  render() {
    let iconHeight   = 0.10*availableScreenHeight;

    let rule : behaviour = {
      action:   { type: "BE_ON", fadeDuration: 0, data: 1, },
      presence: { type: "SOMEBODY", data: { type: "SPHERE" }, delay: 5},
      time: {
        type: "RANGE",
        from: { type: "SUNSET",  offsetMinutes:0},
        to:   { type: "SUNRISE", offsetMinutes:0}
      }
    }

    return (
      <Background image={core.background.detailsDark}>
        <OrangeLine/>
        <ScrollView style={{height:availableScreenHeight, width: screenWidth,}}>
          <View style={{ width: screenWidth, minHeight:availableScreenHeight, alignItems:'center', paddingBottom: 10 }}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ "Smart Behaviour" }</Text>
            <View style={{height: 0.2*iconHeight}} />
            <Text style={textStyle.specification}>{"Tap the underlined parts to customize them!"}</Text>
            <Rule data={rule} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}


/**
 *
 * I will be on if somebody is home between sundown and 23:00
 *
 * Ik zal aan zijn als er iemand thuis is tussen zonsondergang en 23:00
 * Ik zal aan zijn tussen zonsondergang en 23:00 zolang er iemand thuis is
 *
 *
 * I will fade to 100% in 30 minutes to be on from sundown until 22:00 as long as someone is the living room.
 *
 * Ik zal in de loop van 30 minuten 100% aan gaan zodat ik aan ben op zonsondergang tot 22:00, mits er iemand thuis is natuurlijk!
 *
 *
 */

export class Rule extends Component<{data:behaviour}, any> {
  references = [];
  amountOfLines = 0;
  rule;
  selectedChunk : behaviourChunk;

  constructor(props) {
    super(props);

    this.state = {
      detail:            null,
      detailHeight:      new Animated.Value(availableScreenHeight - 300),
      detailInnerHeight: new Animated.Value(availableScreenHeight - 300),
      detailOpacity:     new Animated.Value(0),
      buttonOpacity:     new Animated.Value(1),
    };

    this.rule = new BehaviourConstructor(this.props.data);
  }

  getElements() {
    this.amountOfLines = 0;

    let normal      : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.white.hex, fontSize:20, fontWeight:'bold', height:30  };
    let selectable  : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.white.hex, fontSize:20, fontWeight:'bold', height:30, textDecorationLine:'underline' };
    let segmentStyle : ViewStyle = {...styles.centered, flexDirection:'row', width: screenWidth};

    let rule = this.rule.getLogicChunks();

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

    rule.forEach((chunk,i) => {
      // refresh the selected chunk for the UI
      if (chunk.type === this.state.detail) { this.selectedChunk = chunk; }

      // hidden chunks are imply that they are not part of the sentence. We do however need their data for the selection.
      if (chunk.hidden) {
        // TODO: add suggestions?
        return;
      }

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

      for (let i = 0; i < words.length; i++) {
        let lastWordLength = 0;
        if (words[i]) {
          lastWordLength = getWordLength(words[i] + ' ')
          letterLengthOnLine += lastWordLength;
        }
        if (letterLengthOnLine > screenWidth - paddingForRules*2) {
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
      return;
    }

    let detailSelectedHeight = availableScreenHeight - 200 - this.amountOfLines*30;

    if (this.state.detail === null) {
      let animation = [];
      this.setState({detail: selectedBehaviourType});
      animation.push(Animated.timing(this.state.detailOpacity,     {toValue: 1, delay: 0,   duration: 100}));
      animation.push(Animated.timing(this.state.buttonOpacity,     {toValue: 0, delay: 100, duration: 100}));
      animation.push(Animated.timing(this.state.detailHeight,      {toValue: detailSelectedHeight, delay: 0, duration: 200}));
      animation.push(Animated.timing(this.state.detailInnerHeight, {toValue: detailSelectedHeight, delay: 0, duration: 200}));
      Animated.parallel(animation).start(() => { this.state.detailInnerHeight.setValue(0) })
    }
    else if (selectedBehaviourType === null) {
      let animation = [];
      this.state.detailInnerHeight.setValue(detailSelectedHeight);
      animation.push(Animated.timing(this.state.detailOpacity,     {toValue:0, delay:0, duration: 100}));
      animation.push(Animated.timing(this.state.buttonOpacity,     {toValue:1, delay:100, duration: 100}));
      animation.push(Animated.timing(this.state.detailInnerHeight, {toValue: availableScreenHeight - 300, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.detailHeight,      {toValue: availableScreenHeight - 300, delay:0, duration: 200}));
      Animated.parallel(animation).start(() => { this.setState({detail: selectedBehaviourType}); })
    }
    else {
      Animated.timing(this.state.detailOpacity, {toValue:0, delay:0, duration: 150}).start(() => {
        this.setState({detail: selectedBehaviourType}, () => {
          Animated.timing(this.state.detailOpacity, {toValue:1, delay:0, duration: 150}).start()
        })
      })
    }
  }

  _showDimAmountPopup() {
    let buttons = [];
    let genCallback = (amount) => { return () => {
      this.selectedChunk.changeAction(amount);
      this.forceUpdate();
    }}
    buttons.push({ text: "90%", callback: genCallback(0.9)});
    buttons.push({ text: "80%", callback: genCallback(0.8)});
    buttons.push({ text: "70%", callback: genCallback(0.7)});
    buttons.push({ text: "60%", callback: genCallback(0.6)});
    buttons.push({ text: "50%", callback: genCallback(0.5)});
    buttons.push({ text: "40%", callback: genCallback(0.4)});
    buttons.push({ text: "30%", callback: genCallback(0.3)});
    buttons.push({ text: "20%", callback: genCallback(0.2)});
    buttons.push({ text: "10%", callback: genCallback(0.1)});
    core.eventBus.emit('showPopup', {title: "How much should I dim?", buttons: buttons})
  }

  _showLocationSelectionPopup() {
    let buttons = [];
    let genCallback = (amount) => { return () => {
      this.selectedChunk.changeAction(amount);
      this.forceUpdate();
    }}
    buttons.push({ text: "90%", callback: genCallback(0.9)});
    buttons.push({ text: "80%", callback: genCallback(0.8)});
    buttons.push({ text: "70%", callback: genCallback(0.7)});
    buttons.push({ text: "60%", callback: genCallback(0.6)});
    buttons.push({ text: "50%", callback: genCallback(0.5)});
    buttons.push({ text: "40%", callback: genCallback(0.4)});
    buttons.push({ text: "30%", callback: genCallback(0.3)});
    buttons.push({ text: "20%", callback: genCallback(0.2)});
    buttons.push({ text: "10%", callback: genCallback(0.1)});
    core.eventBus.emit('showPopup', {title: "How much should I dim?", buttons: buttons})
  }


  getDetails() {
    let details = null;
    switch (this.state.detail) {
      case SELECTABLE_TYPE.ACTION:
        details = (
          <BehaviourList
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
                selectionCallback: () => { this._showDimAmountPopup(); }},
            ]}
          />
        );
        break;
      case SELECTABLE_TYPE.PRESENCE:
        details = (
          <BehaviourList
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
          <BehaviourList
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
                    this.selectedChunk.value.locationIds[0] == getTheId()
                },
                selectionCallback: () => {
                  this.selectedChunk.changeAction({
                    type:"LOCATION",
                    locationIds:[getTheId()]
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
                    ((this.selectedChunk.value.locationIds.length === 1 && this.selectedChunk.value.locationIds[0] != getTheId()) ||
                    this.selectedChunk.value.locationIds.length > 1)
                },
                selectionCallback: () => { this.selectedChunk.changeAction("LOCATION"); this.forceUpdate(); }
              },
            ]}
          />
        );
      case SELECTABLE_TYPE.TIME:
    }

    return (
      <Animated.View style={{height: this.state.detailHeight}}>
        <Animated.View style={{opacity: this.state.detailOpacity, height: this.state.detailHeight,      position:'absolute', top:0}}>{details}</Animated.View>
        <Animated.View style={{opacity: this.state.buttonOpacity, height: this.state.detailInnerHeight, position:'absolute', top:0, overflow: 'hidden'}}>{
          <Animated.View style={{width:screenWidth, flex:1, alignItems:'center'}}>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => {  }} style={{
              width:0.5*screenWidth, height:60, borderRadius:20,
              backgroundColor: colors.green.hex, alignItems:'center', justifyContent: 'center'
            }}>
              <Text style={{fontSize:16, fontWeight:'bold'}}>Use Behaviour!</Text>
            </TouchableOpacity>
          </Animated.View>}
        </Animated.View>
      </Animated.View>
    );
  }


  render() {
    return (
      <View style={{flex:1}}>
        <View style={{flex:0.8}} />
        { this.getElements() }
        { this.getDetails() }
      </View>
    );
  }
}

class BehaviourList extends Component<{
    closeLabel: string,
    closeCallback: () => void,
    explanation?: string,
    header: string,
    elements: behaviourListElement[]
  },any> {

  _getElements() {
    let elements = [];
    this.props.elements.forEach((el,i) => {
      elements.push(
        <TouchableOpacity key={"behaviourElement_"+ i} style={{
          flexDirection:'row',
          width: screenWidth, height:50,
          borderTopWidth:1, borderColor: colors.menuBackground.rgba(0.7),
          backgroundColor: el.isSelected() ? colors.green.hex : colors.white.rgba(0.8),
          alignItems:'center',
        }}
          onPress={() => { el.selectionCallback() }}>
          <Text style={{paddingLeft:15, fontSize:15}}>{el.label}</Text>
          {el.subLabel ? <View style={{flex:1}} /> : undefined}
          {el.subLabel ? <Text style={{paddingRight:15, fontSize:15, color: colors.black.rgba(0.2)}}>{el.subLabel}</Text> : undefined}
        </TouchableOpacity>
      )
    });

    return elements;
  }

  render() {
    return (

    <View style={{width:screenWidth, flex:1, alignItems:'center'}}>
      <View style={{flex:1}} />
      <Text style={textStyle.specification}>{this.props.header}</Text>

      { this._getElements() }

      <View style={{width: screenWidth, height:1, backgroundColor: colors.menuBackground.rgba(0.7)}} />

      { this.props.explanation ? <Text style={textStyle.explanation}>{this.props.explanation}</Text> : undefined }

      <View style={{flex:1}} />
      <TouchableOpacity
        onPress={this.props.closeCallback}
        style={{
          width:0.5*screenWidth, height:50, borderRadius:15,
          backgroundColor: colors.green.hex, alignItems:'center', justifyContent: 'center'
        }}>
        <Text style={{fontSize:15, fontWeight:'bold'}}>{this.props.closeLabel}</Text>
      </TouchableOpacity>
    </View>
    )
  }
}

function getWordLength(word) {
  let result = 0;
  let letterWidthMap = { I:4," ": 5, m:16, w:16, rest:11 };
  for (let i = 0; i < word.length; i++) {
    if (word[i]) {
      result += letterWidthMap[word[i]] || letterWidthMap.rest;
    }
  }
  return result;
}

function getTheId() {
  let state = core.store.getState();
  let sphereIds = Object.keys(state.spheres);
  let activeSphere = sphereIds[0]

  let sphere = state.spheres[activeSphere];
  let locationIds = Object.keys(sphere.locations).sort();
  return locationIds[0];
}