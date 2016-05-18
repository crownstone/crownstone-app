import React, {
  Alert,
  Component,
  Image,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import { setupStyle } from './SetupStyles'
import { styles, colors, width, height } from './../styles'


export class SetupAddCrownstoneSelect extends Component {
  skip() {
    Alert.alert("Are you sure?","You can always add Crownstones later through the settings menu.",
      [{text:'No'},{text:'Yes, I\'m sure', onPress:()=>{Actions.tabBar()}}])
  }

  render() {
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={setupStyle.h0}>Add your Crownstone</Text>
          <Text style={setupStyle.text}>What sort of Crownstone would you like to add to the group?</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>TODO: icon of built in crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>TODO: icon of plug in crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <View style={{flex:1}} />
          <View style={[setupStyle.buttonContainer,{backgroundColor:undefined, height:100}]}>
            <TouchableOpacity onPress={this.skip}>
              <View style={[setupStyle.button, {height:100, width:100, borderRadius:50}]}><Text style={setupStyle.buttonText}>Skip</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    )
  }
}

