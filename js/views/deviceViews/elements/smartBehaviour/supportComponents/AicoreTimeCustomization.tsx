
import { Languages } from "../../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AicoreTimeCustomization", key)(a,b,c,d,e);
}
import React, { useState,Component } from 'react';
import {
  Alert,
  Text,
  View, TextStyle
} from "react-native";
import { colors, screenWidth} from "../../../../styles";
import Slider from '@react-native-community/slider';

import UncontrolledDatePickerIOS from 'react-native-uncontrolled-date-picker-ios';
import { FadeIn } from "../../../../components/animated/FadeInView";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { TextButtonDark, TimeButtonWithImage } from "../../../../components/InterviewComponents";
import { AicoreUtil } from "../supportCode/AicoreUtil";
import { AicoreTimeData } from "../supportCode/AicoreTimeData";


let timeReference = null;


let headerStyle : TextStyle = {
  paddingLeft: 15,
  paddingRight: 15,
  fontSize: 15,
  fontWeight: "bold",
  color: colors.csBlue.hex
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

    this.state = { fromFinished: fromFinished, toFinished: toFinished };
  }

  render() {
    return (
      <View style={{flex:1}}>
        <TimePart
          width={this.props.width}
          initialLabel={ lang("When_should_I_start_")}
          finalLabel={"I'll start at:"}
          visible={true}
          timeObj={this.fromTime}
          initiallyFinished={this.state.fromFinished}
          setFinished={(value) => {
            this.setState({fromFinished:value});
          }}
        />
        {this.state.fromFinished ? <View style={{ height: 20 }}/> : undefined}
        <TimePart
          width={this.props.width}
          initialLabel={ lang("When_am_I_finished_")}
          finalLabel={ lang("This_behaviour_ends_at_")}
          visible={this.state.fromFinished}
          timeObj={this.toTime}
          initiallyFinished={this.state.toFinished}
          setFinished={(value) => {
            this.setState({toFinished:value});
          }}
        />
        <View style={{ flex: 1 }}/>
        {this.state.toFinished && this.state.fromFinished ? <TimeButtonWithImage
            label={ lang("Looks_good_")}
            TimeButtonWithImage
            image={require("../../../../../images/icons/timeIcon.png")}
            callback={() => {
              if (AicoreUtil.isSameTime(this.fromTime, this.toTime)) {
                Alert.alert(
lang("_The_start_and_ending_time_header"),
lang("_The_start_and_ending_time_body"),
[{text:lang("_The_start_and_ending_time_left")}])
              }
              else {
                let tempBehaviour = new AicoreBehaviour();
                tempBehaviour.insertTimeDataFrom(this.fromTime);
                tempBehaviour.insertTimeDataTo(this.toTime);
                this.props.save(tempBehaviour.getTime());
              }
            }}/>
          : undefined}
        <View style={{ height: 5 }}/>
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
  width: number,
}) {
  const [type, setType] = useState(props.timeObj.getType());
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
            <View key={"offsetSetup"} style={{ paddingTop: 5 }}>
              <FadeIn index={index++}>
                <Text style={headerStyle}>{ lang("Exactly_or_with_an_offset_") }</Text>
              </FadeIn>
              <View style={{ height: 5 }}/>
              <FadeIn index={index++}>
                <View style={{ flexDirection: "row", justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: colors.gray.hex }}>{ lang("__h") }</Text>
                  <View>
                    <Slider
                      style={{ width: props.width - 0.06 * screenWidth - 75 - 20, height: 40 }}
                      minimumValue={-120}
                      maximumValue={120}
                      step={15}
                      value={offsetMinutes || 0}
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
              <FadeIn index={index++}>
                <View style={{ marginLeft: 25 }}>
                  <TextButtonDark label={"That's a good time!"} basic={true} callback={() => {
                    setFinished(true);
                    props.setFinished(true);
                  }}/>
                </View>
              </FadeIn>
            </View>
          );
          break;
        case "CLOCK":
          elements.push(
            <View key={"clockUI"}>
              <FadeIn index={index++}>
                <UncontrolledDatePickerIOS
                  ref={(x) => {
                    timeReference = x;
                  }}
                  date={new Date(new Date(new Date().setHours(time.hours)).setMinutes(time.minutes))}
                  mode="time"
                  style={{ height: 210 }}
                />
              </FadeIn>
              <TimeButtonWithImage
                basic={true}
                key={"resultButton" + index}
                index={index}
                label={ lang("Tap_to_select_time_")}
                image={require("../../../../../images/icons/clock.png")}
                callback={() => {
                  timeReference.getDate((date) => {
                    let hours = date.getHours();
                    let minutes = date.getMinutes();
                    setTime({hours:hours, minutes:minutes});
                    props.timeObj.setTime(hours, minutes);
                    setFinished(true);
                    props.setFinished(true);
                  });
                }}
              />
            </View>
          );
          break;
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
        callback={() => { setType(null); setFinished(false); props.setFinished(false); }}
      />
    );
  }

  return (
    <View>
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
          image={require("../../../../../images/icons/sunrise.png")}
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
          image={require("../../../../../images/icons/sunset.png")}
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
          image={require("../../../../../images/icons/clock.png")}
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
        image={require("../../../../../images/icons/sunrise.png")}
        callback={() => { console.log(props); props.timeObj.setSunrise(); props.callback("SUNRISE") }}
      />
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_sunset___")}
        image={require("../../../../../images/icons/sunset.png")}
        callback={() => { props.timeObj.setSunset(); props.callback("SUNSET") }}
      />
      <TimeButtonWithImage
        basic={true}
        index={i++}
        label={ lang("At_a_specific_time___")}
        image={require("../../../../../images/icons/clock.png")}
        callback={() => { props.timeObj.setClock(); props.callback("CLOCK") }}
      />
    </View>
  );
}

