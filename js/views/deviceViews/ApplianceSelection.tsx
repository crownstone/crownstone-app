import { Languages } from "../../Languages"
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

import { Background } from '../components/Background'
import { ApplianceEntry } from '../components/ApplianceEntry'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'

const Actions = require('react-native-router-flux').Actions;
import {styles, colors, OrangeLine} from './../styles'
import { Icon } from '../components/Icon';
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {EventBusClass} from "../../util/EventBus";
import {BackAction} from "../../util/Back";

export class ApplianceSelection extends Component<{
  sphereId: string,
  applianceId: string,
  stoneId: string,
  eventBus: EventBusClass,
  store: any,
  backgrounds: any,
  callback(applianceId: string): void
  }, any> {

  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: Languages.title("ApplianceSelection", "Select_Device_Type")(),
    }
  };


  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      // if the stone has been deleted, close everything.
      if (change.removeStone && change.removeStone.stoneIds[this.props.stoneId]) {
        return BackAction();
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
      items.push({label: Languages.label("ApplianceSelection", "ALL_DEVICES")(), type: 'lightExplanation',  below:false});

      applianceIds.forEach((applianceId) => {
        let appliance = appliances[applianceId];

        let selectCallback = () => { this.props.callback(applianceId); BackAction(); };
        let deleteCallback = () => {
          Alert.alert(
Languages.alert("ApplianceSelection", "_Are_you_sure___We_will_b_header")(),
Languages.alert("ApplianceSelection", "_Are_you_sure___We_will_b_body")(appliance.config.name),
[{text:Languages.alert("ApplianceSelection", "_Are_you_sure___We_will_b_left")(), style: 'cancel'}, {
text:Languages.alert("ApplianceSelection", "_Are_you_sure___We_will_b_right")(), style: 'destructive', onPress: () => { this._removeAppliance(store, state, applianceId); }}])
        };

        items.push({__item:
          <View >
            <View style={[styles.listView,{backgroundColor: this.props.applianceId === applianceId ? colors.white.hex : colors.white.rgba(0.65), paddingRight:0}]}>
              <ApplianceEntry
                select={selectCallback}
                delete={Permissions.inSphere(this.props.sphereId).removeAppliance ? deleteCallback : undefined}
                deleteColor={this.props.applianceId === applianceId ? colors.black.rgba(0.3) : colors.white.hex }
                current={this.props.applianceId === applianceId }
                icon={appliance.config.icon}
                name={appliance.config.name}
                navigation={false}
                size={45}
              />
            </View>
          </View>
        })
      });
    }


    items.push({label: Languages.label("ApplianceSelection", "ADD_DEVICE_TYPES")(), type: 'lightExplanation', below:false});
    items.push({
      label: Languages.label("ApplianceSelection", "Add_a_device_type")(),
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
      label: Languages.label("ApplianceSelection", "No_device_type_assigned")(),
      largeIcon: <Icon name="md-cube" size={45} color={colors.menuBackground.hex} />,
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
        this.props.callback(null); BackAction();
      }
    });

    items.push({ type: 'spacer' });
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
        Alert.alert(
Languages.alert("ApplianceSelection", "_Encountered_Cloud_Issue__header")(),
Languages.alert("ApplianceSelection", "_Encountered_Cloud_Issue__body")(),
[{text:Languages.alert("ApplianceSelection", "_Encountered_Cloud_Issue__left")(), onPress: defaultAction }],
          { onDismiss: defaultAction }
        )
      });
  }

  render() {
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
