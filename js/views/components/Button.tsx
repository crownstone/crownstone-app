import { Languages } from "../../Languages";


function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Button", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  TouchableOpacity, Text, View, } from "react-native";
import { colors, screenWidth, styles } from "../styles";
import { Icon } from "./Icon";


export function Button(props) {
  let size = 22;
  let margin = 10;
  let width = 0.85 * screenWidth;
  let height = 65;
  let fontSize = 15;
  let marginTop = 5;
  let marginSide = 5;

  if (props.xl) {
    width    = screenWidth - 2*margin;
    height   = 80;
    fontSize = 17;
    size     = 35;
    marginTop  = 10;
    marginSide = 10;
  }
  let iconShift : any = {marginLeft: marginSide};
  let iconPosition : any = {top: 0, left: 0};
  if (props.iconPosition === "right") {
    iconPosition = {top:0, right: 0};
    iconShift = {marginRight: marginSide};
  }

  return (
    <View style={{width:width+(props.hideIcon ? 0 : marginSide), height: height + marginTop, margin: margin, overflow:"hidden"}}>
      <TouchableOpacity style={{
        width:           width,
        height:          height,
        borderRadius:    20,
        backgroundColor: props.backgroundColor || colors.menuTextSelected.rgba(0.3),
        borderColor:     colors.white.rgba(0.8),
        borderWidth:     2,
        alignItems:      'center',
        justifyContent:  'center',
        marginTop:       marginTop,
        ...iconShift
      }}
      onPress={props.callback}>
        <Text style={{fontSize:fontSize, fontWeight:'bold', color:colors.white.rgba(0.8), textAlign:'center'}}>{props.label}</Text>
      </TouchableOpacity>

      {props.hideIcon === true ? null :
        <View style={[{
          position: 'absolute',
          ...iconPosition,
          width: size,
          height: size,
          borderRadius: size * 0.5,
          backgroundColor: props.iconColor || colors.green.hex,
          borderColor: colors.white.hex,
          borderWidth: 2
        }, styles.centered]}>
          {props.iconObject ||
          <Icon name={props.icon || 'md-add'} size={props.iconSize || size * 0.75} color={colors.white.hex}/>}
        </View>
      }
    </View>
  );
}
//
// export function BehaviourQuestion(props) {
//   let buttonStyle : ViewStyle = {
//     width:60,
//     height:60,
//     borderRadius:20,
//     alignItems:'center',
//     backgroundColor: colors.white.rgba(0.2),
//     justifyContent: 'center',
//     padding:10,
//   };
//   return (
//     <View style={{
//       flexDirection:'row',
//       width:screenWidth,
//       height:60,
//       borderRadius:20,
//       margin:10,
//     }}>
//       <View style={{flex:1}} />
//       <Text style={{fontSize:15, fontWeight:'bold', width:screenWidth - 170, color:colors.white.rgba(0.55)}}>{props.label}</Text>
//
//       <View style={{flex:1}} />
//       <TouchableOpacity style={buttonStyle} onPress={props.yesCallback}>
//         <Text style={{fontSize:15, fontWeight:'bold', color:colors.white.rgba(0.55), textAlign:'center'}}>{ lang("Yes") }</Text>
//       </TouchableOpacity>
//       <View style={{flex:1}} />
//       <TouchableOpacity style={buttonStyle} onPress={props.noCallback}>
//         <Text style={{fontSize:15, fontWeight:'bold', color:colors.white.rgba(0.55), textAlign:'center'}}>{ lang("No") }</Text>
//       </TouchableOpacity>
//       <View style={{flex:1}} />
//     </View>
//   );
// }
