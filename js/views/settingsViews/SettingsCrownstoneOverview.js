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
import { ApplianceEntry } from '../components/ApplianceEntry'
import { ListEditableItems } from './../components/ListEditableItems'
import { getSphereContentFromState, getRoomName, getSpheresWhereIHaveAccessLevel } from './../../util/dataUtil'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton'

export class SettingsCrownstoneOverview extends Component {

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    let spheres = getSpheresWhereIHaveAccessLevel(state, 'admin');
    spheres.forEach((sphere) => {
      // let stones = getSphereContentFromState(state, sphere.id);
      // let stoneIds = Object.keys(stones);
      //
      // items.push({label:"CROWNSTONES IN SPHERE: '" + sphere.name + "'",  type:'explanation', below:false});
      // if (stoneIds.length > 0) {
      //   stoneIds.forEach((stoneId) => {
      //     let stone = stones[stoneId];
      //     let roomName = getRoomName(state, sphere.id, stone.stone.config.locationId);
      //     items.push({__item:
      //       <TouchableHighlight
      //         key={stoneId + '_entry'}
      //         onPress={() => {Actions.settingsCrownstone({stoneId:stoneId, sphereId: sphere.id});}}
      //       >
      //         <View style={styles.listView}>
      //           <ApplianceEntry
      //             icon={stone.device.config.icon}
      //             name={stone.stone.config.name || "Untitled Crownstone"}
      //             subtext={'Device: ' + (stone.stone.config.applianceId ? stone.device.config.name : 'Nothing plugged in.')}
      //             subtext2={stone.stone.config.locationId === null ? 'Not in a room.' :'In the ' + roomName}
      //             navigation={true}
      //           />
      //           </View>
      //         </TouchableHighlight>})
      //   })
      // }
      items.push({
        label: 'Add a Crownstone to this Sphere',
        largeIcon: <Icon name="ios-add-circle" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
        style: {color:colors.blue.hex},
        type: 'button',
        callback: () => {
          Actions.setupAddPluginStep1({sphereId: sphere.id, fromMainMenu: true});
        }
      })
    });



    items.push({type:'spacer'});
    items.push({
      label: 'Recover a Crownstone',
      icon: <IconButton name="c1-socket2" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.menuTextSelected.hex}} />,
      style: {color:colors.menuTextSelected.hex},
      type: 'button',
      callback: () => {
        Actions.settingsPluginRecoverStep1();
      }
    });
    items.push({label:'If you want to reset a Crownstone because it is not responding correctly, click here and follow the instructions.',  type:'explanation', below:true});
    items.push({type:'spacer'});

    return items;
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
