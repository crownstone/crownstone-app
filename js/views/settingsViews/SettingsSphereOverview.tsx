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

import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
const Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { CLOUD } from './../../cloud/cloudAPI'
import { BluenetPromiseWrapper } from './../../native/Proxy'
import { IconButton } from '../components/IconButton'
import { LOG } from '../../logging/Log'


export class SettingsSphereOverview extends Component<any, any> {
  unsubscribe : any;

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
        this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getSpheres(state, accessLevel) {
    let items = [];
    for (let sphereId in state.spheres) {
      if (state.spheres.hasOwnProperty(sphereId)) {
        let sphere = state.spheres[sphereId];
        // there can be a race condition where the current user is yet to be added to spheres but a redraw during the creation process triggers this method
        if (sphere.users[state.user.userId] && sphere.users[state.user.userId].accessLevel === accessLevel) {
          items.push({
            label: sphere.config.name,
            type:'navigation',
            callback: () => {
              (Actions as any).settingsSphere({sphereId:sphereId, title: sphere.config.name})
            }
          });
        }
      }
    }

    return items;
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    let adminSpheres  = this._getSpheres(state, 'admin');
    let memberSpheres = this._getSpheres(state, 'member');
    let guestSpheres  = this._getSpheres(state, 'guest');

    let totalSpheres = adminSpheres.length + memberSpheres.length + guestSpheres.length;

    if (adminSpheres.length > 0) {
      items.push({label:'SPHERES WHERE YOU ARE AN ADMIN',  type:'explanation', below:false});
      items = items.concat(adminSpheres);
    }

    if (memberSpheres.length > 0) {
      items.push({label:'SPHERES WHERE YOU ARE A MEMBER',  type:'explanation', below:false});
      items = items.concat(memberSpheres);
    }

    if (guestSpheres.length > 0) {
      items.push({label:'SPHERES WHERE YOU ARE A GUEST',  type:'explanation', below:false});
      items = items.concat(guestSpheres);
    }

    if (totalSpheres < 1) {
      items.push({type: 'spacer'});
      items.push({
        label: 'Create a new Sphere',
        icon: <IconButton name="ios-add-circle" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
        style: {color: colors.blue.hex},
        type: 'button',
        callback: () => {
          this._createNewSphere(store, state.user.firstName).catch(() => {})
        }
      });
    }
    else {
      items.push({label:'Max 1 Sphere is currently supported.',  type:'explanation', below:false});
    }

    // if you do not have, or are part of, any spheres yet.
    if (adminSpheres.length == 0 && memberSpheres.length == 0 && guestSpheres.length == 0)
      items.push({label:'Having your own Sphere is only required if you want to add your own Crownstones.',  type:'explanation', below: true});


    return items;
  }

  _createNewSphere(store, name) {
    this.props.eventBus.emit('showLoading', 'Creating Sphere...');
    return BluenetPromiseWrapper.requestLocation()
      .then((location) => {
        let latitude = undefined;
        let longitude = undefined;
        if (location && location.latitude && location.longitude) {
          latitude = location.latitude;
          longitude = location.longitude;
        }
        return CLOUD.createNewSphere(store, name, this.props.eventBus, latitude, longitude)
      })
      .then((sphereId) => {
        this.props.eventBus.emit('hideLoading');
        let state = this.props.store.getState();
        let title = state.spheres[sphereId].config.name;
        (Actions as any).settingsSphere({sphereId: sphereId, title: title})
      })
      .catch((err) => {
        if (err.status == 422) {
          return this._createNewSphere(store, name + ' new')
        }
        else {
          return new Promise((resolve, reject) => {reject(err);})
        }
      })
      .catch((err) => {
        this.props.eventBus.emit('hideLoading');
        LOG.error("Could not create sphere", err);
        Alert.alert("Could not create sphere", "Please try again later.", [{text:'OK'}])
      })
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
