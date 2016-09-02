import React, { Component } from 'react' 
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { PictureCircle } from './../components/PictureCircle'
import { ListEditableItems } from './../components/ListEditableItems'
import { logOut, processImage, safeDeleteFile } from '../../util/util'
import { CLOUD } from '../../cloud/cloudAPI'
import { styles, colors, width } from './../styles'
import RNFS from 'react-native-fs'


export class SettingsProfile extends Component {
  constructor() {
    super();
    this.state = {picture:null};
    this.renderState = {};
    this.validationState = {firstName:undefined, lastName:undefined, email:undefined}
  }

  componentWillMount() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;

    if (this.state.picture !== user.picture) {
      this.setState({picture: user.picture});
    }
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (this.renderState && this.renderState.user != state.user) {
        this.renderState = state;
        // console.log("Force Update Profile", this.renderState.user, state.user)
        this.forceUpdate();
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  
  _getItems(user) {
    const store = this.props.store;
    const state = store.getState();
    let groupIds = Object.keys(state.groups);
    let items = [];
    // room Name:
    items.push({type:'spacer'});
    items.push({
      label:'First Name',
      type: 'textEdit',
      value: user.firstName,
      validation:{minLength:2, numbers:{allowed:false}},
      validationCallback: (result) => {this.validationState.firstName = result;},
      callback: (newText) => {
        if (user.firstName !== newText) {
          if (this.validationState.firstName === 'valid') {
            store.dispatch({type: 'USER_UPDATE', data: {firstName: newText}});
            // update your settings in every group that you belong to.
            groupIds.forEach((groupId) => { store.dispatch({type: 'UPDATE_GROUP_USER', groupId: groupId, memberId: user.userId, data:{firstName: newText}}); });
          }
          else {
            Alert.alert('First name must be at least 2 letters long', 'No numbers allowed either.', [{text: 'OK'}]);
          }
        }
      }
    });
    items.push({
      label:'Last Name', 
      type: 'textEdit',
      value: user.lastName,
      validation:{minLength:2, numbers:{allowed:false}},
      validationCallback: (result) => {this.validationState.lastName = result;},
      callback: (newText) => {
        if (user.lastName !== newText) {
          if (this.validationState.lastName === 'valid') {
            store.dispatch({type: 'USER_UPDATE', data: {lastName: newText}});
            // update your settings in every group that you belong to.
            groupIds.forEach((groupId) => { store.dispatch({type: 'UPDATE_GROUP_USER', groupId: groupId, memberId: user.userId, data:{lastName: newText}}); });

          }
          else {
            Alert.alert('Last name must be at least 2 letters long', 'No numbers allowed either.', [{text: 'OK'}]);
          }
        }
      }
    });
    items.push({
      label:'Email',
      type: 'textEdit',
      value: user.email,
      validation:'email',
      validationCallback: (result) => {this.validationState.email = result;},
      callback: (newEmail) => {
        if (this.validationState.email === 'valid') {
          if (user.email !== newEmail) {
            // CLOUD.updateUserData({background:true, data:{email:newEmail}});
            // TODO: add email system.
            Alert.alert(
              'An email has been sent to \'' + newEmail + '\'.',
              'After you click on the validation link, you can use your new address to log in and it will be synced.',
              [{text: 'OK'}]);
          }
        }
        else {
          Alert.alert('Not a valid email address','Please try again.',[{text:'OK'}]);
        }
    }});
    items.push({type:'spacer'});
    items.push({
      label:'Change Password',
      type: 'button',
      style: {color:colors.blue.hex},
      callback: () => {
        Alert.alert(
          'Are you sure you want to reset your password?',
          'You will receive a password reset email with instructions at \'' + user.email + '\'. You will be logged out when the email has been sent.',
          [
            {text: 'Cancel'},
            {text: 'OK', onPress: () => {this.requestPasswordResetEmail(user.email)}}
          ]
        )
      }
    });

    return items;
  }


  requestPasswordResetEmail(email) {
    this.props.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email: email.toLowerCase()})
      .then(() => {
        Alert.alert(
          'Reset email has been sent',
          'You will now be logged out. Follow the instructions on the email and log in with your new password.',
          [{text: 'OK', onPress: () => {
            this.props.eventBus.emit('hideLoading');
            logOut();
          }}]
        )
      })
      .catch((reply) => {
        Alert.alert("Cannot Send Email", reply.data, [{text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}]);
      });
  }


  render() {
    const store = this.props.store;
    const state = store.getState();
    let groupIds = Object.keys(state.groups);
    let user = state.user;
    this.renderState = state; // important for performance check

    return (
      <Background>
        <View style={{alignItems:'center', justifyContent:'center', width:width, paddingTop:40}}>
          <PictureCircle 
            value={this.state.picture}
            callback={(pictureUrl) => {
                let newFilename = user.userId + '.jpg';
                processImage(pictureUrl, newFilename).then((newPicturePath) => {
                  this.setState({picture:newPicturePath});
                  store.dispatch({type:'USER_UPDATE', data:{picture:newPicturePath}});
                  // update your settings in every group that you belong to.
                  groupIds.forEach((groupId) => { store.dispatch({type: 'UPDATE_GROUP_USER', groupId: groupId, memberId: user.userId, data: {picture: newPicturePath}}); });
                })
              }} 
            removePicture={() => {
              safeDeleteFile(this.state.picture);
              store.dispatch({type:'USER_UPDATE', data:{picture:null}});
              // update your settings in every group that you belong to.
              groupIds.forEach((groupId) => { store.dispatch({type: 'UPDATE_GROUP_USER', groupId: groupId, memberId: user.userId, data:{picture: null}}); });
              this.setState({picture:null});
            }}
            size={120} />
        </View>
        <ScrollView>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
