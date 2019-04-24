
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddItemButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  View
} from 'react-native';
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { NavigationUtil } from "../../../util/NavigationUtil";



export class AddSetupStoneButton extends Component<any, any> {
  render() {
    let outerRadius = 0.15*screenWidth;
    let size = 0.11*screenWidth;
    return (
      <TouchableOpacity style={{
        position:'absolute',
        bottom: 0,
        right: 0,
        padding: 6,
        paddingLeft:10,
        paddingTop:10,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
    }}
    onPress={() => { NavigationUtil.navigate("AddItemsToSphere",{sphereId: this.props.sphereId}); }}>
    <View style={{
      width: outerRadius,
      height:outerRadius,
      borderRadius:0.5*outerRadius,
      backgroundColor: colors.menuTextSelected.rgba(1),
      alignItems:'center',
      justifyContent:'center',
    }}>
    <Icon name="c3-addRounded" size={ size } color={ colors.white.hex } />
    </View>
    </TouchableOpacity>
  );
  }
}
