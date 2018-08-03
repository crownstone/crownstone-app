import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View,
  TouchableOpacity
} from 'react-native';

import { Background } from '../components/Background'
import {colors, screenHeight, screenWidth} from "../styles";
import {IconButton} from "../components/IconButton";
import {deviceStyles} from "../deviceViews/DeviceOverview";
import {AppUtil} from "../../util/AppUtil";


export class SettingsRedownloadFromCloud extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Reset from Cloud",
    }
  };

  render() {
    return (
      <Background image={this.props.backgrounds.menu}  hasNavBar={false} safeView={true}>
        <View style={{flex:1, alignItems:'center', padding: 20}}>
          <Text style={[deviceStyles.header,{color:colors.menuBackground.hex}]}>Replace local data with Cloud data</Text>
          <View style={{flex:1}} />
          <IconButton
            name="md-cloud-download"
            size={0.15*screenHeight}
            color="#fff"
            buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.red.hex, borderRadius: 0.03*screenHeight}}
            style={{position:'relative'}}
          />
          <View style={{flex:1}} />
          <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{"To restore your local data with the Cloud data, press the button below. If you don't want to do this, just go back to the help menu.\n\n" +
          "Replacing the local data with the 'fresh' Cloud data might solve some issues you experience in your app."}</Text>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => { AppUtil.resetDatabase(this.props.store, this.props.eventBus) }} style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.hex, alignItems:'center', justifyContent:'center'}}>
            <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{"I'm sure, do it!"}</Text>
          </TouchableOpacity>
        </View>
      </Background>
    );
  }
}
