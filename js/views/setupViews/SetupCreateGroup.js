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

import { CLOUD } from '../../cloud/cloudAPI'
import { TextEditInput } from '../components/editComponents/TextEditInput'
import { Background } from '../components/Background'
import { setupStyle } from './SetupStyles'
import { styles, colors, width, height } from './../styles'


export class SetupCreateGroup extends Component {
  constructor() {
    super();
    this.state = {groupName:'', processing:false, processingText:'Setting up Group...'}
  }

  saveGroupName() {
    if (this.state.groupName.length > 3) {
      this.props.eventBus.emit('showLoading', 'Creating Group...');
      CLOUD.createGroup(this.state.groupName)
        .then((response) => {
          this.props.eventBus.emit('hideLoading');
          console.log("response", response)
        })
    }
    else {
      Alert.alert("Please provide a valid Group name.", "At least 3 characters", [{type:'OK'}])
    }
  }

  render() {
    let fontSize;
    if (width > 370)
      fontSize = 45;
    else if (width > 300)
      fontSize = 40;
    else
      fontSize = 35;

    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.header, {fontSize:fontSize}]}>Group Setup</Text>
          <Text style={[setupStyle.text, {fontSize: fontSize*0.45, paddingTop:0}]}>A Group is a place like "Home", or "Office" where you use your Crownstones.</Text>
          <Text style={[setupStyle.information, {fontSize:fontSize*0.4}]}>You can invite other people to join this group so they can use your Crownstones too.</Text>
          <Text style={[setupStyle.information, {fontSize:fontSize*0.4}]}>You can use permission levels to determine how much control invited people have in your Group.</Text>
          <Text style={[setupStyle.information, {fontSize:fontSize*0.4}]}>Choose a name for your Group:</Text>

          <View style={[setupStyle.textBoxView,{flex:1, backgroundColor:'transparent'}]}>
            <View style={[setupStyle.textBoxView, {width: width - 40}]}>
              <TextEditInput style={{flex:1, padding:10}} placeholder="Group name" placeholderTextColor="#888" value={this.state.groupName} callback={(newValue) => {this.setState({groupName:newValue});}} />
            </View>
          </View>
        </View>

        <View style={[setupStyle.buttonContainer,{backgroundColor:undefined, height:100}]}>
          <TouchableOpacity onPress={this.saveGroupName.bind(this)}>
            <View style={[setupStyle.button, {height:100, width:100, borderRadius:50}]}><Text style={setupStyle.buttonText}>Next</Text></View>
          </TouchableOpacity>
        </View>
      </Background>
    )
  }
}

