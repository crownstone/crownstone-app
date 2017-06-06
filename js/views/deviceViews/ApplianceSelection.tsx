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
import { EventBusClass } from '../../util/EventBus'

const Actions = require('react-native-router-flux').Actions;
import {styles, colors, screenWidth} from './../styles'
import { Icon } from '../components/Icon';

export class ApplianceSelection extends Component<any, any> {
  deleteEventBus : EventBusClass;
  unsubscribe : any;

  constructor() {
    super();
    this.deleteEventBus = new EventBusClass();
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      // if the stone has been deleted, close everything.
      if (change.removeStone && change.removeStone.stoneIds[this.props.stoneId]) {
        return Actions.pop();
      }

      if (change.changeAppliances && change.changeAppliances.sphereIds[this.props.sphereId]) {
        return this.forceUpdate();
      }
    });
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
      items.push({label:'ALL DEVICES', type: 'lightExplanation',  below:false});

      applianceIds.forEach((applianceId) => {
        let appliance = appliances[applianceId];

        let selectCallback = () => { this.props.callback(applianceId); Actions.pop(); };
        let deleteCallback = () => {
          Alert.alert("Are you sure?","We will be automatically remove \"" + appliance.config.name + "\" from any Crownstones using it.",
            [{text:'Cancel', style: 'cancel'}, {text:'Delete', style: 'destructive', onPress: () => { this._removeAppliance(store, state, applianceId); }}])
        };

        items.push({__item:
          <View >
              <View style={[styles.listView,{backgroundColor: this.props.applianceId === applianceId ? colors.white.hex : colors.white.rgba(0.65)}]}>
                <ApplianceEntry
                  select={selectCallback}
                  delete={deleteCallback}
                  deleteColor={this.props.applianceId === applianceId ? colors.black.rgba(0.3) : colors.white.hex }
                  current={this.props.applianceId === applianceId }
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
    }


    items.push({label:'ADD DEVICE', type: 'lightExplanation', below:false});
    items.push({
      label: 'Add a Device',
      largeIcon: <Icon name="ios-add-circle" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
        Actions.applianceAdd({
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          callback: (applianceId) => {
            this.props.callback(applianceId);
          }
        });
      }
    });

    items.push({
      label: 'No device plugged in',
      largeIcon: <Icon name="md-cube" size={45} color={colors.menuBackground.hex} />,
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
        this.props.callback(null); Actions.pop();
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
        let defaultAction = () => { this.props.eventBus.emit('hideLoading');};
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Appliance in the Cloud. Please try again later.",
          [{text:'OK', onPress: defaultAction }],
          { onDismiss: defaultAction }
        )
      });
  }

  render() {
    return (
      <Background image={this.props.backgrounds.stoneDetailsBackground} >
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
