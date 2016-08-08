import React, { Component } from 'react'
import {
  Alert,
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
import { logOut } from '../../util/util';
import { TopBar } from '../components/Topbar';
import { TextEditInput } from '../components/editComponents/TextEditInput'
import { Background } from '../components/Background'
import { setupStyle, NextButton } from './SetupShared'
import { styles, colors, width, height } from './../styles'
var Icon = require('react-native-vector-icons/Ionicons');

export class SetupAddGroup extends Component {
  constructor() {
    super();
    this.state = {groupName:'', processing:false, processingText:'Setting up Group...'}
  }

  saveGroupName() {
    const store = this.props.store;
    const state = store.getState();
    let me = state.user;

    if (this.state.groupName.length > 2) {
      this.props.eventBus.emit('showLoading', 'Creating Group...');
      CLOUD.forUser(state.user.userId).createGroup(this.state.groupName)
        .then((response) => {
          // add the group to the database once it had been added in the cloud.
          store.dispatch({type:'ADD_GROUP', groupId: response.id, data:{name: response.name, iBeaconUUID: response.uuid}});

          // add yourself to the group members as admin
          store.dispatch({type: 'ADD_USER', groupId: response.id, userId: me.userId, data:{picture: me.picture, firstName: me.firstName, lastName: me.lastName, email:me.email, emailVerified: true, accessLevel: 'admin'}});

          // get all encryption keys the user has access to and store them in the appropriate groups.
          CLOUD.getKeys()
            .then((keyResult) => {
              if (Array.isArray(keyResult)) {
                keyResult.forEach((group) => {
                  store.dispatch({type:'UPDATE_GROUP', groupId: group.groupId, data:{
                    adminKey: keyResult.keys.admin,
                    memberKey:  keyResult.keys.member,
                    guestKey: keyResult.keys.guest
                  }});
                });
                this.props.eventBus.emit('hideLoading');
                store.dispatch({type:'SET_ACTIVE_GROUP', data:{activeGroup: response.id}});

                // we initially only support plugin so we skip the selection step.
                Actions.setupAddPluginStep1();
              }
              else {
                throw new Error("Key data is not an array.")
              }
            }).done();
        })
        .catch((err) => {
          if (err.status) {
            switch (err.status) {
              case 401:
                Alert.alert("Please log in again","Your login information cannot be verified.", [{text:'OK'}]);
                logOut();
                break;
              case 422:
                Alert.alert("Group '" + this.state.groupName + "' already exists.","Please try a different name.", [{text:'OK'}]);
                break;
              default:
                console.log(err);
                Alert.alert("Could not connect to the cloud service.","Please check if you're connected to the internet.", [{text:'OK'}]);
            }
          }
          else {
            console.log(err)
            Alert.alert("Error when creating group.",JSON.stringify(err), [{text:'OK..'}]);
          }


          this.props.eventBus.emit('hideLoading');
        })
    }
    else {
      Alert.alert("Please provide a valid Group name.", "It must be at least 3 characters long.", [{text:'OK'}])
    }
  }

  render() {
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <TopBar left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h0, {paddingTop:0}]}>Group Setup</Text>
          <Text style={setupStyle.text}>A Group is a place like "Home", or "Office" where you use your Crownstones.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can invite other people to join this group so they can use your Crownstones too.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can use permission levels to determine how much control invited people have in your Group.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Choose a name for your Group:</Text>
          <View style={[setupStyle.textBoxView,{height:70, backgroundColor:'transparent'}]}>
            <View style={[setupStyle.textBoxView, {height:40, width: width - 40}]}>
              <TextEditInput style={{flex:1, padding:10}} placeholder="Group name" placeholderTextColor="#888" value={this.state.groupName} callback={(newValue) => {this.setState({groupName:newValue});}} />
            </View>
          </View>
          <View style={{flex:1}} />
          <View style={setupStyle.buttonContainer}>
            <View style={{flex:1}} />
            <NextButton onPress={this.saveGroupName.bind(this)} />
          </View>
        </View>
      </Background>
    )
  }
}

