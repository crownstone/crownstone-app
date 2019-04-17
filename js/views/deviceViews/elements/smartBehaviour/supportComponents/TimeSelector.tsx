import React, { useState, Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle
} from "react-native";
import { availableScreenHeight, colors, deviceStyles, screenWidth, styles } from "../../../../styles";
import { ScaledImage } from "../../../../components/ScaledImage";
import { Separator } from "../../../../components/Separator";
import { Dropdown } from "../../../../components/editComponents/Dropdown";



export function TimeSelector(props) {
  const [fromType, setFromType] = useState(null);
  const [fromData, setFromData] = useState(null);

  const [toType, setToType] = useState(null);
  const [toData, setToData] = useState(null);


  let fromHeader = null;
  let fromComponent = null;
  let fromDetailComponent = null;
  let toComponent = null;

  let headerStyle : TextStyle = {padding:10, fontSize: 15, fontWeight: "bold", color: colors.csBlue.hex };
  let textStyle : TextStyle = { paddingLeft: 15, fontSize: 15, fontWeight: "bold", color: colors.csBlue.hex };
  let buttonStyle : ViewStyle = { flexDirection:'row', width:screenWidth-125, margin:5, paddingTop:10, paddingBottom:10, paddingLeft:15, alignItems:'center', backgroundColor: colors.csBlue.rgba(0.2), borderRadius:10 };

  if (fromType === null) {
    fromHeader = <Text style={headerStyle}>When should I start?</Text>;
    fromComponent = (
      <View>
        <TouchableOpacity style={buttonStyle} onPress={() => { setFromType("sunrise")}}>
          <ScaledImage source={require("../../../../../images/icons/sunrise.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
          <Text style={textStyle}>At sunrise...</Text>
        </TouchableOpacity>
        <TouchableOpacity style={buttonStyle} onPress={() => { setFromType("sunset")}}>
          <ScaledImage source={require("../../../../../images/icons/sunset.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
          <Text style={textStyle}>At sunset...</Text>
        </TouchableOpacity>
        <TouchableOpacity style={buttonStyle} onPress={() => { setFromType("certain time")}}>
          <ScaledImage source={require("../../../../../images/icons/clock.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
          <Text style={textStyle}>At a specific time...</Text>
        </TouchableOpacity>
      </View>
    );
  }
  else {
    fromHeader = <Text style={headerStyle}>I'll start at:</Text>;
    switch (fromType) {
      case "sunrise":
        fromComponent = (
          <TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
            <ScaledImage source={require("../../../../../images/icons/sunrise.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
            <Text style={textStyle}>sunrise...</Text>
          </TouchableOpacity>
        );
        break;
     case "sunset":
       fromComponent = (
         <TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
           <ScaledImage source={require("../../../../../images/icons/sunset.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
           <Text style={textStyle}>sunset...</Text>
         </TouchableOpacity>
         );
         break;
     case "certain time":
        fromComponent = (
          <TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
            <ScaledImage source={require("../../../../../images/icons/clock.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
            <Text style={textStyle}>the following time:</Text>
          </TouchableOpacity>
        );
        break;
    }

    switch (fromType) {
      case "sunrise":
      case "sunset":
        fromDetailComponent = (
          <View>
            <Text style={headerStyle}>Exactly or with an offset?</Text>
              <TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>exactly!</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>an hour before</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>45 minutes before</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>30 minutes before</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>15 minutes before</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>15 minutes after</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>30 minutes after</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>45 minutes after</Text>
              </TouchableOpacity><TouchableOpacity style={buttonStyle} onPress={() => {setFromType(null)}}>
                <Text style={textStyle}>an hour after</Text>
              </TouchableOpacity>
          </View>
        )
        break;
    }
  }

  // toComponent = (
  //   <View>
  //     <Text style={headerStyle}>And when should I stop?</Text>
  //     <TouchableOpacity style={buttonStyle} onPress={() => {}}>
  //       <ScaledImage source={require("../../../../../images/icons/sunrise.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
  //       <Text style={textStyle}>At sunrise...</Text>
  //     </TouchableOpacity>
  //     <TouchableOpacity style={buttonStyle}>
  //       <ScaledImage source={require("../../../../../images/icons/sunset.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
  //       <Text style={textStyle}>At sunset...</Text>
  //     </TouchableOpacity>
  //     <TouchableOpacity style={buttonStyle}>
  //       <ScaledImage source={require("../../../../../images/icons/clock.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>
  //       <Text style={textStyle}>At a specific time...</Text>
  //     </TouchableOpacity>
  //   </View>
  // );



  return (
    <View style={{flex:1, alignItems:'center', backgroundColor: colors.csBlue.hex}}>
      <View style={{width:0.8*screenWidth, flex:1, alignItems:'flex-start', margin:30, backgroundColor:colors.white.hex, borderRadius:30, padding:20}}>
        <Text style={headerStyle}>My behaviour has a starting time and an end time. Let's create some!</Text>
        { fromHeader }
        { fromComponent }
        { fromDetailComponent }
        {  toComponent  }
      </View>
    </View>
  );
}


class LayeredQuestions extends Component<any,any> {

  constructor(props) {
    super(props);

    let data = {
      question: "When should I start?",
      options: [
        {
          label:"At sunrise...",
          designElement: <ScaledImage source={require("../../../../../images/icons/sunrise.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>,
          followUp: {
            component: <View style={{width: 200, height: 30, backgroundColor:"#f00"}}/>
          }
        },
        {
          label:"At sunset...",
          designElement: <ScaledImage source={require("../../../../../images/icons/sunset.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>,
          followUp: {
            component: <View style={{width: 200, height: 30, backgroundColor:"#0f0"}}/>
          }
        },
        {
          label:"At a certain time...",
          designElement: <ScaledImage source={require("../../../../../images/icons/clock.png")} sourceWidth={100} sourceHeight={100} targetHeight={40}/>,
          followUp: {
            component: <View style={{width: 200, height: 30, backgroundColor:"#00f"}}/>
          }
        },
      ]
    }

  }

  render() {
    return <View/>

  }


























}