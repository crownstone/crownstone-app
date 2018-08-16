import * as React from 'react';
import { Component } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import {
  styles, colors, screenWidth, screenHeight} from '../../styles'
import { HiddenFadeInView } from "./FadeInView";
import { eventBus }  from "../../../util/EventBus";

export class AnimatedMenu extends Component<any, any> {
  visible    : boolean;
  menuHeight : number;
  _panResponder: any = {};

  menuItemWidth = Math.min(0.75*screenWidth, 250);
  menuItemHeight = 60;
  menuSpacerHeight = 3;

  constructor(props) {
    super(props);
    this.state = {
      viewHeight: new Animated.Value(props.visible ? this.menuHeight : 0),
      position: {top:0, left:0, right:0, bottom:0},
      content: [],
      visible: false
    };

    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.hide();
      },
      onPanResponderMove: (evt, gestureState) => {},
      onPanResponderRelease: (evt, gestureState) => {},
      onPanResponderTerminate: (evt, gestureState) => {},
      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true;
      },
    });

    eventBus.on("showBlurredMenu", (data) => {
      if (data.fields && Array.isArray(data.fields)) {
        this.setState({content: data.fields, position: data.position});
        this.show()
      }
    })
  }


  show() {
    this.setState({visible:true}, () => {
      Animated.timing(this.state.viewHeight, {toValue: screenHeight, duration:450}).start()
    })
  }

  hide() {
    Animated.timing(this.state.viewHeight, {toValue: 0, duration:450}).start(() => {
      this.setState({ visible: false, content: [] });
    });
  }
  instantHide() {
    this.setState({ visible: false, content: [] });
    this.state.viewHeight.setValue(0);
  }

  _getFields() {
    let fields = [];
    for (let i = 0; i < this.state.content.length; i++) {
      let field = this.state.content[i];
      fields.push(
        <TouchableOpacity
          key={field.label}
          style={{
            width: this.menuItemWidth,
            height: this.menuItemHeight,
            alignItems: 'center',
            justifyContent:'center',
          }}
          onPress={() => { this.instantHide(); field.onPress();  }}>
          <Text style={{backgroundColor:"transparent", fontSize:16, color:colors.black.rgba(0.5), fontWeight:'500', fontStyle:'italic'}}>{field.label}</Text>
        </TouchableOpacity>
      );
      if (i < this.state.content.length -1) {
        fields.push(<View style={{width:this.menuItemWidth, height:this.menuSpacerHeight, backgroundColor:colors.white.rgba(0.1)}} key={field.label+"_spacer"} />);
      }
    }

    return fields
  }

  render() {
    let totalHeight = this.menuItemHeight*this.state.content.length+ (this.state.content.length-1)*this.menuSpacerHeight;
    return (
      <HiddenFadeInView
        style={[styles.fullscreen]}
        height={screenHeight}
        duration={30}
        visible={this.state.visible}
      >
        <Animated.View
          style={{
            position:'absolute',
            overflow:'hidden',
            width: screenWidth,
            height: this.state.viewHeight,
          }}>
          <View
            style={{
              position:'absolute',
              overflow:'hidden',
              width: screenWidth,
              height: screenHeight,
            }}
            {...this._panResponder.panHandlers}
          />
          <View
            style={{
              ...this.state.position,
              position:'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
            }}
          />
          <View
            style={[this.state.style,
              {...this.state.position},
              {position:'absolute',
                width: this.menuItemWidth,
                height: totalHeight,
                borderRadius:15,
              }]}
          />
          <View style={{
            ...this.state.position,
            position:'absolute',
            width: this.menuItemWidth,
            height: totalHeight,
            flexDirection:'column',
            borderRadius:15,
            backgroundColor: colors.white.rgba(0.2),
            borderWidth:2,
            borderStyle:'solid',
            borderColor: colors.white.rgba(0.2),
          }}>
            {this._getFields()}
          </View>
        </Animated.View>
      </HiddenFadeInView>
    );
  }
}