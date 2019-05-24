import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ApplianceSelection", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ApplianceEntry } from '../components/ApplianceEntry'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'


import {styles, colors, } from './../styles'
import { Icon } from '../components/Icon';
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {EventBusClass} from "../../util/EventBus";

import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarBackButton } from "../components/topbar/TopbarButton";

export class ApplianceSelection extends LiveComponent<{
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
      title: lang("Select_Device_Type"),
      headerLeft: <TopbarBackButton text={lang("Back")} onPress={() => { navigation.goBack(null) }} />,
    }
  };


  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      // if the stone has been deleted, close everything.
      if (change.removeStone && change.removeStone.stoneIds[this.props.stoneId]) {
        return NavigationUtil.back();
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
    const store = core.store;
    const state = store.getState();

    let appliances = state.spheres[this.props.sphereId].appliances;
    let applianceIds = Object.keys(appliances);
    if (applianceIds.length > 0) {
      items.push({label: lang("ALL_DEVICES"), type: 'lightExplanation',  below:false});

      applianceIds.forEach((applianceId) => {
        let appliance = appliances[applianceId];

        let selectCallback = () => { this.props.callback(applianceId); NavigationUtil.back(); };
        let deleteCallback = () => {
          Alert.alert(
lang("_Are_you_sure___We_will_b_header"),
lang("_Are_you_sure___We_will_b_body",appliance.config.name),
[{text:lang("_Are_you_sure___We_will_b_left"), style: 'cancel'}, {
text:lang("_Are_you_sure___We_will_b_right"), style: 'destructive', onPress: () => { this._removeAppliance(store, state, applianceId); }}])
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


    items.push({label: lang("ADD_DEVICE_TYPES"), type: 'lightExplanation', below:false});
    items.push({
      label: lang("Add_a_device_type"),
      largeIcon: <Icon name="ios-add-circle" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
       NavigationUtil.navigate( "ApplianceAdd",{
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          callback: (applianceId) => {
            this.props.callback(applianceId);
          }
        });
      }
    });

    items.push({
      label: lang("No_device_type_assigned"),
      largeIcon: <Icon name="md-cube" size={45} color={colors.menuBackground.hex} />,
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
        this.props.callback(null); NavigationUtil.back();
      }
    });

    items.push({ type: 'spacer' });
    return items;
  }

  _removeAppliance(store, state, applianceId) {
    core.eventBus.emit('showLoading','Removing this appliance in the Cloud.');
    CLOUD.deleteAppliance(applianceId)
      .then(() => {
        core.eventBus.emit('hideLoading');
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
        let defaultAction = () => { core.eventBus.emit('hideLoading');};
        Alert.alert(
lang("_Encountered_Cloud_Issue__header"),
lang("_Encountered_Cloud_Issue__body"),
[{text:lang("_Encountered_Cloud_Issue__left"), onPress: defaultAction }],
          { onDismiss: defaultAction }
        )
      });
  }

  render() {
    return (
      <Background hasNavBar={false} image={core.background.detailsDark} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
