import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";

import KeepAwake from 'react-native-keep-awake';
import { Languages } from "../../../Languages";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining", key)(a,b,c,d,e);
}



export class RoomTrainingStep1 extends LiveComponent<any, any> {
  static options(props) {
    let location = Get.location(props.sphereId, props.locationId);
    return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, closeModal: false});
  }


  constructor(props) {
    super(props);
    this.state = {

    };
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
    }
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }




  render() {
    let location = Get.location(this.props.sphereId, this.props.locationId);
    return (
      <Background>
        <KeepAwake />
        <View style={{height:30}}/>
        <Text style={styles.header}>{"Initial training session"}</Text>
        <Text style={styles.boldExplanation}>{"First we will walk around the room with the phone in your hand, arm stretched out."}</Text>
        <Text style={styles.explanation}>{"Once the phone vibrates, move it to a new position and hold it there. Repeat this with as many unique positions as possible."}</Text>

        <View style={{flex:1}}/>
        <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
        <View style={{flex:1}}/>

        <Text style={styles.explanation}>{"Once I have collected enough information, I'll let you know!."}</Text>
        <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            icon={'ios-play'}
            label={ "Start!"}
            callback={() => { NavigationUtil.navigate('RoomTrainingStep1_train', this.props); }}
          />
        </View>
      </Background>
    );
  }
}

