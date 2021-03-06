
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TextCircle", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';
import {UserPicture} from "./UserPicture";
import {colors, styles} from "../../styles";

export class TextCircle extends UserPicture {
  x : number;
  y : number;
  opacity : number;

  render() {
    return (
      <Animated.View style={{position:'absolute', width: this.props.size, height: this.props.size, top: this.state.y, left: this.state.x, opacity: this.state.opacity}}>
        <View style={[{
          width:this.props.size,
          height:this.props.size,
          backgroundColor:colors.blue3.hex,
          borderRadius:0.5*this.props.size,
          borderWidth:0.07*this.props.size,
          borderColor:"#fff"}, styles.centered]}>
          <Text style={nameStyle}>{this.props.text}</Text>
        </View>
      </Animated.View>
    );
  }
}

let nameStyle = {
  color:'#fff',
  fontSize:15,
  backgroundColor:'transparent',
};
