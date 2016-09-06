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
import { DeviceOverview } from '../components/DeviceOverview'
import { ListEditableItems } from './../components/ListEditableItems'
import Swipeout from 'react-native-swipeout'
import { CLOUD } from '../../cloud/cloudAPI'

var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { Icon } from '../components/Icon';

export class ApplianceSelection extends Component {

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

    let appliances = state.groups[this.props.groupId].appliances;
    let applianceIds = Object.keys(appliances);
    if (applianceIds.length > 0) {
      items.push({label:'ALL DEVICES', type: 'explanation',  below:false});

      applianceIds.forEach((applianceId) => {
        let appliance = appliances[applianceId];
        let deleteButton = [{
          text: 'Delete',
          backgroundColor: colors.red.hex,
          color:'#fff',
          onPress: () => {
            Alert.alert("Are you sure?","We will be automatically remove \"" + appliance.config.name + "\" from any Crownstones using it.",
              [{text:'Cancel'}, {text:'Delete', onPress: () => { this._removeAppliance(store, state, applianceId); }}])
          }
        }];

        items.push({__item:
        <Swipeout right={deleteButton} autoClose={true} >
          <TouchableHighlight
            key={appliance + '_entry'}
            onPress={() => {this.props.callback(applianceId); Actions.pop();}}
          >
            <View style={styles.listView}>
              <DeviceOverview
                icon={appliance.config.icon}
                name={appliance.config.name}
                navigation={false}
                size={40}
              />
            </View>
          </TouchableHighlight>
        </Swipeout>
          })
      });
      items.push({label:'You can delete a device by swiping it to the left and pressing Delete.', style:{paddingBottom:0}, type: 'explanation',  below:true});
    }


    items.push({label:'ADD DEVICE', type: 'explanation', below:false});
    items.push({
      label: 'Add a Device',
      largeIcon: <Icon name="ios-add-circle" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
        this.props.eventBus.emit('showLoading', 'Creating new Device...');
        CLOUD.createAppliance("", this.props.groupId)
          .then((reply) => {
            this.props.eventBus.emit('hideLoading');
            store.dispatch({groupId: this.props.groupId, applianceId: reply.id, type: 'ADD_APPLIANCE'});
            this.props.callback(reply.id);
            Actions.pop();
          })
          .catch((err) => {
            Alert.alert("Encountered Cloud Issue.",
              "We cannot create an Appliance in the Cloud. Please try again later.",
              [{text:'OK', onPress: () => { this.props.eventBus.emit('hideLoading');} }])
          });
      }
    });
    return items;
  }

  _removeAppliance(store, state, applianceId) {
    this.props.eventBus.emit('showLoading','Removing this appliance in the Cloud.');
    CLOUD.deleteAppliance(applianceId)
      .then(() => {
        this.props.eventBus.emit('hideLoading');
        let stones = state.groups[this.props.groupId].stones;
        for (let stoneId in stones) {
          if (stones.hasOwnProperty(stoneId)) {
            if (stones[stoneId].config.applianceId == applianceId) {
              store.dispatch({groupId: this.props.groupId, stoneId: stoneId, type: 'UPDATE_STONE_CONFIG', data: {applianceId: null}})
            }
          }
        }
        store.dispatch({groupId: this.props.groupId, applianceId: applianceId, type: 'REMOVE_APPLIANCE'});
      })
      .catch((err) => {
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Appliance in the Cloud. Please try again later.",
          [{text:'OK', onPress: () => { this.props.eventBus.emit('hideLoading');} }])
      });
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
