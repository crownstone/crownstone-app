import * as React from 'react'; import { Component } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Icon } from './Icon'
import { styles, colors} from '../styles'
import {BlurView} from "@react-native-community/blur";

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
    buttonStyle?:     any,
    style?:           any,
    showLoadingIcon?: boolean
  }) {

  let iconSize = props.buttonSize || 30;
  if (props.addIcon) {
    let plusSize = props.plusSize || 0.3*iconSize;
    return (
      <View style={{width:iconSize+plusSize, height:iconSize+0.2*plusSize, overflow:'hidden'}}>
        <BlurView blurType={'light'} style={[{
          width: iconSize,
          height: iconSize,
          borderRadius:  props.circle ? iconSize/2 : (props.radius || (iconSize)/5),
          padding:0,
          margin: 0,
          position:'relative',
          left: 0.5*plusSize,
          top:  0.2*plusSize
        }, styles.centered, props.buttonStyle]}>
          {props.showLoadingIcon ? <ActivityIndicator animating={true} size={iconSize > 50 ? 'large' : 'small' }  /> : <Icon {...props} /> }
        </BlurView>
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
          <Icon name={'md-add'} size={plusSize/1.5} color={'#ffffff'} />
        </View>
    </View>
    );
  }
  else {
    return (
      <BlurView blurType={'light'} style={[{
        width: iconSize,
        height: iconSize,
        borderRadius: props.circle ? iconSize/2 : (props.radius || (iconSize)/5),
        padding:0,
        margin:0,
        }, styles.centered, props.buttonStyle
      ]}>
        {props.showLoadingIcon ? <ActivityIndicator animating={true} size={iconSize > 50 ? 'large' :  'small'}  /> : <Icon {...props} /> }
      </BlurView>
    )
  }
}
