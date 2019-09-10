import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSummary", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
  View, ViewStyle, TextStyle
} from "react-native";

import { colors, screenWidth, screenHeight, availableScreenHeight, styles } from "../../styles";
import { Util }                from "../../../util/Util";
import { core } from "../../../core";

export class DeviceAbilities extends LiveComponent<any, any> {
  storedSwitchState = 0;
  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    this.state = {};
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
    });
  }

  componentWillUnmount() {
  }



  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const location = Util.data.getLocationFromStone(sphere, stone);

    return (
      <View style={{flex:1}}>
        <View style={{flex:1}} />
        <View style={{flexDirection:'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
          <Text adjustsFontSizeToFit={true} style={{color: colors.csBlueDark.hex, fontSize:28, fontWeight:'bold', textAlign:'center'}}>{stone.config.name}<Text style={{fontStyle:"italic",  fontWeight:'400'}} >{" in " + location.config.name}</Text></Text>
        </View>
      </View>
    )
  }
}