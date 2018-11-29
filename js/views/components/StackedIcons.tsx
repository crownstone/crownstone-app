
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StackedIcons", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

export class StackedIcons extends Component<{items:any[], size: number, keyBase: string}, any> {
  render() {
    let overlapFactor = 0.2;
    let inv = (1-overlapFactor);
    let allPositions = {
      1: [{x:0,y:0}],
      2: [{x:0,y:0}, {x: this.props.size * inv, y: 0}],
      3: [{x:0,y:0}, {x: this.props.size * inv, y: 0}, {x: this.props.size * inv * 0.5, y: inv*0.85*this.props.size}],
      4: [{x:0,y:0}, {x: this.props.size * inv, y: 0}, {x: 0, y: this.props.size * inv}, {x: this.props.size * inv, y: this.props.size * inv}],
    };
    let allSizes = {
      1: [this.props.size, this.props.size],
      2: [(1+inv)*this.props.size, this.props.size],
      3: [(1+inv)*this.props.size, (1+inv*0.85)*this.props.size],
      4: [(1+inv)*this.props.size, (1+inv)*this.props.size],
    };

    let items = [];
    let amount = Math.min(4,this.props.items.length);

    let pos = allPositions[amount];
    let size = allSizes[amount];

    for (let i = 0; i < amount; i++) {
      items.push(
        <View key={'stackedItems' + this.props.keyBase + '_' + i} style={{ position:'absolute', top: pos[i].y, left: pos[i].x }}>
          {this.props.items[i]}
        </View>
      );
    }

    return (
      <View style={{ width: size[0], height: size[1], position: 'relative', }}>
        {items}
      </View>
    );
  }
}