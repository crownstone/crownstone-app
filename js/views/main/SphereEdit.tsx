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
import { IconButton } from '../components/IconButton'
const Actions = require('react-native-router-flux').Actions;
import { colors } from './../styles';
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {OrangeLine} from "../styles";

export class SphereEdit extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    let sphere = state.spheres[params.sphereId] ;
    return {
      title: sphere.config.name,
    }
  };


  _getItems() {
    let items = [];

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    items.push({label:'What can I help you with?',  type:'largeExplanation'});
    
    let radius = 12;

    items.push({
      label: 'Rooms',
      type: 'navigation',
      largeIcon: <IconButton name='md-cube' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
      callback: () => {
        Actions.sphereRoomOverview({sphereId: this.props.sphereId});
      }
    });


    items.push({
      label: 'Crownstones',
      type: 'navigation',
      largeIcon: <IconButton name='c2-pluginFilled' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex}}/>,
      callback: () => {
        Actions.sphereCrownstoneOverview({sphereId: this.props.sphereId});
      }
    });



    items.push({
      label: 'Users',
      type: 'navigation',
      largeIcon: <IconButton name='c1-people' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
      callback: () => {
        Actions.sphereUserOverview({sphereId: this.props.sphereId});
      }
    });

    if (spherePermissions.editSphere) {
      items.push({
        label: 'Behaviour',
        type: 'navigation',
        largeIcon: <IconButton name='c1-brain' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex, marginLeft: 3, marginRight: 7}}/>,
        callback: () => {
          Actions.sphereBehaviour({sphereId: this.props.sphereId});
        }
      });
    }

    items.push({
      label: 'Integrations',
      type: 'navigation',
      largeIcon: <IconButton name='ios-link' buttonSize={55} size={40} radius={radius} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkBackground.hex}}/>,
      callback: () => {
        Actions.sphereIntegrations({sphereId: this.props.sphereId});
      }
    });

    items.push({type:'spacer'});
    items.push({
      label: 'Settings',
      largeIcon: <IconButton name="ios-cog" buttonSize={55} size={40} radius={radius} color="#fff" buttonStyle={{backgroundColor: colors.menuRed.hex}} />,
      type: 'navigation',
      callback: () => {
        Actions.sphereEditSettings({sphereId: this.props.sphereId});
      }
    });

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }




  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
