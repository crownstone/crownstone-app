
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View} from "react-native";

import { Icon } from '../Icon';
import { styles, colors, screenWidth } from "../../styles";
import {AnimatedCircle} from "../animated/AnimatedCircle";
import { core } from "../../../core";
import { DataUtil } from "../../../util/DataUtil";


export class DfuDeviceOverviewEntry extends Component<any, any> {
  baseHeight : number;

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;
  }

  _getIcon(stone) {
    let color = this.props.iconColor || colors.green.rgba(0.8);
    return (
      <AnimatedCircle size={60} color={color}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </AnimatedCircle>
    );
  }


  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];
    let location = DataUtil.getLocationFromStone(sphere, stone);
    let locationName = null;
    if (location) { locationName = location.config.name; }
    return (
      <View style={[styles.listView,{flexDirection: 'column', height: this.baseHeight, width: screenWidth, overflow:'hidden', backgroundColor:"transparent"}]}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <View style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}}>
            {this._getIcon(stone) }
          </View>
          <View style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: this.props.closeEnough ? 'bold' : '100'}}>{stone.config.name}</Text>
              { this.props.visible && !this.props.closeEnough ?
                <Text style={{fontSize: 14, fontWeight: '100'}}>{"In range but not close enough yet!"}</Text> :
                undefined }
              { !this.props.visible && !this.props.closeEnough ?
                <Text style={{fontSize: 14, fontWeight: '100'}}>{"Searching..."}</Text> :
                undefined }
              { !this.props.visible && !this.props.closeEnough && locationName ?
                <Text style={{fontSize: 12, fontWeight: '100'}}>{"Located in " + locationName + "."}</Text> :
                undefined }
              { this.props.closeEnough ?
                <Text style={{fontSize: 15, fontWeight: 'bold'}}>{"Close enough for update!"}</Text> :
                undefined }
            </View>
          </View>
        </View>
      </View>
    );
  }
}
