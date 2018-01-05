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
      stonesContainingError: [] // [{ stoneId : stoneId, stone: stoneObject }]
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showErrorOverlay", (stonesContainingError) => {
      if (stonesContainingError.length > 0) {
        if (this.state.visible === false) {
          this.setState({
            visible: true,
            maxOpacity: 1,
            stonesContainingError: stonesContainingError,
          });
        }
      }
    }));

  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getText() {
    if (this.state.stonesContainingError.length === 0) {
      return;
    }

    return ErrorContent.getTextDescription(1, this.state.stonesContainingError[0].stone.errors);
  }

  _getButton() {
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
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex, padding:15, textAlign:'center'}}>{"Crownstone Hardware Error"}</Text>
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