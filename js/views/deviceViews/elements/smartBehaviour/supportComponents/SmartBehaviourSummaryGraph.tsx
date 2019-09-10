
import { Languages } from "../../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SmartBehaviourSummaryGraph", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Image,
  Text, TextStyle,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Icon } from "../../../../components/Icon";
import { colors, screenWidth } from "../../../../styles";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { core } from "../../../../../core";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";
import { AicoreUtil } from "../supportCode/AicoreUtil";
import { AlternatingContent } from "../../../../components/animated/AlternatingContent";
const SunCalc = require('suncalc');

export class SmartBehaviourSummaryGraph extends Component<any, any> {
  id;
  constructor(props) {
    super(props);

    this.id = xUtil.getShortUUID();
  }

  render() {
    let ruleIds = Object.keys(this.props.rules);
    let onArray = [];
    let presenceArray = [];
    let twilightArray = [];

    ruleIds.forEach((ruleId) => {
      let rule = this.props.rules[ruleId];
      let ai;
      if (rule.type === "BEHAVIOUR") {
        ai = new AicoreBehaviour(rule.data);
        if (ai.isUsingPresence()) {
          presenceArray.push({start: ai.getFromTimeString(this.props.sphereId), end: ai.getToTimeString(this.props.sphereId), endsWithOption: !ai.hasNoOptions(), partial: this.props.partiallyActiveRuleIdMap[ruleId] || false})
        }
        else {
          onArray.push({start: ai.getFromTimeString(this.props.sphereId), end: ai.getToTimeString(this.props.sphereId), partial: this.props.partiallyActiveRuleIdMap[ruleId] || false})
        }

        if (!ai.hasNoOptions()) {
          presenceArray.push({start: ai.getToTimeString(this.props.sphereId), end: AicoreUtil.getTimeStrInTimeFormat({ type: "SUNRISE", offsetMinutes: 0}, this.props.sphereId), option:true, partial: this.props.partiallyActiveRuleIdMap[ruleId] || false})
        }
      }
      else if (rule.type === "TWILIGHT") {
        ai = new AicoreTwilight(rule.data);
        twilightArray.push({start: ai.getFromTimeString(this.props.sphereId), end: ai.getToTimeString(this.props.sphereId), partial: this.props.partiallyActiveRuleIdMap[ruleId] || false})
      }
    });

    return (
      <View style={{flexDirection:'row', width:screenWidth, height:90, overflow:'hidden'}}>
        <View style={{flex:1}} />
        <TouchableWithoutFeedback style={{width:screenWidth*0.8, height:90}} onPress={() => { core.eventBus.emit("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH"+this.id)}}>
          <View style={{width:screenWidth*0.8, height:90}}>
            <DayNightIndicator id={this.id} />
            <View style={{position:'absolute', left:0, top:15, width:screenWidth*0.8, height:75}}>
              <SmartBehaviourSummaryGraphElement dataColor={colors.green}       icon={'md-power'}        iconSize={17} times={onArray}       id={this.id} explanation={ lang("When_I_will_be_on_")} />
              <SmartBehaviourSummaryGraphElement dataColor={colors.csBlueDark}  icon={'c1-locationPin1'} iconSize={14} times={presenceArray} id={this.id} explanation={"When I'll be on based on presence."} />
              <SmartBehaviourSummaryGraphElement dataColor={colors.blinkColor2} icon={'ios-leaf'}        iconSize={17} times={twilightArray} id={this.id} explanation={ lang("When_twilight_mode_is_acti")} />
            </View>
            <TimeSelector id={this.id} />
          </View>
        </TouchableWithoutFeedback>
        <View style={{flex:1}} />
      </View>
    )
  }
}



class SmartBehaviourSummaryGraphElement extends Component<any, any> {
  padding = 5;
  lineHeight = 10;
  itemHeight = 18;
  iconWidth = 18;
  keyCount = 0;

  explanationVisible = false;
  unsubscribe = null;
  width = null;

  constructor(props) {
    super(props);

    this.width = screenWidth*0.8 - this.iconWidth - this.padding;

    this.state = {
      explanationOpacity: new Animated.Value(0),
      explanationWidth:   new Animated.Value(0),
    }

  }

  componentDidMount(): void {
    this.unsubscribe = core.eventBus.on("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH" + this.props.id, () => { this.toggleExplanation() })
  }

  componentWillUnmount(): void {
    this.unsubscribe()
  }


  toggleExplanation() {
    if (this.explanationVisible) {
      // hide
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 0, delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: 0, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = false; });
    }
    else {
      // show
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 1,          delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: this.width, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = true; });
    }
  }

  getSubItem(startMinutes, endMinutes, isOption) {
    let width = this.width;

    let startX = width * startMinutes / (24*60);
    let endX   = width * endMinutes   / (24*60);

    return (
      <View key={this.keyCount++}
        style={{
        position:        'absolute',
        top:             0.5*(this.itemHeight-this.lineHeight) - 2,
        left:            this.iconWidth + this.padding + startX,
        width:           endX - startX,
        height:          this.lineHeight + 4,
        borderRadius:    0.5*this.lineHeight + 2,
        backgroundColor:     colors.white.hex,
        overflow:        'hidden',
        alignItems:'center',
        justifyContent:'center',
      }}>
        <View key={this.keyCount++}
          style={{
            width:           endX - startX - 4,
            height:          this.lineHeight,
            borderRadius:    0.5*this.lineHeight,
            backgroundColor: this.props.dataColor.hex,
            overflow:        'hidden',
            opacity:         isOption? 0.5 : 1.0
          }}>
          { isOption ? <Image source={require("../../../../../images/patterns/csBlueStripe.png")} style={{width:endX - startX, height:this.lineHeight}} resizeMode={"repeat"} /> : null}
        </View>
      </View>
    )
  }

  getItem(itemData) {
    let startMinutes = getMinutes(itemData.start);
    let endMinutes = getMinutes(itemData.end);

    if (endMinutes < startMinutes) {

      if (itemData.partial) {
        return [
          this.getSubItem(getMinutes("00:00"), endMinutes, itemData.option),
        ]
      }
      else {
        // we need 2 parts
        return [
          this.getSubItem(startMinutes, getMinutes("24:00"), itemData.option),
          this.getSubItem(getMinutes("00:00"), endMinutes, itemData.option),
        ]
      }
    }
    if (!itemData.partial) {
      if (endMinutes == startMinutes) {
        return [this.getSubItem(getMinutes("00:00"), getMinutes("24:00"), itemData.option)]
      } else {
        return [this.getSubItem(startMinutes, endMinutes, itemData.option)]
      }
    }

  }

  getElements() {
    this.keyCount = 0;
    let elements = [];

    this.props.times.forEach((time) => {
      elements = elements.concat(this.getItem(time))
    });

    return elements
  }

  render() {
    return (
      <View style={{flexDirection:'row', height: this.itemHeight, alignItems:'center',}}>
        <View style={{alignItems:'center', justifyContent:'center', width: this.iconWidth, height:this.itemHeight}}>
          <Icon name={this.props.icon} size={this.props.iconSize} color={colors.csBlueDark.hex} />
        </View>
        <View style={{
          position: 'absolute', top: 0.5*(this.itemHeight-this.lineHeight), left: this.iconWidth + this.padding,
          width: this.width, height: this.lineHeight,
          borderRadius: 0.5*this.lineHeight,
          backgroundColor:colors.csBlue.rgba(0.1)
        }} />
        {this.getElements()}
        <Animated.View style={{
          position:'absolute',
          left: this.iconWidth + this.padding,
          top:2,
          width: this.state.explanationWidth,
          height: this.itemHeight - 3,
          borderRadius: 0.5*(this.itemHeight - 3),
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity
        }}>
          <Text style={explanationStyle(this.width)}>{this.props.explanation}</Text>
        </Animated.View>
      </View>
    )
  }
}


class TimeSelector extends Component<any, any> {
  explanationVisible = false;
  unsubscribe = null;
  width = null;

  constructor(props) {
    super(props);

    this.width = 50;

    this.state = {
      explanationOpacity: new Animated.Value(0),
      timeOpacity:        new Animated.Value(1),
      explanationWidth:   new Animated.Value(0),
    }
  }

  componentDidMount(): void {
    this.unsubscribe = core.eventBus.on("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH" + this.props.id, () => { this.toggleExplanation() })
  }

  componentWillUnmount(): void {
    this.unsubscribe()
  }


  toggleExplanation() {
    if (this.explanationVisible) {
      // hide
      let animations = [];
      animations.push(Animated.timing(this.state.timeOpacity,        {toValue: 1, delay:50, duration:200}));
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 0, delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: 0, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = false; });
    }
    else {
      // show
      let animations = [];
      animations.push(Animated.timing(this.state.timeOpacity,        {toValue: 0.2,        delay:50,  duration:200}));
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 1,          delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: this.width, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = true; });
    }
  }


  render() {
    let width = 0.8*screenWidth - 25;
    let time = AicoreUtil.getClockTimeStr(new Date().getHours(), new Date().getMinutes());

    return (
      <View style={{position:'absolute', top:0, left: 25, width:width, height:90}}>
        <View style={{position:'absolute', top:0, left: width*(getMinutes(time)/(24*60)) - 20, width:40, height:12, alignItems:'center', justifyContent: 'center'}}>
          <Text style={{fontSize:10, color:colors.csBlueDark.hex}}>{time}</Text>
        </View>
        <Animated.View style={{position:'absolute', top:0, left: width*(getMinutes(time)/(24*60)) - 20,
          width: this.state.explanationWidth, height:15,
          borderRadius: 8,
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity,
          alignItems:'center', justifyContent: 'center'}}>
          <Text style={explanationStyle(this.width)}>{ lang("Now") }</Text>
        </Animated.View>
        <Animated.View style={{position:'absolute', top:14, left: width*(getMinutes(time)/(24*60)) - 2, width:5, height:58, opacity: this.state.timeOpacity, borderRadius:2, backgroundColor: colors.csBlue.rgba(0.1)}} />
        <Animated.View style={{position:'absolute', top:15, left: width*(getMinutes(time)/(24*60)),     width:1, height:56, opacity: this.state.timeOpacity, backgroundColor: colors.white.hex}} />
      </View>
    )
  }
}

class DayNightIndicator extends Component<any, any> {
  explanationVisible = false;
  unsubscribe = null;
  width = null;

  constructor(props) {
    super(props);

    this.width = 64;

    this.state = {
      explanationOpacity: new Animated.Value(0),
      explanationWidth: new Animated.Value(0),
    }

  }

  componentDidMount(): void {
    this.unsubscribe = core.eventBus.on("TOUCHED_SMART_BEHAVIOUR_SUMMARY_GRAPH" + this.props.id, () => { this.toggleExplanation() })
  }

  componentWillUnmount(): void {
    this.unsubscribe()
  }


  toggleExplanation() {
    if (this.explanationVisible) {
      // hide
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 0, delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: 0, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = false; });
    }
    else {
      // show
      let animations = [];
      animations.push(Animated.timing(this.state.explanationOpacity, {toValue: 1,          delay:10, duration:200}));
      animations.push(Animated.timing(this.state.explanationWidth,   {toValue: this.width, delay:0,  duration:200}));
      Animated.parallel(animations).start(() => { this.explanationVisible = true; });
    }
  }

  render() {
    let width = 0.8*screenWidth - 25;

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];

    // position of Crownstone HQ.
    let lat = 51.923611570463152;
    let lon = 4.4667693378575288;
    if (sphere) {
      lat = sphere.state.latitude || lat;
      lon = sphere.state.longitude || lon;
    }
    var times = SunCalc.getTimes(new Date(), lat, lon);

    let sunriseTime = new Date(times.sunriseEnd).valueOf();
    let sunsetTime  = new Date(times.sunset).valueOf();

    let sunriseTimeStr = AicoreUtil.getClockTimeStr(new Date(sunriseTime).getHours(), new Date(sunriseTime).getMinutes());
    let sunsetTimeStr = AicoreUtil.getClockTimeStr(new Date(sunsetTime).getHours(), new Date(sunsetTime).getMinutes());

    let dawnLeft = width*(getMinutes(sunriseTimeStr)/(24*60));
    let duskLeft = width*(getMinutes(sunsetTimeStr) /(24*60));


    return (
      <View style={{position:'absolute', top:0, left: 24, width:width, height:90}}>
        <View style={{position:'absolute', top:31, left: dawnLeft - 1, width:1, height:4, backgroundColor: colors.csBlue.rgba(0.5)}} />
        <View style={{position:'absolute', top:31, left: duskLeft,     width:1, height:4, backgroundColor: colors.csBlue.rgba(0.5)}} />
        <View style={{position:'absolute', top:49, left: dawnLeft - 1, width:1, height:4, backgroundColor: colors.csBlue.rgba(0.5)}} />
        <View style={{position:'absolute', top:49, left: duskLeft,     width:1, height:4, backgroundColor: colors.csBlue.rgba(0.5)}} />
        <View style={{position:'absolute', top:67, left: dawnLeft - 1, width:1, height:4, backgroundColor: colors.csBlue.rgba(0.5)}} />
        <View style={{position:'absolute', top:67, left: duskLeft,     width:1, height:4, backgroundColor: colors.csBlue.rgba(0.5)}} />
        <View style={{position:'absolute', top:72, left: dawnLeft - 14, width:30, height:20, alignItems:'center', justifyContent: 'center'}}>
          <Icon name={"c1-sunrise"} size={20} color={colors.csBlueDark.hex} />
        </View>
        <View style={{position:'absolute', top:72, left: duskLeft - 15, width:30, height:20, alignItems:'center', justifyContent: 'center'}}>
          <Icon name={"ios-cloudy-night"} size={18} color={colors.csBlueDark.hex} />
        </View>
        <Animated.View style={{
          position:'absolute', top:73, left: dawnLeft - 32,
          width: this.state.explanationWidth, height:15,
          borderRadius: 8,
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity
        }}>
          <AlternatingContent  style={{height:15, width: this.width}} contentArray={[
            <Text style={explanationStyle(this.width, 'center')}>{ lang("Sunrise") }</Text>,
            <Text style={explanationStyle(this.width, 'center')}>{sunriseTimeStr}</Text>,
          ]}/>
        </Animated.View>
        <Animated.View style={{
          position:'absolute', top:73, left: duskLeft - 32,
          width: this.state.explanationWidth, height:15,
          borderRadius: 8,
          backgroundColor:colors.white.hex,
          opacity: this.state.explanationOpacity
        }}>
          <AlternatingContent style={{height:15, width: this.width}} contentArray={[
            <Text style={explanationStyle(this.width,'center')}>{ lang("Sunset") }</Text>,
            <Text style={explanationStyle(this.width,'center')}>{sunsetTimeStr}</Text>,
          ]}/>
        </Animated.View>
      </View>
    )
  }
}

function getMinutes(timeString) {
  // this is for times like 14:00
  if (!timeString) {
    return 0
  }
  let elements = timeString.split(":");
  return Number(elements[0]) * 60 + Number(elements[1])
}

const explanationStyle = (width, alignment = "left") : TextStyle => {
  return {
    color: colors.csBlue.hex,
    fontWeight: 'bold',
    fontSize: 12,
    width: width,
    paddingLeft: alignment === 'center' ? 0 : 10,
    textAlign:   alignment === 'center' ? "center" : "left"
  }
};
