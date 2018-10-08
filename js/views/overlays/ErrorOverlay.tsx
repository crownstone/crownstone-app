import { Languages } from "../../Languages"
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
      stoneId: null,
      sphereId: null,
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showErrorOverlay", (data) => { // { stoneId : stoneId, sphereId: sphereId }
      if (this.state.visible === false) {
        this.setState({
          visible: true,
          maxOpacity: 1,
          stoneId: data.stoneId,
          sphereId: data.sphereId,
        });
      }
    }));

    this.unsubscribe.push(eventBus.on("updateErrorOverlay", (data) => { // { stoneId : stoneId, sphereId: sphereId }
      if (this.state.visible === true) {
        this.setState({
          stoneId: data.stoneId,
          sphereId: data.sphereId,
        });
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getText(stone) {
    if (stone === null) {
      return "";
    }

    return ErrorContent.getTextDescription(1, stone.errors);
  }

  _getButton(stone) {
    if (stone === null) {
      return <View />;
    }

    return (
      <TouchableOpacity
        onPress={() => {
          let locationId = stone.config.locationId;
          Actions.roomOverview({
            sphereId: this.state.sphereId,
            locationId: locationId,
            errorCrownstone: this.state.stoneId
          });
          this.setState({maxOpacity: SEE_THROUGH_OPACITY});
          setTimeout(() => {
            eventBus.emit("showErrorInOverview", this.state.stoneId);
            this.setState({visible: false, stoneId: null, sphereId: null});
          }, 300);
        }}
        style={[styles.centered, {
          width: 0.4 * screenWidth,
          height: 36,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: colors.red.hex,
        }]}>
        <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.red.hex}}>{ Languages.text("ErrorOverlay", "Find_Crownstone")() }</Text>
      </TouchableOpacity>
    );
  }


  render() {
    let aiData = { name: 'Amy' };
    let state = this.props.store.getState();
    let stone = null;
    if (this.state.sphereId) {
      aiData = Util.data.getAiData(state, this.state.sphereId);
      let sphere = state.spheres[this.state.sphereId];
      stone = sphere.stones[this.state.stoneId];
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
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex, padding:15, textAlign:'center'}}>{ Languages.text("ErrorOverlay", "Crownstone_Hardware_Error")() }</Text>
        <Text style={{fontSize: 12, fontWeight: '500',  color: colors.red.hex, padding:15, paddingBottom: 0, textAlign:'center'}}>
          {this._getText(stone)}
        </Text>
        <Text style={{fontSize: 12, fontWeight: '400',  color: colors.red.hex, padding:15, paddingTop:5, alignSelf:'flex-end', fontStyle:'italic'}}>{ Languages.text("ErrorOverlay", "__Yours__")(aiData.name) }</Text>
        <View style={{flex:1}} />
        {this._getButton(stone)}
        <View style={{flex:1}} />
      </OverlayBox>
    );
  }
}