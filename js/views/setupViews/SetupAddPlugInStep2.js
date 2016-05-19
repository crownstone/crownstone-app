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

import { CLOUD } from '../../cloud/cloudAPI'
import { NATIVE_API } from '../../nativeAPI'
import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle } from './SetupStyles'
import { styles, colors, width, height } from './../styles'

var Icon = require('react-native-vector-icons/Ionicons');

export class SetupAddPlugInStep2 extends Component {
  constructor() {
    super();
    setTimeout(() => {Actions.setupAddPluginStep3()}, 1500);



    //TODO: NATIVE_API.getClosestCleanMacAddress()
  }


  /**
   * TODO: this method has to be linked as a callback to the native api
   * @param MacAddress
   */
  registerCrownstone(MacAddress = 'newCrownstone') {
    const { store } = this.props;
    const state = store.getState();
    let activeGroup = state.app.activeGroup;

    CLOUD.createStone(activeGroup, MacAddress)
      .then((response) => {
        return NATIVE_API.claimCrownstone(MacAddress, response);
      })
      .then(() => {
        Actions.setupAddPluginStep3()
      })
      .catch((err) => {
        console.log(err);
        // TODO: handle error
      })
  }
  

  render() {
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <TopBar left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <Text style={[setupStyle.h1, {paddingTop:0}]}>Adding a Plug-in Crownstone</Text>
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={setupStyle.text}>Step 2: Hold your phone next to the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Wait for the icon to turn green.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>TODO: illustration of doing this.</Text>
          <Text style={setupStyle.information}>TODO: Animate when doing something.</Text>
          <Text style={setupStyle.information}>TODO: Move to the next step when finished (now its a timeout).</Text>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => {
              Alert.alert('Are you sure?','You can always add Crownstones later through the settings menu.',[{text:'No'},{text:'Yes, I\'m sure', onPress:()=>{Actions.tabBar()}}])
          }} style={{position:'absolute', left:20, bottom:30}}>
            <View style={setupStyle.smallButton}><Text style={setupStyle.buttonText}>Cancel</Text></View>
          </TouchableOpacity>
        </View>
      </Background>
    )
  }
}

