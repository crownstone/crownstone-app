
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AlexaOverview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {Background} from "../../components/Background";
import {colors, OrangeLine, screenWidth} from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";


export class AlexaOverview extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Amazon_Alexa"),
    }
  };

  render() {
    let explanationStyle = {fontSize:15, padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center'};
    let headerStyle = {...explanationStyle, fontSize:18, fontWeight:'bold'};
    let titleStyle = {...explanationStyle, fontSize:30, fontWeight:'bold'};
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={true}>
        <OrangeLine/>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:20}} />
            <Text style={titleStyle}>{ lang("Working_with_Alexa") }</Text>
            <View style={{height:20}} />
            <ScaledImage source={require('../../../images/thirdParty/logo/amazonAlexa.png')} sourceWidth={264} sourceHeight={265} targetWidth={128} style={128} />
            <View style={{height:20}} />
            <Text style={headerStyle}>{ lang("Crownstone_is_now_availab") }</Text>
            <Text style={explanationStyle}>{ lang("You_can_now_go_to_your_Al") }</Text>
            <Text style={explanationStyle}>{ lang("You_will_receive_a_list_o") }</Text>
            <Text style={explanationStyle}>{ lang("When_you_tell_Alexa_to_sw") }</Text>
            <Text style={explanationStyle}>{ lang("Were_hard_at_work_adding_") }</Text>
            <Text style={explanationStyle}>{ lang("Expect_more_to_come_and_e") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}