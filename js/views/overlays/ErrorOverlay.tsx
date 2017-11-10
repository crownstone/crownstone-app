import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import { IconButton }         from '../components/IconButton'
import { OverlayBox }         from '../components/overlays/OverlayBox'
import { styles, colors , screenHeight, screenWidth, availableScreenHeight } from '../styles'
import { eventBus } from "../../util/EventBus";
import { Util } from "../../util/Util";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {LOG} from "../../logging/Log";
import {Scheduler} from "../../logic/Scheduler";
import {ErrorContent} from "../content/ErrorContent";
const Actions = require('react-native-router-flux').Actions;

let SEE_THROUGH_OPACITY = 0.33;


export class ErrorOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      maxOpacity: 1,
      clearingEnabled: false,
      stonesContainingError: [] // [{ stoneId : stoneId, stone: stoneObject }]
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showErrorOverlay", (stonesContainingError) => {
      if (stonesContainingError.length > 0) {
        this.setState({visible: true, maxOpacity: 1, stonesContainingError: stonesContainingError, clearingEnabled: false});
      }
    }));

    this.unsubscribe.push(eventBus.on("showResolveErrorOverlay", (stoneContainingError) => {
      this.setState({visible: true, maxOpacity: 1, stonesContainingError: [stoneContainingError], clearingEnabled: true});
    }));

    // setTimeout(() => {
    //   let state = this.props.store.getState();
    //   let sphereId = Object.keys(state.spheres)[0];
    //   let stoneId = Object.keys(state.spheres[sphereId].stones)[0];
    //
    //   eventBus.emit("showErrorOverlay", [{ sphereId: sphereId, stoneId: stoneId, stone: state.spheres[sphereId].stones[stoneId] }]);
    // }, 400);
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getTitle() {
    if (this.state.clearingEnabled) {
      return ("Resolving Hardware Errors");
    }
    else {
      return ("Crownstone Hardware Error");
    }
  }

  _getText() {
    if (this.state.stonesContainingError.length === 0) {
      return;
    }

    let phase = this.state.clearingEnabled ? 2 : 1;
    return ErrorContent.getTextDescription(phase, this.state.stonesContainingError[0].stone.errors);
  }


  _getFirstError() {
    if (this.state.stonesContainingError[0].stone.errors.temperatureDimmer) {
      return 'temperatureDimmer';
    }
    else if (this.state.stonesContainingError[0].stone.errors.temperatureChip) {
      return 'temperatureChip';
    }
    else if (this.state.stonesContainingError[0].stone.errors.overCurrentDimmer) {
      return 'overCurrentDimmer';
    }
    else if (this.state.stonesContainingError[0].stone.errors.overCurrent) {
      return 'overCurrent';
    }
  }

  _getButton() {
    if (this.state.clearingEnabled) {
      return (
        <View style={{flexDirection:'row'}}>
          <View style={{flex:1}} />
          <TouchableOpacity
            onPress={() => {
              this.setState({visible:false});
            }}
            style={[styles.centered, {
              width: 0.35 * screenWidth,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: colors.red.hex,
            }]}>
            <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.red.hex}}>{"Ignore"}</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <TouchableOpacity
            onPress={() => {
              let currentCrownstone = this.state.stonesContainingError[0];
              let clearData = {};
              let clearDataInStore = {};
              let firstErrorToClear = this._getFirstError();
              clearData[firstErrorToClear] = true;
              clearDataInStore[firstErrorToClear] = true;

              eventBus.emit("showLoading", "Attempting to Reset Error...");
              BatchCommandHandler.loadPriority(
                currentCrownstone.stone,
                currentCrownstone.stoneId,
                currentCrownstone.sphereId,
                {commandName:'clearErrors', clearErrorJSON: clearData},
                {},
                1000,
                'from _getButton in ErrorOverlay'
              )
              .then(() => {
                eventBus.emit("showLoading", "Success!");
                this.props.store.dispatch({type: 'RESET_STONE_ERRORS', sphereId: currentCrownstone.stoneId, stoneId: currentCrownstone.sphereId, data: clearDataInStore});
                return Scheduler.delay(500);
              })
              .then(() => {
                eventBus.emit("showLoading", "Restarting Crownstone...");
                return Scheduler.delay(2000);
              })
              .then(() => {
                eventBus.emit("hideLoading");
                let defaultAction = () => {
                  this.setState({visible:false});
                }; 
                Alert.alert("Success!","The Error has been reset. Normal functionality is re-enabled.",[{text:'OK', onPress: defaultAction}], { onDismiss: defaultAction});
              })
              .catch((err) => {
                LOG.error("ErrorOverlay: Could not reset error of Crownstone", firstErrorToClear, err);
                let defaultAction = () => { eventBus.emit("hideLoading"); };
                Alert.alert("Failed to reset error :(","You can move closer and try again or ignore the error for now.",[{text:'OK', onPress: defaultAction}], { onDismiss: defaultAction});
              });

              BatchCommandHandler.executePriority()
            }}
            style={[styles.centered, {
              width: 0.35 * screenWidth,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              backgroundColor:colors.red.hex,
              borderColor: colors.red.hex,
            }]}>
            <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.white.hex}}>{"Reset error"}</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      );
    }
    else {
      return (
        <TouchableOpacity
          onPress={() => {
            let currentCrownstone = this.state.stonesContainingError[0];
            let locationId = currentCrownstone.stone.config.locationId;
            Actions.roomOverview({
              sphereId: currentCrownstone.sphereId,
              locationId: locationId,
              errorCrownstone: currentCrownstone.stoneId
            });
            this.setState({maxOpacity: SEE_THROUGH_OPACITY});
            setTimeout(() => {
              eventBus.emit("showErrorInOverview", currentCrownstone.stoneId);
              this.setState({visible: false});
            }, 300);
          }}
          style={[styles.centered, {
            width: 0.4 * screenWidth,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.red.hex,
          }]}>
          <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.red.hex}}>{"Find" + (this.state.stonesContainingError.length > 1 ? ' 1st' : '') + " Crownstone"}</Text>
        </TouchableOpacity>
      );
    }
  }


  render() {
    let aiData = { name: 'Amy' };
    if (this.state.stonesContainingError.length > 0) {
      aiData = Util.data.getAiData(this.props.store.getState(), this.state.stonesContainingError[0].sphereId);
    }

    return (
      <OverlayBox visible={this.state.visible} height={0.95*availableScreenHeight} maxOpacity={this.state.maxOpacity} overrideBackButton={true}>
        <View style={{flex:1}} />
        <IconButton
          name="ios-warning"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.red.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative',}}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex, padding:15, textAlign:'center'}}>{this._getTitle()}</Text>
        <Text style={{fontSize: 12, fontWeight: '500',  color: colors.red.hex, padding:15, paddingBottom: 0, textAlign:'center'}}>
          {this._getText()}
        </Text>
        <Text style={{fontSize: 12, fontWeight: '400',  color: colors.red.hex, padding:15, paddingTop:5, alignSelf:'flex-end', fontStyle:'italic'}}>
          {'~ Yours, ' + aiData.name}
        </Text>
        <View style={{flex:1}} />
        {this._getButton()}
        <View style={{flex:1}} />
      </OverlayBox>
    );
  }
}