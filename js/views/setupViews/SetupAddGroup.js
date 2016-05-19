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


export class SetupAddGroup extends Component {
  constructor() {
    super();
    this.state = {groupName:'', processing:false, processingText:'Setting up Group...'}
  }

  saveGroupName() {
    const store = this.props.store;
    if (this.state.groupName.length > 3) {
      this.props.eventBus.emit('showLoading', 'Creating Group...');
      CLOUD.createGroup(this.state.groupName)
        .then((response) => {
          this.props.eventBus.emit('hideLoading');
          store.dispatch({type:'ADD_GROUP', groupId: response.data.id, data:{name: response.data.name, uuid: response.data.uuid}});
          // TODO: NATIVE_API.addGroup(response.data.uuid)
          let state = store.getState();
          
          // if there is only one group, set it to be active for the setup phase.
          if (Object.keys(state.groups).length === 1) {
            store.dispatch({type:'SET_ACTIVE_GROUP', data:{activeGroup: response.data.id}});
            Actions.setupAddCrownstoneSelect();
          }
          else {
            // TODO: NATIVE_API.getActiveGroup()
            // TODO:  .then(.. set group)
            // TODO:  .catch(.. ask which group)
          }
          
        })
    }
    else {
      Alert.alert("Please provide a valid Group name.", "At least 3 characters", [{type:'OK'}])
    }
  }

  render() {
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={setupStyle.h0}>Group Setup</Text>
          <Text style={setupStyle.text}>A Group is a place like "Home", or "Office" where you use your Crownstones.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can invite other people to join this group so they can use your Crownstones too.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can use permission levels to determine how much control invited people have in your Group.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Choose a name for your Group:</Text>
          <View style={{flex:1}} />
          <View style={[setupStyle.textBoxView,{flex:1, backgroundColor:'transparent'}]}>
            <View style={[setupStyle.textBoxView, {width: width - 40}]}>
              <TextEditInput style={{flex:1, padding:10}} placeholder="Group name" placeholderTextColor="#888" value={this.state.groupName} callback={(newValue) => {this.setState({groupName:newValue});}} />
            </View>
          </View>
          <View style={{flex:1}} />
          <View style={[setupStyle.buttonContainer,{backgroundColor:undefined, height:100}]}>
            <TouchableOpacity onPress={this.saveGroupName.bind(this)}>
              <View style={[setupStyle.button, {height:100, width:100, borderRadius:50}]}><Text style={setupStyle.buttonText}>Next</Text></View>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    )
  }
}

