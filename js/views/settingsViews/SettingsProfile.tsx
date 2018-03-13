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
import { IconButton } from "../components/IconButton";
import { NotificationHandler } from "../../backgroundProcesses/NotificationHandler";

export class SettingsProfile extends Component<any, any> {
  unsubscribe : any;
  renderState : any;
  validationState : any;

  constructor(props) {
    super(props);
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
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeUserData || change.changeUserDeveloperStatus) {
        this.forceUpdate();
      }
    });
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
      validation:{minLength:1, numbers:{allowed:false}},
      validationCallback: (result) => {this.validationState.firstName = result;},
      callback: (newText) => {
        this.setState({firstName: newText});
      },
      endCallback: (newText) => {
        if (this.validationState.firstName === 'valid') {
          store.dispatch({type: 'USER_UPDATE', data: {firstName: newText}});
          // update your settings in every sphere that you belong to.
          sphereIds.forEach((sphereId) => { store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data:{firstName: newText}}); });
        }
        else {
          Alert.alert('First name must be at least 1 letter long', 'No numbers allowed either.', [{text: 'OK'}]);
        }
      }
    });
    items.push({
      label:'Last Name', 
      type: 'textEdit',
      value: this.state.lastName,
      validation:{minLength:1, numbers:{allowed:false}},
      validationCallback: (result) => {this.validationState.lastName = result;},
      callback: (newText) => {
        this.setState({lastName: newText});
      },
      endCallback: (newText) => {
        if (this.validationState.lastName === 'valid') {
          store.dispatch({type: 'USER_UPDATE', data: {lastName: newText}});
          // update your settings in every sphere that you belong to.
          sphereIds.forEach((sphereId) => { store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data:{lastName: newText}}); });

        }
        else {
          Alert.alert('Last name must be at least 1 letter long', 'No numbers allowed either.', [{text: 'OK'}]);
        }
      }
    });

    items.push({
      label:'Email',
      type: 'info',
      value: user.email,
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

    if (user.developer !== true) {
      items.push({
        label:'Enable Developer Mode',
        value: false,
        icon: <IconButton name={"md-code-working"} size={25} button={true} color={colors.white.hex} buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
        type: 'switch',
        callback:(newValue) => {
        setTimeout(() => {
          NotificationHandler._verifyState();
          store.dispatch({
            type: 'SET_DEVELOPER_MODE',
            data: {developer: newValue}
          });
        }, 300)
      }});
      items.push({label: 'This will enable certain features that may be used for development of the Crownstone.', type: 'explanation', below: true});
    }
    else {
      items.push({
        label:'Developer Menu',
        icon: <IconButton name={"md-code-working"} size={25} button={true} color={colors.white.hex} buttonStyle={{backgroundColor: colors.menuRed.hex}}/>,
        type: 'navigation',
        callback:() => { Actions.settingsDeveloper(); }
      });
      items.push({type: 'spacer'});
    }

    return items;
  }


  requestPasswordResetEmail(email) {
    this.props.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email: email.toLowerCase()})
      .then(() => {
        this.props.eventBus.emit('showLoading', 'Email sent!');
        let defaultAction = () => {
          AppUtil.logOut(this.props.store);
        };
        Alert.alert(
          'Reset email has been sent',
          'You will now be logged out. Follow the instructions in the email and log in with your new password.',
          [{text: 'OK', onPress: defaultAction}],
          { onDismiss: defaultAction }
        )
      })
      .catch((reply) => {
        let defaultAction = () => {this.props.eventBus.emit('hideLoading'); };
        Alert.alert("Cannot Send Email", reply.data, [{text: 'OK', onPress: defaultAction}], { onDismiss: defaultAction });
      });
  }


  render() {
    const store = this.props.store;
    const state = store.getState();
    let sphereIds = Object.keys(state.spheres);
    let user = state.user;

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
                      store.dispatch({type:'USER_UPDATE', data:{picture:newPicturePath, pictureId: null}});
                      // update your settings in every sphere that you belong to.
                      sphereIds.forEach((sphereId) => {
                        store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data: {picture: newPicturePath, pictureId: null}});
                      });
                    })
                    .catch((err) => {
                      LOG.info("PICTURE ERROR ",err)
                    })
                }}
                removePicture={() => {
                  safeDeleteFile(this.state.picture).catch(() => {});
                  store.dispatch({type:'USER_UPDATE', data:{picture:null, pictureId: null}});
                  // update your settings in every sphere that you belong to.
                  sphereIds.forEach((sphereId) => {
                    store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: sphereId, userId: user.userId, data:{picture: null, pictureId: null}});
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
