import {Languages} from "../../../../Languages"
import React, {Component, useState} from 'react';
import {Alert, Platform, Text, TextStyle, TouchableOpacity, View} from "react-native";
// import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import DateTimePicker from '@react-native-community/datetimepicker';

import {colors, screenWidth} from "../../../styles";
import Slider from '@react-native-community/slider';

import {FadeIn} from "../../../components/animated/FadeInView";
import {xUtil} from "../../../../util/StandAloneUtil";
import {AicoreBehaviour} from "../supportCode/AicoreBehaviour";
import {AicoreUtil} from "../supportCode/AicoreUtil";
import {AicoreTimeData} from "../supportCode/AicoreTimeData";


import UncontrolledDatePickerIOS from 'react-native-uncontrolled-date-picker-ios';
import {ScaledImage} from "../../../components/ScaledImage";
import {Icon} from "../../../components/Icon";
import {OverlaySaveButton} from "../../../overlays/ListOverlay";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AicoreTimeCustomization", key)(a,b,c,d,e);
}

let timeReference = null;


let headerStyle : TextStyle = {
  paddingLeft: 15,
  paddingRight: 15,
  fontSize: 16,
  fontWeight: "bold",
  color: colors.black.hex
};

export class AicoreTimeCustomization extends Component<any,any> {
  fromTime: AicoreTimeData = null;
  toTime: AicoreTimeData = null;

  constructor(props) {
    super(props);

    this.fromTime = new AicoreTimeData();
    let fromFinished = this.fromTime.insertAicoreTimeFrom(this.props.timeData);

    this.toTime = new AicoreTimeData();
    let toFinished = this.toTime.insertAicoreTimeTo(this.props.timeData);

    this.state = { fromFinished: fromFinished, toFinished: toFinished, instantEdit: fromFinished && toFinished };
  }

  render() {
    return (
      <View style={{flex:1, paddingLeft:15, paddingTop:10}}>
        <TimePart
          initialLabel={ lang("When_should_I_start_")}
          finalLabel={lang("Ill_start_at_")}
          visible={true}
          instantEdit={this.state.instantEdit}
          timeObj={this.fromTime}
          initiallyFinished={this.state.fromFinished}
          setFinished={(value) => {
            this.setState({fromFinished:value});
            if (this.state.toFinished) {
              this.props.setStoreButton(true, this.fromTime, this.toTime);
            }
          }}
        />
        {this.state.fromFinished ? <View style={{ height: 20 }} /> : undefined}
        <TimePart
          initialLabel={ lang("When_am_I_finished_")}
          finalLabel={ lang("This_behaviour_ends_at_")}
          visible={this.state.fromFinished}
          instantEdit={this.state.instantEdit}
          timeObj={this.toTime}
          initiallyFinished={this.state.toFinished}
          setFinished={(value) => {
            this.setState({toFinished:value});
            if (this.state.fromFinished) {
              this.props.setStoreButton(true, this.fromTime, this.toTime);
            }
          }}
        />
      </View>
    )
  }
}


function TimePart(props : {
  finalLabel:string,
  initialLabel:string,
  initiallyFinished: boolean,
  setFinished(value: boolean): void,
  timeObj: AicoreTimeData,
  visible: boolean,
  instantEdit: boolean,
}) {
  const [showTime, setShowTime] = useState(false);
  const [type, setType] = useState(props.timeObj.getType());
  const [ignoreInstantEdit, setIgnorInstantEdit] = useState(false);
  const [offsetMinutes, setOffsetMinutes] = useState(props.timeObj.getOffsetMinutes());
  const [finished, setFinished] = useState(props.initiallyFinished);
  const [time, setTime] = useState(props.timeObj.getTime());

  if (props.visible === false) {
    return <View />;
  }

  let elements = [];
  let timeStr = xUtil.capitalize(props.timeObj.getString());
  let index = 0;

  elements.push(<Text key={"header"} style={headerStyle}>{type === null ? props.initialLabel : props.finalLabel}</Text>);
  if (finished === false) {
    if (type === null) {
      elements.push(<TypeSelector timeObj={props.timeObj} key={"typeSelect"} callback={(value) => {setType(value);}} />)
    }
    else {
      switch (type) {
        case "SUNRISE":
        case "SUNSET":
          elements.push(<TimeSummary key={"startsAt"} label={timeStr} index={index++} type={type} callback={() => { setType(null); }} />);
          elements.push(
            <View key={"offsetSetup"} style={{ paddingTop: 5, flex:1 }}>
              <FadeIn index={index++}>
                <Text style={headerStyle}>{ lang("Exactly_or_with_an_offset_") }</Text>
              </FadeIn>
              <FadeIn index={index++} style={{marginTop:5}}>
                <View style={{ flexDirection: "row", justifyContent: 'flex-end', alignItems: 'center'}}>
                  <Text style={{ fontSize: 12, color: colors.gray.hex }}>{ lang("_h") }</Text>
                  <View style={{flex:1}}>
                    <Slider
                      style={{ height: 40 }}
                      minimumValue={-120}
                      maximumValue={120}
                      step={15}
                      value={Number(offsetMinutes) || 0}
                      minimumTrackTintColor={colors.gray.hex}
                      maximumTrackTintColor={colors.gray.hex}
                      onValueChange={(value) => {
                        props.timeObj.setOffsetMinutes(value);
                        setOffsetMinutes(value);
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 12, color: colors.gray.hex }}>{ lang("__h") }</Text>
                </View>
              </FadeIn>
              <View style={{ flex:1 }}/>
              <FadeIn index={index++}>
                <TextButton label={lang("Thats_a_good_time_")} basic={true} callback={() => {
                  setFinished(true);
                  props.setFinished(true);
                }}/>
              </FadeIn>
              { props.instantEdit && !ignoreInstantEdit ?
                <FadeIn index={index++}>
                  <TextButton label={ lang("I_want_something_else_")} basic={true} callback={() => {
                    setType(null);
                    setIgnorInstantEdit(true);
                  }}/>
                </FadeIn>
                : undefined }
            </View>
          );
          break;
        case "CLOCK":
          let sharedOther = (
            props.instantEdit && !ignoreInstantEdit ?
            <FadeIn index={index++}>
              <View style={{ marginLeft: 25 }}>
                <TextButton label={ lang("I_want_something_else_")} basic={true} callback={() => {
                  setType(null);
                  setIgnorInstantEdit(true);
                }}/>
              </View>
            </FadeIn>
            : undefined
          );
          if (Platform.OS === 'android') {
            let date = new Date();
            date.setHours(time.hours);
            date.setMinutes(time.minutes);
            const onChange = (event, date) => {
              let hours = date.getHours();
              let minutes = date.getMinutes();

              setTime({hours, minutes});
              props.timeObj.setTime(hours, minutes);
              setFinished(true);
              props.setFinished(true);
            }
            elements.push(
              <View key={"clockUI"}>
                <FadeIn index={index++}>
                  <TouchableOpacity style={{
                    height:100,
                    backgroundColor: colors.white.rgba(0.75),
                    padding:15,
                    alignItems:'flex-start'
                  }} onPress={() => {
                    setShowTime(true);

                      // let date = new Date();
                      // date.setHours(time.hours);
                      // date.setMinutes(time.minutes);
                      // DateTimePickerAndroid.open({
                      //   value: date,
                      //   mode:'time',
                      //   is24Hour: true,
                      //   onChange: (event, date) => {
                      //     let hours = date.getHours();
                      //     let minutes = date.getMinutes();
                      //
                      //     setTime({hours, minutes});
                      //     props.timeObj.setTime(hours, minutes);
                      //     setFinished(true);
                      //     props.setFinished(true);
                      //   }
                      // })
                  }}>
                    { showTime &&
                        <DateTimePicker
                          testID="dateTimePicker"
                          value={date}
                          mode={'time'}
                          is24Hour={true}
                          onChange={onChange}
                        />
                      }
                    <Text style={{fontSize:13, fontWeight: '200', color:colors.black.rgba(0.6)}}>{ lang("TAP_TIME_TO_CHANGE") }</Text>
                    <Text style={{fontSize:55, fontWeight: '500', color:colors.black.rgba(0.6)}}>
                      { time.hours + ":" + (time.minutes < 10 ? '0' + time.minutes : time.minutes) }
                    </Text>
                  </TouchableOpacity>
                </FadeIn>
                <TextButton
                  basic={true}
                  key={"resultButton" + index}
                  index={index}
                  label={ lang("Thats_a_good_time_")}
                  callback={() => {
                    setFinished(true);
                    props.setFinished(true);
                  }}
                />
                {sharedOther}
              </View>);
          }
          else {
            elements.push(
              <View key={"clockUI"} style={{flex:1}}>
                <FadeIn index={index++}>
                  <UncontrolledDatePickerIOS
                    ref={(x) => {
                      timeReference = x;
                    }}
                    date={new Date(new Date(new Date().setHours(time.hours)).setMinutes(time.minutes))}
                    mode="time"
                  />
                </FadeIn>
                <View style={{flex:1}} />
                <TextButton
                  key={"resultButton" + index}
                  index={index}
                  label={lang("Tap_to_select_time_")}
                  callback={() => {
                    timeReference.getDate((date) => {
                      let hours = date.getHours();
                      let minutes = date.getMinutes();

                      setTime({hours:hours, minutes: minutes});
                      props.timeObj.setTime(hours, minutes);

                      setFinished(true);
                      props.setFinished(true);
                    })
                  }}
                />
                { sharedOther }
              </View>
          );
          break;
        }
      }
    }
  }
  else {
    elements.push(
      <TimeSummary
        key={"startsAt"}
        label={timeStr}
        index={index++}
        type={type}
        callback={() => {
          if (!props.instantEdit) {
            setType(null);
          }
          setFinished(false); props.setFinished(false); }}
      />
    );
  }

  return (
    <View style={{flex: finished === false ? 1 : undefined}}>
      { elements }
    </View>
  )
}


function TimeSummary(props : any) {
  switch (props.type) {
    case "SUNRISE":
      return (
        <TimeButtonWithImage
          basic={true}
          index={props.index}
          label={props.label}
          image={require("../../../../../assets/images/icons/sunrise.png")}
          callback={props.callback}
        />
      );
      break;
    case "SUNSET":
      return (
        <TimeButtonWithImage
          basic={true}
          index={props.index}
          label={props.label}
          image={require("../../../../../assets/images/icons/sunset.png")}
          callback={props.callback}
        />
      );
      break;
    case "CLOCK":
      return (
        <TimeButtonWithImage
          basic={true}
          index={props.index}
          label={props.label}
          image={require("../../../../../assets/images/icons/clock.png")}
          callback={props.callback}
        />
      );
      break;
  }

  return <View />;
}



function TypeSelector(props) {
  let i = 0;
  return (
    <View>
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_sunrise___")}
        image={require("../../../../../assets/images/icons/sunrise.png")}
        callback={() => { props.timeObj.setSunrise(); props.callback("SUNRISE") }}
      />
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_sunset___")}
        image={require("../../../../../assets/images/icons/sunset.png")}
        callback={() => { props.timeObj.setSunset(); props.callback("SUNSET") }}
      />
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_a_specific_time___")}
        image={require("../../../../../assets/images/icons/clock.png")}
        callback={() => { props.timeObj.setClock(); props.callback("CLOCK") }}
      />
    </View>
  );
}


export function TimeButtonWithImage(props) {
  return (
    <FadeIn index={props.index || 0}>
      <TouchableOpacity
        style={{
          flexDirection:'row',
          margin:10,
          marginTop:5,
          marginBottom:5,
          paddingTop:10,
          paddingBottom:10,
          paddingRight:15,
          alignItems:'center',
        }}
        onPress={() => { props.callback(); }}
      >
        <ScaledImage source={props.image} sourceWidth={100} sourceHeight={100} targetWidth={40}/>
        <Icon name={"md-arrow-dropright"} color={colors.csBlue.hex} size={15} style={{padding:10}} />
        <Text style={{fontWeight:'bold', fontSize:16}} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.5}>{props.label}</Text>
      </TouchableOpacity>
    </FadeIn>
  );
}

export function TextButton(props) {
  return (
    <TouchableOpacity
      testID={props.testID}
      style={{flexDirection:'row',
        margin:10,
        marginTop:5,
        marginBottom:5,
        paddingTop:10,
        paddingBottom:10,
        paddingRight:15,
        alignItems:'center',
      }} onPress={() => { props.callback(); }}>
      { props.textAlign === "right" ? <View style={{flex:1}} /> : undefined }
      <Icon name={"md-arrow-dropright"} color={props.iconColor || props.textColor || colors.black.hex} size={15} style={{padding:10}} />
      <Text style={{color:  props.textColor, fontSize:16, fontWeight:'bold'}}>{props.label}</Text>
    </TouchableOpacity>
  );
}