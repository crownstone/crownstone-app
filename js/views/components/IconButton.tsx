import * as React from 'react'; import { Component } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Icon } from './Icon'
import { styles, colors} from '../styles'

/**

 */
export class IconButton extends Component<
  {
    name:             string,
    size:             number,
    color:            string,
    buttonSize?:      number,
    button?:          boolean,
    addIcon?:         boolean,
    radius?:          number,
    plusSize?:        number,
    addColor?:        string,
    buttonStyle?:     any,
    style?:           any,
    showLoadingIcon?: boolean
  }, any> {


  render() {
    let iconSize = this.props.buttonSize || 30;
    if (this.props.addIcon) {
      let plusSize = this.props.plusSize || 0.3*iconSize;
      return (
        <View style={{width:iconSize+plusSize, height:iconSize+0.2*plusSize, overflow:'hidden'}}>
        <View style={[{
          width: iconSize,
          height: iconSize,
          borderRadius: this.props.radius || iconSize/5,
          padding:0,
          margin:0,
          position:'relative',
          left: 0.5*plusSize,
          top: 0.2*plusSize
        }, styles.centered, this.props.buttonStyle]}>
          {this.props.showLoadingIcon ? <ActivityIndicator animating={true} size={iconSize > 50 ? 'large' : 'small' }  /> : <Icon {...this.props} /> }
        </View>
        <View style={[{
          width:plusSize,
          height:plusSize,
          borderRadius:plusSize*0.5,
          backgroundColor: this.props.addColor || colors.green.hex,
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
        <View style={[{
          width: iconSize,
          height: iconSize,
          borderRadius: this.props.radius || (iconSize)/5,
          padding:0,
          margin:0,
          }, styles.centered, this.props.buttonStyle
        ]}>
          {this.props.showLoadingIcon ? <ActivityIndicator animating={true} size={iconSize > 50 ? 'large' :  'small'}  /> : <Icon {...this.props} /> }
        </View>
      )
    }
  }
}