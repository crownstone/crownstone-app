import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { ApplianceEntry } from '../components/ApplianceEntry'
import { ListEditableItems } from './../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { EventBus } from '../../util/eventBus'

const Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { Icon } from '../components/Icon';

export class ApplianceSelection extends Component<any, any> {
  deleteEventBus : EventBus;
  unsubscribe : any;

  constructor() {
    super();
    this.deleteEventBus = new EventBus();
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      // guard against deletion of the stone
      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (stone)
        this.forceUpdate();
      else {
        Actions.pop()
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems() {
    let items = [];
    const store = this.props.store;
    const state = store.getState();

    let appliances = state.spheres[this.props.sphereId].appliances;
    let applianceIds = Object.keys(appliances);
    if (applianceIds.length > 0) {
      items.push({label:'ALL DEVICES', type: 'explanation',  below:false});

      applianceIds.forEach((applianceId) => {
        let appliance = appliances[applianceId];

        let selectCallback = () => { this.props.callback(applianceId); Actions.pop(); };
        let deleteCallback = () => {
          Alert.alert("Are you sure?","We will be automatically remove \"" + appliance.config.name + "\" from any Crownstones using it.",
            [{text:'Cancel', style: 'cancel'}, {text:'Delete', style: 'destructive', onPress: () => { this._removeAppliance(store, state, applianceId); }}])
        };

        items.push({__item:
          <View >
              <View style={[styles.listView]}>
                <ApplianceEntry
                  select={selectCallback}
                  delete={deleteCallback}
                  icon={appliance.config.icon}
                  name={appliance.config.name}
                  navigation={false}
                  deleteEventBus={this.deleteEventBus}
                  size={45}
                />
              </View>
          </View>
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
        CLOUD.forSphere(this.props.sphereId).createAppliance("", this.props.sphereId)
          .then((reply) => {
            this.props.eventBus.emit('hideLoading');
            store.dispatch({sphereId: this.props.sphereId, applianceId: reply.id, type: 'ADD_APPLIANCE'});
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
        let stones = state.spheres[this.props.sphereId].stones;
        for (let stoneId in stones) {
          if (stones.hasOwnProperty(stoneId)) {
            if (stones[stoneId].config.applianceId == applianceId) {
              store.dispatch({sphereId: this.props.sphereId, stoneId: stoneId, type: 'UPDATE_STONE_CONFIG', data: {applianceId: null}})
            }
          }
        }
        store.dispatch({sphereId: this.props.sphereId, applianceId: applianceId, type: 'REMOVE_APPLIANCE'});
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
