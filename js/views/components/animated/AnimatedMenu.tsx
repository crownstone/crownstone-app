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

import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight} from '../../styles'
import { BlurView } from 'react-native-blur';

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
      opacity: new Animated.Value(props.visible ? 1 : 0),
      showMenuOverlay: false
    };
    this.visible = props.visible || false;
  }

  componentWillMount() {

    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.props.closeMenu();
      },
      onPanResponderMove: (evt, gestureState) => {},
      onPanResponderRelease: (evt, gestureState) => {},
      onPanResponderTerminate: (evt, gestureState) => {},
      onShouldBlockNativeResponder: (evt, gestureState) => {
        return true;
      },
    });
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.visible !== nextProps.visible) {
      if (nextProps.visible === true) {
        this.show();
      }
      else {
        this.hide();
      }
    }
  }

  show() {
    this.setState({showMenuOverlay:true}, () => {
      this.visible = true;
      let animations = [
        Animated.timing(this.state.opacity, {toValue: 1, duration:250}),
        Animated.timing(this.state.viewHeight, {toValue: screenHeight, duration:450})
      ];
      Animated.parallel(animations).start();
    })
  }

  hide() {
    let animations = [
      Animated.timing(this.state.opacity, {toValue: 0, duration:200, delay: 300}),
      Animated.timing(this.state.viewHeight, {toValue: 0, duration:450})
    ];
    Animated.parallel(animations).start(() => {
      setTimeout(() => {
        this.setState({ showMenuOverlay: false });
      },30);
      this.visible = false;
    });
  }

  _getFields() {
    let fields = [];
    for (let i = 0; i < this.props.fields.length; i++) {
      let field = this.props.fields[i];
      fields.push(
        <TouchableOpacity
          key={field.label}
          style={{
            width: this.menuItemWidth,
            height: this.menuItemHeight,
            alignItems: 'center',
            justifyContent:'center',
          }}
          onPress={() => { field.onPress(); this.props.closeMenu(); }}>
          <Text style={{backgroundColor:"transparent", fontSize:16, color:colors.black.rgba(0.5), fontWeight:'500', fontStyle:'italic'}}>{field.label}</Text>
        </TouchableOpacity>
      );
      if (i < this.props.fields.length -1) {
        fields.push(<View style={{width:this.menuItemWidth, height:this.menuSpacerHeight, backgroundColor:colors.white.rgba(0.1)}} key={field.label+"_spacer"} />);
      }
    }

    return fields
  }

  render() {
    if (this.state.showMenuOverlay) {
      let totalHeight = this.menuItemHeight*this.props.fields.length+ (this.props.fields.length-1)*this.menuSpacerHeight
      return (
        <Animated.View
          style={{
            position:'absolute',
            overflow:'hidden',
            opacity: this.state.opacity,
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
              ...this.props.position,
              position:'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
            }}
          />
          <BlurView
            style={[this.props.style,
            {...this.props.position},
            {position:'absolute',
              width: this.menuItemWidth,
              height: totalHeight,
              borderRadius:15,
            }]}
            blurType="light"
            blurAmount={20}
          />
          <View style={{
            ...this.props.position,
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
      );
    }
    else {
      return <View/>;
    }


  }
}