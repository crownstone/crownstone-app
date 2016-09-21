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
import { styles, colors, screenWidth, screenHeight } from './../styles'
import { LOG } from '../../logging/Log'

export class SetupAddSphere extends Component {
  constructor() {
    super();
    this.state = {sphereName:'', processing:false, processingText:'Setting up Sphere...'}
  }

  saveSphereName() {
    const store = this.props.store;
    const state = store.getState();
    let me = state.user;

    if (this.state.sphereName.length > 2) {
      this.props.eventBus.emit('showLoading', 'Creating Sphere...');
      CLOUD.forUser(state.user.userId).createSphere(this.state.sphereName)
        .then((response) => {

          let creationActions = [];
          // add the sphere to the database once it had been added in the cloud.
          creationActions.push({type:'ADD_SPHERE', sphereId: response.id, data:{name: response.name, iBeaconUUID: response.uuid}});

          // add yourself to the sphere members as admin
          creationActions.push({type: 'ADD_SPHERE_USER', sphereId: response.id, userId: me.userId, data:{picture: me.picture, firstName: me.firstName, lastName: me.lastName, email:me.email, emailVerified: true, accessLevel: 'admin'}});

          // get all encryption keys the user has access to and store them in the appropriate spheres.
          CLOUD.getKeys()
            .then((keyResult) => {
              if (Array.isArray(keyResult)) {
                LOG(keyResult);
                keyResult.forEach((keySet) => {
                  creationActions.push({type:'SET_SPHERE_KEYS', sphereId: keySet.sphereId, data:{
                    adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
                    memberKey: keySet.keys.member || null,
                    guestKey:  keySet.keys.guest  || null
                  }})
                });
                this.props.eventBus.emit('sphereCreated');
                this.props.eventBus.emit('hideLoading');

                store.batchDispatch(creationActions);
                // we initially only support plugin so we skip the selection step.
                Actions.setupAddPluginStep1({sphereId: response.id});
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
                Alert.alert("Sphere '" + this.state.sphereName + "' already exists.","Please try a different name.", [{text:'OK'}]);
                break;
              default:
                LOG(err);
                Alert.alert("Could not connect to the cloud service.","Please check if you're connected to the internet.", [{text:'OK'}]);
            }
          }
          else {
            LOG(err);
            Alert.alert("Error when creating sphere.",JSON.stringify(err), [{text:'OK..'}]);
          }


          this.props.eventBus.emit('hideLoading');
        })
    }
    else {
      Alert.alert("Please provide a valid Sphere name.", "It must be at least 3 characters long.", [{text:'OK'}])
    }
  }

  render() {
    return (
      <Background hideInterface={true} image={this.props.backgrounds.setup}>
        <TopBar left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h0, {paddingTop:0}]}>Sphere Setup</Text>
          <Text style={setupStyle.text}>A Sphere is a place like "Home", or "Office" where you use your Crownstones.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can invite other people to join this sphere so they can use your Crownstones too.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can use permission levels to determine how much control invited people have in your Sphere.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Choose a name for your Sphere:</Text>
          <View style={[setupStyle.textBoxView,{height:70, backgroundColor:'transparent'}]}>
            <View style={[setupStyle.textBoxView, {height:40, width: screenWidth - 40}]}>
              <TextEditInput style={{flex:1, padding:10}} placeholder="Sphere name" placeholderTextColor="#888" value={this.state.sphereName} callback={(newValue) => {this.setState({sphereName:newValue});}} />
            </View>
          </View>
          <View style={{flex:1}} />
          <View style={setupStyle.buttonContainer}>
            <View style={{flex:1}} />
            <NextButton onPress={this.saveSphereName.bind(this)} />
          </View>
        </View>
      </Background>
    )
  }
}

