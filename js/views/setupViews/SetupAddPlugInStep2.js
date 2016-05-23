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
import { CrownstoneAPI } from '../../native/CrownstoneAPI'
import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle } from './SetupStyles'
import { styles, colors, width, height } from './../styles'

var Icon = require('react-native-vector-icons/Ionicons');

export class SetupAddPlugInStep2 extends Component {
  constructor() {
    super();
    setTimeout(() => {Actions.setupAddPluginStep3()}, 1500);
    this.state = {progress:0, text:''};
  }

  scanAndRegisterCrownstone() {
    this.setProgress(0);

    const {store} = this.props;
    const state = store.getState();
    let activeGroup = state.app.activeGroup;
    let crownstone = undefined;
    let macAddress = undefined;

    CrownstoneAPI.getNearestSetupCrownstone()
      .then((foundCrownstone) => {
        crownstone = foundCrownstone;
        this.setProgress(1);
        return crownstone.connect();
      })
      .then(() => {
        this.setProgress(2);
        return crownstone.getMacAddress();
      })
      .then((csMacAddress) => {
        macAddress = csMacAddress;
        this.setProgress(3);
        return CLOUD.createStone(activeGroup, macAddress);
      })
      .then((data) => {
        store.dispatch({
          type: "ADD_STONE",
          groupId: activeGroup,
          stoneId: data.stoneId, // TODO: fix when dominik updates cloud (this is the 2 byte id)
          data: {
            macAddress:   macAddress,
            iBeaconMajor: data.major, // TODO: check when dominik updates cloud
            iBeaconMinor: data.minor, // TODO: check when dominik updates cloud
            initializedSuccessfully: false
          }
        });
        this.claimStone(crownstone, data.stoneId);
      })
      .catch((err) => {
        /* TODO: handle connections issues */
      });
  }

  claimStone(crownstone, stoneId, attempt = 0) {
    const {store} = this.props;
    const state = store.getState();
    let activeGroup = state.app.activeGroup;
    let groupData = state.groups[activeGroup].config;
    let stoneData = state.groups[activeGroup].stones[stoneId];

    this.setProgress(4);
    crownstone.writeId(stoneId)
      .then(() => {return crownstone.writeOwnerKey(groupData.ownerKey);})
      .then(() => {return crownstone.writeUserKey(groupData.userKey);})
      .then(() => {return crownstone.writeGuestKey(groupData.guestKey);})
      .then(() => {return crownstone.writeIBeaconUUID(groupData.uuid);})
      .then(() => {return crownstone.writeIBeaconMajor(stoneData.iBeaconMajor);})
      .then(() => {return crownstone.writeIBeaconMinor(stoneData.iBeaconMinor);})
      .then(() => {
        this.setProgress(5);
        crownstone.activate().then(() => {
          this.setProgress(6);
          setTimeout(() => { Actions.setupAddPluginStep3(); }, 500);
        })
      })
      .catch((err) => {
        console.log("error", err, "ATTEMPT:", attempt);
        Alert.alert("Something went wrong.",'We will try it again.',[{text:'OK'}]);
        this.setProgress(4);
        crownstone.reset().then(() => {
          if (attempt < 5) {
            setTimeout(() => {this.claimStone(crownstone, stoneId, attempt += 1);}, 1000);
          }

        });
      })
  }
      
      
      
      


  

  
  setProgress(step) {
    switch (step) {
      case 0:
        this.setState({progress: 0.0, text:'Scanning for Crownstone (it can take a crownstone up to 5 seconds to fully boot the first time).'});
        break;
      case 1:
        this.setState({progress: 0.1, text: 'Connecting to Crownstone.'});
        break;
      case 2:
        this.setState({progress: 0.3, text: 'Getting Address...'});
        break;
      case 3:
        this.setState({progress: 0.5, text: 'Registering in the Cloud...'});
        break;
      case 4:
        this.setState({progress: 0.7, text: 'Binding Crownstone to your Group...'});
        break;
      case 5:
        this.setState({progress: 0.9, text: 'Activating Crownstone'});
        break;
      case 6:
        this.setState({progress: 1, text: 'Done!'});
        break;
    }
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
              Alert.alert("Are you sure?","You can always add Crownstones later through the settings menu.",[{text:'No'},{text:'Yes, I\'m sure', onPress:()=>{Actions.tabBar()}}])
          }} style={{position:'absolute', left:20, bottom:30}}>
            <View style={setupStyle.smallButton}><Text style={setupStyle.buttonText}>Cancel</Text></View>
          </TouchableOpacity>
        </View>
      </Background>
    )
  }
}

