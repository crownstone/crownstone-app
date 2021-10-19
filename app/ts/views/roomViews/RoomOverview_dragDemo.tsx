
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Animated,
  TouchableWithoutFeedback
} from "react-native";
import { Component } from "react";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Background } from "../components/Background";
import { availableScreenHeight, colors, screenWidth, styles } from "../styles";
import { core } from "../../Core";
import { Circle } from "../components/Circle";
import { Icon } from "../components/Icon";

export class RoomOverview_dragDemo extends Component<any, any> {
  static options(props) {
    getTopBarProps({ }, props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  selectedNode = null
  panListener
  _panResponder

  constructor(props) {
    super(props);

    this.state = {
      scrollEnabled: true,
      dimOpacity: new Animated.Value(0),
    };

    this.init()
  }


  componentDidMount() {
  }

  init() {
    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder:        (evt, gestureState) => {
        console.log("onStartShouldSetPanResponder");
        return true;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        console.log("onStartShouldSetPanResponderCapture");
        return false;
      },
      onMoveShouldSetPanResponder:         (evt, gestureState) => {
        console.log("onMoveShouldSetPanResponder");
        return true;
      },
      onMoveShouldSetPanResponderCapture:  (evt, gestureState) => {
        console.log("onMoveShouldSetPanResponderCapture");
        return true;
      },
      onPanResponderTerminationRequest:    (evt, gestureState) => {
        console.log("onPanResponderTerminationRequest");
        return true;
      },
      onPanResponderGrant:                 (evt, gestureState) => {
        console.log("onPanResponderGrant");
        return false
      },
      onPanResponderMove: (evt, gestureState) => {
        if (this.selectedNode !== null) {
          core.eventBus.emit('nodeDragging' + this.selectedNode, gestureState);
          let threshold = 90;
          let opacity = ((gestureState.x0 + gestureState.dx)-threshold) / (0.5*screenWidth - threshold);

          if (this.state.dimOpacity._value != 1 && (gestureState.x0 + gestureState.dx) >= threshold) {
            this.state.dimOpacity.setValue(Math.min(1, Math.max(0, opacity)))
          }
        }
        else {

        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log("onPanResponderRelease")
        core.eventBus.emit('nodeReleased' + this.selectedNode, gestureState)
        if (this.selectedNode !== null) {
          this.setState({ scrollEnabled: false })
        }
        Animated.timing(this.state.dimOpacity,{toValue: 0, duration: 100, useNativeDriver: false}).start()
        this.selectedNode = null;
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onPanResponderTerminate: (evt, gestureState) => {
        console.log("onPanResponderTerminate")
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        console.log("onShouldBlockNativeResponder")
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    })
  }

  componentWillUnmount() {
    // we keep open a connection for a few seconds to await a second command
    NAVBAR_PARAMS_CACHE = null;
  }

  getItems() {
    return [
      <Item id={1} icon="ios-play" pos={{x:10, y:  30}} selectedCallback={(id) => { this.setState({scrollEnabled: false}); this.selectedNode = id; }}/>,
      <Item id={2} icon="ios-cog"  pos={{x:10, y: 130}} selectedCallback={(id) => { this.setState({scrollEnabled: false}); this.selectedNode = id; }}/>,
    ]
  }

  render() {
    return (
      <Background image={require("../../../assets/images/test/test.jpg")} hideNotifications={true}>
        <ScrollView scrollEnabled={this.state.scrollEnabled} {...this._panResponder.panHandlers}>
          <Animated.View pointerEvents="none" style={{position:'absolute', top:0, left:0, width: screenWidth, height: availableScreenHeight, backgroundColor:'rgba(255,255,255,0.5)', opacity: this.state.dimOpacity, zIndex:100, ...styles.centered}}>
            <View style={{height: 0.75*availableScreenHeight, width: 60, borderRadius:30, backgroundColor:colors.green.hex, borderColor:colors.white.hex, borderWidth:3}}></View>
          </Animated.View>
          { this.getItems() }
        </ScrollView>

      </Background>
    );
  }
}


class Item extends Component<any, any> {
  unsubscribeControlEvents = []
  touchTimeout
  touchAnimation

  renderState

  scaledUp

  touching

  fixedLeft = false;



  constructor(props) {
    super(props);

    let initialX = props.pos.x;
    let initialY = props.pos.y;

    this.state = {
      top: new Animated.Value(initialY),
      left: new Animated.Value(initialX),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      touching: false,
      state: false
    };

    // this.energyLevels = [
    //   {min: 0, max: 50, color: colors.green.hex},
    //   {min: 50, max: 200, color: colors.orange.hex},
    //   {min: 200, max: 1000, color: colors.red.hex},
    //   {min: 1000, max: 4000, color: colors.darkRed.hex},
    // ];
  }


  componentDidMount() {
    this.unsubscribeControlEvents.push(core.eventBus.on('nodeReleased' + this.props.id, (data) => {
      this.handleTouchReleased(data);
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('nodeDragging' + this.props.id, (data) => {
      this.handleDragging(data);
    }));
  }



  componentWillUnmount() {
    this.unsubscribeControlEvents.forEach((unsubscribe) => { unsubscribe(); });
    clearTimeout(this.touchTimeout);
    cancelAnimationFrame(this.touchAnimation);
  }




  _getColor() {
    if (this.props.viewingRemotely === true) {
      return colors.green.rgba(0.5);
    }
    return colors.green.rgba(0.75);
  }

  getIcon() {
    return <Icon name={this.props.icon} size={60} color='#fff' />;

  }

  getCircle() {
    return (
      <Circle size={80} color={colors.white.hex}>
        <Circle size={76} color={this.state.state ? colors.green.hex : colors.menuBackground.hex}>
          {this.getIcon()}
        </Circle>
      </Circle>
    );
  }



  render() {
    const animatedStyle = {transform: [{scale: this.state.scale }]};

    return (
      <Animated.View style={[animatedStyle, {position:'absolute', top: this.state.top, left: this.state.left, opacity: this.state.opacity, zIndex: this.state.touching ? 1000 : 0}]}>
        <TouchableOpacity style={{marginLeft:50, marginTop:18, justifyContent: 'center'}} onPress={() => { Alert.alert("Crownstone settings")}}>
          <View style={{paddingLeft:35, paddingRight:15, padding:10, backgroundColor: colors.menuBackground.hex, borderRadius: 20, borderColor: colors.white.hex, borderWidth: 2}}>
            <Text style={{color:colors.white.hex, fontWeight:'bold'}}>Crownstone</Text>
          </View>
        </TouchableOpacity>
        <View style={{position:"absolute", top:0, left:0, width: 80}}>
        <TouchableWithoutFeedback
          onPressIn={() => {
            this.setState({touching: true})
            this.props.selectedCallback(this.props.id);
          }}
          onPress={() => {
            this.setState({state: !this.state.state})
          }}
        >
          <View>
            {this.getCircle()}
          </View>
        </TouchableWithoutFeedback>
        </View>
      </Animated.View>
    )
  }

  handleTouchReleased(data) {
    this.fixedLeft = false;
    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.top, {toValue: this.props.pos.y, useNativeDriver: false, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.left, {toValue: this.props.pos.x, useNativeDriver: false, duration: 100}));
    Animated.parallel(revertAnimations).start(() => {this.setState({touching: false})});
  }

  handleDragging(data) {
    this.touching = true;
    this.state.top.setValue(this.props.pos.y + data.dy);

    if (this.fixedLeft) {
      this.state.left.setValue(0.5*screenWidth - 40);
    }
    else {
      if (this.state.left._value >= 0.5*screenWidth - 40) {
        this.fixedLeft = true;
        this.state.left.setValue(0.5*screenWidth - 40);
      }
      else {
        this.state.left.setValue(this.props.pos.x + data.dx);
      }
    }



  }
}


function getTopBarProps(state, props) {
  NAVBAR_PARAMS_CACHE = { title: "Living room" }
  return NAVBAR_PARAMS_CACHE
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;



