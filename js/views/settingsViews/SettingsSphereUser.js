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
import { ProfilePicture } from './../components/ProfilePicture'
import { ListEditableItems } from './../components/ListEditableItems'
import { logOut, processImage, safeDeleteFile } from '../../util/util'
import { CLOUD } from '../../cloud/cloudAPI'
import { styles, colors, width } from './../styles'
import RNFS from 'react-native-fs'

export class SettingsSphereUser extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems(user) {
    const store = this.props.store;
    const state = store.getState();
    let items = [];
    // room Name:
    items.push({type:'spacer'});
    items.push({label:'User',  type: 'info', value: user.firstName + ' ' + user.lastName});
    items.push({
      type:'dropdown',
      label:'Access Level',
      value: user.accessLevel.capitalize(),
      items:[{label:"Admin"},{label:'Member'},{label:"Guest"}],
      callback: (permission) => {
        permission = permission.toLowerCase();
        this.props.eventBus.emit('showLoading', 'Updating user permissions...');
        CLOUD.forSphere(this.props.sphereId).changeUserAccess(this.props.userId, permission)
          .then((result) => {
            store.dispatch({type: 'UPDATE_SPHERE_USER', sphereId: this.props.sphereId, userId: this.props.userId, data:{accessLevel: permission}});
          })
          .done(() => {
            this.props.eventBus.emit('hideLoading');
          })
        }
      }
    );

    items.push({type:'explanation', label:'REVOKE PERMISSIONS'});
    items.push({label:'Remove from Sphere', type:'button', callback: () => {
      Alert.alert(
        "Are you sure you want to remove this user from the sphere?",
        "User's permissions will be revoked the next time he/she logs into the app.",
      [{text:'No'}, {text:'Yes'}])
    }});

    return items;
  }



  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.spheres[this.props.sphereId].users[this.props.userId];

    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <View style={{alignItems:'center', justifyContent:'center', width:width, paddingTop:40}}>
            <ProfilePicture
              value={user.picture}
              size={120}
            />
          </View>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
