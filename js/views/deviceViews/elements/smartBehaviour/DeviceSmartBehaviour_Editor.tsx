
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
  View, TextStyle
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
import {
  AICORE_LOCATIONS_TYPES,
  AICORE_PRESENCE_TYPES,
  AICORE_TIME_DETAIL_TYPES,
  AICORE_TIME_TYPES,
  SELECTABLE_TYPE
} from "../../../../Enums";



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

    return (
      <Background image={core.background.detailsDark}>
        <OrangeLine/>
        <ScrollView style={{height:availableScreenHeight, width: screenWidth,}}>
          <View style={{ width: screenWidth, minHeight:availableScreenHeight, alignItems:'center', paddingBottom: 10 }}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ "Smart Behaviour" }</Text>
            <View style={{height: 0.2*iconHeight}} />
            <Text style={textStyle.specification}>{"Tap the underlined parts to customize them!"}</Text>
            <Rule />
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

export class Rule extends Component<any, any> {
  references = [];
  amountOfLines = 0;
  rule;

  constructor(props) {
    super(props);

    this.state = {
      detail:            null,
      detailHeight:      new Animated.Value(availableScreenHeight - 300),
      detailInnerHeight: new Animated.Value(availableScreenHeight - 300),
      detailOpacity:     new Animated.Value(0),
      buttonOpacity:     new Animated.Value(1),

      switchState: null,
      presence:    null,
      location:    null,
      time:        null,
    };

    this.rule = {};
  }

  getElements() {
    this.amountOfLines = 0;

    let normal      : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.white.hex, fontSize:20, fontWeight:'bold', height:30  };
    let selectable  : TextStyle = {textAlign:"center", lineHeight: 30, color: colors.white.hex, fontSize:20, fontWeight:'bold', height:30, textDecorationLine:'underline' };
    let segmentStyle = {...styles.centered, width: screenWidth};

    let d = [
      // {label: "I will be ",              clickable: false, type: true},
      // {label: "on",                      clickable: true , type: DETAIL_TYPES.SWITCH_STATE },
      // {label: " if ",                    clickable: false, type: true},
      // {label: "somebody",                clickable: true , type: DETAIL_TYPES.PRESENCE },
      // {label: " is ",                    clickable: false, type: true},
      // {label: "home",                    clickable: true , type: DETAIL_TYPES.LOCATION },
      // {label: " ",                       clickable: false, type: true},
      // {label: "between 15:00 and 23:00", clickable: true , type: DETAIL_TYPES.TIME },
      // {label: ".",                       clickable: false, type: true},
    ];

    let segments = [];
    let result = [];
    let letterWidth = 9;
    let amountOfLettersInScreenWidth = Math.floor((segmentStyle.width)/letterWidth);
    let totalLettersOnLine = 0;
    d.forEach((behaviour,i) => {

      totalLettersOnLine += behaviour.label.length;

      if (totalLettersOnLine > amountOfLettersInScreenWidth) {
        totalLettersOnLine = 0;
        result.push(<View key={i + "_1"} style={segmentStyle}>{segments}</View>);
        this.amountOfLines++;
        segments = [];
      }
      if (behaviour.clickable) {
        segments.push(<TouchableOpacity key={i + "_2"} onPress={() => {
          this.toggleDetails(behaviour.type)
        }}><Text style={[selectable, {color: this.state.detail === behaviour.type ? colors.green.hex : colors.white.hex}]}>{behaviour.label}</Text></TouchableOpacity>)
      }
      else {
        segments.push(<View key={i + "_3"}><Text  style={normal}>{behaviour.label}</Text></View>)
      }
    });

    if (segments.length > 0) {
      result.push(<View style={segmentStyle}>{segments}</View>);
      this.amountOfLines++;
    }

    return result;
  }


  getDetails() {
    let details = null;
    switch (this.state.detail) {
      case SELECTABLE_TYPE.ACTION:
        details = (
          <View style={{width:screenWidth, flex:1, alignItems:'center'}}>
            <View style={{flex:1}} />
            <Text style={textStyle.specification}>What should I be?</Text>
            <TouchableOpacity style={{
              width: screenWidth, height:50,
              borderTopWidth:1, borderColor: colors.menuBackground.hex,
              backgroundColor: colors.green.hex,
              justifyContent:'center',
            }}>
              <Text style={{paddingLeft:15, fontSize:15}}>On</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              width: screenWidth, height:50,
              borderTopWidth:1, borderColor: colors.menuBackground.hex,
              backgroundColor: colors.white.rgba(0.8),
              alignItems:'center', flexDirection: "row"
            }}>
              <Text style={{paddingLeft:15, fontSize:15}}>Dimmed to 50%</Text>
              <View style={{flex:1}} />
              <Text style={{paddingRight:15, fontSize:15, color: colors.black.rgba(0.2)}}>(tap to change)</Text>
            </TouchableOpacity>
            <View style={{width: screenWidth, height:1, backgroundColor: colors.menuBackground.hex,}} />
            <Text style={textStyle.explanation}>My behaviour defines when I should be on. I will be off when I should not be on.</Text>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => { this.toggleDetails(null); }} style={{
              width:0.5*screenWidth, height:50, borderRadius:15,
              backgroundColor: colors.green.hex, alignItems:'center', justifyContent: 'center'
            }}>
              <Text style={{fontSize:15, fontWeight:'bold'}}>Sounds about right!</Text>
            </TouchableOpacity>
          </View>
        );
        break;
      case SELECTABLE_TYPE.PRESENCE:
        details = (
          <View style={{width:screenWidth, flex:1, alignItems:'center'}}>
            <View style={{flex:1}} />
            <Text style={textStyle.specification}>Who shall I look for?</Text>
            <TouchableOpacity style={{
              width: screenWidth, height:50,
              borderTopWidth:1, borderColor: colors.menuBackground.hex,
              backgroundColor: colors.green.hex,
              justifyContent:'center',
            }}>
              <Text style={{paddingLeft:15, fontSize:15}}>Somebody</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              width: screenWidth, height:50,
              borderTopWidth:1, borderColor: colors.menuBackground.hex,
              backgroundColor: colors.white.rgba(0.8),
              alignItems:'center', flexDirection: "row"
            }}>
              <Text style={{paddingLeft:15, fontSize:15}}>Nobody</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              width: screenWidth, height:50,
              borderTopWidth:1, borderColor: colors.menuBackground.hex,
              backgroundColor: colors.white.rgba(0.8),
              alignItems:'center', flexDirection: "row"
            }}>
              <Text style={{paddingLeft:15, fontSize:15}}>Ignore presence</Text>
            </TouchableOpacity>
            <View style={{width: screenWidth, height:1, backgroundColor: colors.menuBackground.hex,}} />
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => { this.toggleDetails(null); }} style={{
              width:0.5*screenWidth, height:50, borderRadius:15,
              backgroundColor: colors.green.hex, alignItems:'center', justifyContent: 'center'
            }}>
              <Text style={{fontSize:15, fontWeight:'bold'}}>Thats it!</Text>
            </TouchableOpacity>
          </View>
        );
        break;
      case SELECTABLE_TYPE.LOCATION:
      case SELECTABLE_TYPE.TIME:
    }

    return (
      <Animated.View style={{height: this.state.detailHeight}}>
        <Animated.View style={{opacity: this.state.detailOpacity, height: this.state.detailHeight, position:'absolute', top:0}}>{details}</Animated.View>
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

  toggleDetails(nextType) {
    if (this.state.detail === nextType) {
      return;
    }

    let detailSelectedHeight = availableScreenHeight - 200 - this.amountOfLines*30;

    if (this.state.detail === null) {
      let animation = [];
      this.setState({detail: nextType});
      animation.push(Animated.timing(this.state.detailOpacity,     {toValue: 1, delay: 0,   duration: 100}));
      animation.push(Animated.timing(this.state.buttonOpacity,     {toValue: 0, delay: 100, duration: 100}));
      animation.push(Animated.timing(this.state.detailHeight,      {toValue: detailSelectedHeight, delay: 0, duration: 200}));
      animation.push(Animated.timing(this.state.detailInnerHeight, {toValue: detailSelectedHeight, delay: 0, duration: 200}));
      Animated.parallel(animation).start(() => { this.state.detailInnerHeight.setValue(0) })
    }
    else if (nextType === null) {
      let animation = [];
      this.state.detailInnerHeight.setValue(detailSelectedHeight);
      animation.push(Animated.timing(this.state.detailOpacity,     {toValue:0, delay:0, duration: 100}));
      animation.push(Animated.timing(this.state.buttonOpacity,     {toValue:1, delay:100, duration: 100}));
      animation.push(Animated.timing(this.state.detailInnerHeight, {toValue:availableScreenHeight - 300, delay:0, duration: 200}));
      animation.push(Animated.timing(this.state.detailHeight,      {toValue: availableScreenHeight - 300, delay:0, duration: 200}));
      Animated.parallel(animation).start(() => { this.setState({detail: nextType}); })
    }
    else {
      Animated.timing(this.state.detailOpacity, {toValue:0, delay:0, duration: 150}).start(() => {
        this.setState({detail: nextType}, () => {
          Animated.timing(this.state.detailOpacity, {toValue:1, delay:0, duration: 150}).start()
        })
      })
    }
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


class BehaviourConstructor {
  ruleDescription : behaviour;
  store: any;

  constructor(behaviour: behaviour, store) {
    this.ruleDescription = behaviour;
    this.store = store;
  }

  getSentence() {
    let sentence = "";

    let starterStr = null;
    if (this.ruleDescription.action.data < 1) {
      starterStr = "I will be dimmed at " + Math.round(this.ruleDescription.action.data * 100) + "% ";
    }
    else if (this.ruleDescription.action.data == 1) {
      starterStr = "I will be on ";
    }

    let presenceStr = null;
    let presence = this.ruleDescription.presence;
    switch (presence.type) {
      case AICORE_PRESENCE_TYPES.SOMEBODY:
        presenceStr = "somebody"; break;
      case AICORE_PRESENCE_TYPES.NOBODY:
        presenceStr = "nobody"; break;
      case AICORE_PRESENCE_TYPES.SPECIFIC_USERS:
        presenceStr = null; break; // TODO: implement profiles
      case AICORE_PRESENCE_TYPES.IGNORE:
        presenceStr = null; break;
    }

    let locationPrefixStr = "";
    let locationStr       = "";
    if (presence.type !== AICORE_PRESENCE_TYPES.IGNORE) {
      // @ts-ignore
      let pd = presence.data as aicorePresenceData;

      switch (presence.type) {
        case AICORE_LOCATIONS_TYPES.SPHERE:
          locationPrefixStr = " is ";
          locationStr = "home";
        case AICORE_LOCATIONS_TYPES.LOCATION:
          if (pd.locationIds.length > 0) {
            locationPrefixStr = " is in the ";
            // we will now construct a roomA_name, roomB_name or roomC_name line.
            locationStr += this._getLocationName(pd.locationIds[0]);
            if (pd.locationIds.length > 1) {
              for (let i = 1; i < pd.locationIds.length - 1; i++) {
                let locationCloudId = pd.locationIds[i];
                let locationName = this._getLocationName(locationCloudId);
                locationStr += ", " + locationName;
              }

              locationStr += " or " + this._getLocationName(pd.locationIds[pd.locationIds.length]);
            }
          }
      }
    }

    let timePrefixStr = "";
    let timeStr = "";

/*
  from 22:22 until sunrise                    // specific - sunrise
  from 22:22 until 60 minutes after  sunrise  // specific - sunrise + offset
  from 22:22 until 60 minutes before sunrise  // specific - sunrise - offset
  from 22:22 until sunset                     // specific - sunset
  from an hour before sunset until sunrise    // sunset   - sunrise
  from sunrise to 15:00                       // sunrise  - specific
  from sunset to 4:00                         // sunset   - specific

  between 22:22 and 11:22                     // specific - specific

  when its dark outside                       // sunset   - sunrise
  while the sun is up                         // sunrise  - sunset
 */


    let time = this.ruleDescription.time;
    if (time.type != AICORE_TIME_TYPES.ALWAYS) {
      // @ts-ignore
      let tr = time as aicoreTimeRange;

      if ((tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.from.type === AICORE_TIME_DETAIL_TYPES.SUNSET) &&
          (tr.to.type   === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.to.type   === AICORE_TIME_DETAIL_TYPES.SUNSET) &&
          ((tr.from as aicoreTimeDataSun).offsetMinutes === 0) && ((tr.to as aicoreTimeDataSun).offsetMinutes === 0)) {
          // this is either "when its dark outside" or "while the sun is up"
      }
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && tr.to.type === AICORE_TIME_DETAIL_TYPES.CLOCK) {
        // this makes "between X and Y"
      }
      else if (tr.from.type === AICORE_TIME_DETAIL_TYPES.CLOCK && (tr.to.type   === AICORE_TIME_DETAIL_TYPES.SUNRISE || tr.to.type   === AICORE_TIME_DETAIL_TYPES.SUNSET)) {
        // this makes "from xxxxx until xxxxx"
      }
      else {
        // these are "from xxxxx to xxxxx"
      }
    }
  }

  _getLocationName(locationCloudId) {
    let localId = MapProvider.cloud2localMap[locationCloudId];
  }

}