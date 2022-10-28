import * as React from 'react';
import {  View } from 'react-native';
import { styles, colors} from '../styles'
import { HighlightableIcon } from "./animated/HighlightableIcon";
import {Blur} from "./Blur";

/**

 */
export function IconBlurButton(props: {
    name:             string,
    size:             number,
    color:            string,
    buttonSize?:      number,
    addIcon?:         boolean,
    radius?:          number,
    circle?:          boolean,
    plusSize?:        number,
    addColor?:        string,
    highlight?:       boolean,
    buttonStyle?:     any,
    style?:           any,
  }) {

  let iconSize = props.buttonSize || 30;
  if (props.addIcon) {
    let plusSize = props.plusSize || 0.3*iconSize;
    return (
      <View style={{width:iconSize+plusSize, height:iconSize+0.2*plusSize, overflow:'hidden'}}>
        <Blur blurType={'light'} style={[{
          width: iconSize,
          height: iconSize,
          borderRadius:  props.circle ? iconSize/2 : (props.radius || (iconSize)/5),
          padding:0,
          margin: 0,
          position:'relative',
          left: 0.5*plusSize,
          top:  0.2*plusSize
        }, styles.centered, props.buttonStyle]}>
          <HighlightableIcon {...props} enabled={props.highlight ?? false} />
        </Blur>
        <View style={[{
          width:plusSize,
          height:plusSize,
          borderRadius:plusSize*0.5,
          backgroundColor: props.addColor || colors.green.hex,
          borderColor: '#ffffff',
          borderWidth: 3,
          alignItems:'center',
          justifyContent:'center',
          position:'relative',
          top:-iconSize,
          left:iconSize-0.25*plusSize,
        }]}>
          <HighlightableIcon name={'md-add'} size={plusSize/1.5} color={'#ffffff'} enabled={props.highlight ?? false} />
        </View>
    </View>
    );
  }
  else {
    return (
      <Blur blurType={'light'} style={[{
        width: iconSize,
        height: iconSize,
        borderRadius: props.circle ? iconSize/2 : (props.radius || (iconSize)/5),
        padding:0,
        margin:0,
        }, styles.centered, props.buttonStyle
      ]}>
        <HighlightableIcon {...props} enabled={props.highlight ?? false} />
      </Blur>
    )
  }
}
