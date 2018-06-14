import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  View
} from 'react-native';
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import {eventBus} from "../../../util/EventBus";

export class SphereChangeButton extends Component<any, any> {
  render() {
    let outerRadius = 0.11*screenWidth;
    let size = 0.084*screenWidth;
    let color = this.props.viewingRemotely === false ? colors.menuBackground.rgba(0.75) : colors.notConnected.hex;
    return (
      <TouchableOpacity
        style={{
          position:'absolute',
          top: 0,
          left: 0,
          padding: 6,
          paddingRight:10,
          paddingBottom:10,
          flexDirection:'row',
          alignItems:'center',
          justifyContent:'center',
        }}
        onPress={() => { eventBus.emit('showSphereSelectionOverlay'); }}
      >
        <View style={{
          width: outerRadius,
          height:outerRadius,
          borderRadius:0.5*outerRadius,
          backgroundColor: colors.white.rgba(0.5),
          alignItems:'center',
          justifyContent:'center',
        }}>
          <Icon name="c1-sphere" size={size} color={ color } />
        </View>
      </TouchableOpacity>
    );
  }
}