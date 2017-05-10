import * as React from 'react'; import { Component } from 'react';
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


import { Actions } from 'react-native-router-flux';
import { Background } from './../components/Background'
import { PictureCircle } from './../components/PictureCircle'
import { ListEditableItems } from './../components/ListEditableItems'
import { Util, processImage, safeDeleteFile } from '../../util/Util'
import { AppUtil } from '../../util/AppUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import { styles, colors, screenWidth } from './../styles'


export class SettingsProfile extends Component<any, any> {
  unsubscribe : any;
  renderState : any;
  validationState : any;

  constructor() {
    super();
    this.state = {picture:null, firstName: null, lastName: null};
    this.renderState = {};
    this.validationState = {firstName:undefined, lastName:undefined, email:undefined}
  }

  componentWillMount() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;

    this.setState({picture: user.picture, firstName: user.firstName, lastName: user.lastName});
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (this.renderState && this.renderState.user != state.user) {
        this.renderState = state;
        // LOG.info("Force Update Profile", this.renderState.user, state.user)
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
    let sphereIds = Object.keys(state.spheres);
    let items = [];

    items.push({type:'spacer'});
    items.push({
      label:'First Name',
      type: 'textEdit',
      value: this.state.firstName,
      validation:{minLength:2, numbers:{allowed:false}},
      validationCallback: (result) => {this.validationState.firstName = result;},
      callback: (newText) => {
        this.setState({firstName: newText});
      },
      endCallback: (newText) => {
        if (this.validationState.firstName === 'valid') {
          store.dispatch({type: 'USER_UPDATE', data: {firstName: newText}});
          // update your settings in every sphere that you belong to.
          sphereIds.forEach((sphereId) => { store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, memberId: user.userId, data:{firstName: newText}}); });
        }
        else {
          Alert.alert('First name must be at least 2 letters long', 'No numbers allowed either.', [{text: 'OK'}]);
        }
      }
    });
    items.push({
      label:'Last Name', 
      type: 'textEdit',
      value: this.state.lastName,
      validation:{minLength:2, numbers:{allowed:false}},
      validationCallback: (result) => {this.validationState.lastName = result;},
      callback: (newText) => {
        this.setState({lastName: newText});
      },
      endCallback: (newText) => {
        if (this.validationState.lastName === 'valid') {
          store.dispatch({type: 'USER_UPDATE', data: {lastName: newText}});
          // update your settings in every sphere that you belong to.
          sphereIds.forEach((sphereId) => { store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, memberId: user.userId, data:{lastName: newText}}); });

        }
        else {
          Alert.alert('Last name must be at least 2 letters long', 'No numbers allowed either.', [{text: 'OK'}]);
        }
      }
    });

    // TODO: make email address editable.
    items.push({
      label:'Email',
      type: 'info',
      value: user.email,
      // validation:'email',
      // validationCallback: (result) => {this.validationState.email = result;},
      // callback: (newEmail) => {
      //   if (this.validationState.email === 'valid') {
      //     if (user.email !== newEmail) {
      //       // CLOUD.updateUserData({background:true, data:{email:newEmail}});
      //       // TODO: add email system.
      //       Alert.alert(
      //         'An email has been sent to \'' + newEmail + '\'.',
      //         'After you click on the validation link, you can use your new address to log in and it will be synced.',
      //         [{text: 'OK'}]);
      //     }
      //   }
      //   else {
      //     Alert.alert('Not a valid email address','Please try again.',[{text:'OK'}]);
      //   }
      // }
    });
    items.push({
      label:'Change Password',
      type: 'button',
      style: {color:colors.blue.hex},
      callback: () => {
        Alert.alert(
          'Are you sure you want to reset your password?',
          'You will receive a password reset email with instructions at \'' + user.email + '\'. You will be logged out when the email has been sent.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'OK', onPress: () => {this.requestPasswordResetEmail(user.email)}}
          ]
        )
      }
    });

    items.push({type: 'spacer'});
    items.push({label:'Privacy', type: 'navigation', callback:() => { (Actions as any).settingsPrivacy(); }});
    items.push({label: 'You are in control of which data is shared with the cloud.', type: 'explanation', below: true});

    // items.push({label:'Enable Beta Access', value: user.betaAccess, type: 'switch', callback:(newValue) => {
    //   store.dispatch({
    //     type: 'SET_BETA_ACCESS',
    //     data: {betaAccess: newValue}
    //   });
    // }});
    // items.push({label: 'This will enable certain features in the app that might still be a bit experimental. This is ideal for early adopters or developers!', type: 'explanation', below: true});

    if (user.developer !== true) {
      items.push({label:'Enable Developer Mode', value: false, type: 'switch', callback:(newValue) => {
        setTimeout(() => {
          store.dispatch({
            type: 'SET_DEVELOPER_MODE',
            data: {developer: newValue}
          });
        }, 300)
      }});
      items.push({label: 'This will enable certain features that may be used for development of the Crownstone.', type: 'explanation', below: true});
    }
    else {
      items.push({label:'Developer Menu', type: 'navigation', callback:() => { (Actions as any).settingsDeveloper(); }});
      items.push({type: 'spacer'});
    }

    return items;
  }


  requestPasswordResetEmail(email) {
    this.props.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email: email.toLowerCase()})
      .then(() => {
        this.props.eventBus.emit('showLoading', 'Email sent!');
        Alert.alert(
          'Reset email has been sent',
          'You will now be logged out. Follow the instructions in the email and log in with your new password.',
          [{text: 'OK', onPress: () => {
            AppUtil.logOut(this.props.store);
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
    let sphereIds = Object.keys(state.spheres);
    let user = state.user;
    this.renderState = state; // important for performance check

    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <View>
            <View style={{alignItems:'center', justifyContent:'center', width: screenWidth, paddingTop:40}}>
              <PictureCircle
                value={this.state.picture}
                callback={(pictureUrl) => {
                let newFilename = user.userId + '.jpg';
                processImage(pictureUrl, newFilename)
                  .then((newPicturePath) => {
                    this.setState({picture:newPicturePath});
                    store.dispatch({type:'USER_UPDATE', data:{picture:newPicturePath}});
                    // update your settings in every sphere that you belong to.
                    sphereIds.forEach((sphereId) => {
                      store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data: {picture: newPicturePath}});
                    });
                  })
                  .catch((err) => {
                    LOG.info("PICTURE ERROR ",err)
                  })
              }}
                removePicture={() => {
              safeDeleteFile(this.state.picture);
              store.dispatch({type:'USER_UPDATE', data:{picture:null}});
              // update your settings in every sphere that you belong to.
              sphereIds.forEach((sphereId) => {
                store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data:{picture: null}});
              });
              this.setState({picture:null});
            }}
                size={120} />
            </View>
          </View>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
