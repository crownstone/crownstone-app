import React, {
  Alert,
  Component,
  Image,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle } from './SetupStyles'
import { styles, colors, width, height } from './../styles'

export class SetupAddPlugInStep1 extends Component {
  render() {
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <TopBar left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h1, {paddingTop:0}]}>Adding a Plug-in Crownstone</Text>
          <Text style={setupStyle.text}>Step 1: Put the Crownstone in the power outlet.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Make sure there is nothing is plugged into the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>TODO: illustration of doing this.</Text>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => {
              Alert.alert('Are you sure?','You can always add Crownstones later through the settings menu.',[{text:'No'},{text:'Yes, I\'m sure', onPress:()=>{Actions.tabBar()}}])
          }} style={{position:'absolute', left:20, bottom:30}}>
            <View style={setupStyle.smallButton}><Text style={setupStyle.buttonText}>Cancel</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={Actions.setupAddPluginStep2} style={{position:'absolute', right:20, bottom:30}}>
          <View style={setupStyle.smallButton}>
            <Text style={setupStyle.buttonText}>Next</Text>
          </View>
        </TouchableOpacity>
        </View>
      </Background>
    )
  }
}

