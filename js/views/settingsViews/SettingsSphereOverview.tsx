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

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
const Actions = require('react-native-router-flux').Actions;
import {styles, colors, screenWidth, OrangeLine} from '../styles'
import { IconButton } from '../components/IconButton'
import { LOG } from '../../logging/Log'
import {Util} from "../../util/Util";
import {createNewSphere} from "../../util/CreateSphere";


export class SettingsSphereOverview extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "Sphere Overview" }
  };

  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeSpheres || change.changeSphereConfig) {
        this.forceUpdate();
      }
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
              Actions.settingsSphere({sphereId:sphereId, title: sphere.config.name})
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

    if (totalSpheres < 1 || adminSpheres.length === 0) {
      items.push({type: 'spacer'});
      items.push({
        label: 'Create a new Sphere',
        icon: <IconButton name="ios-add-circle" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
        style: {color: colors.blue.hex},
        type: 'button',
        callback: () => {
          this._createNewSphere(store, state.user.firstName+"'s Sphere").catch(() => {})
        }
      });
    }
    // else {
      // items.push({label:'Maximum of 1 Sphere where you are admin for now..',  type:'explanation', below:false});
    // }

    // if you do not have, or are part of, any spheres yet.
    if (adminSpheres.length == 0 && memberSpheres.length == 0 && guestSpheres.length == 0)
      items.push({label:'Having your own Sphere is only required if you want to add your own Crownstones.',  type:'explanation', below: true});


    return items;
  }

  _createNewSphere(store, name) {
    return createNewSphere(this.props.eventBus, store, name);
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
