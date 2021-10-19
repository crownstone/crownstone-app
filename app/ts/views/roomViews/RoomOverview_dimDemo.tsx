
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

export class RoomOverview_dimDemo extends Component<any, any> {
  static options(props) {
    getTopBarProps({ }, props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  selectedNode = null
  panListener
  _panResponder

  order = [1,2,3,4,5]

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
        }
        else {

        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        console.log("onPanResponderRelease")
        if (this.selectedNode !== null) {
          let pointInOrder = this.order.indexOf(this.selectedNode);
          let initialTop = pointInOrder * 100 + 30;
          let newTop = initialTop + gestureState.dy;
          let diff = newTop - initialTop;
          let stepsToMove = Math.floor(Math.abs(diff / 100)) * Math.abs(diff) / diff;

          if (stepsToMove === 0) {
            this.setState({ scrollEnabled: false })
            core.eventBus.emit('nodeReleased' + this.selectedNode, gestureState)
            this.selectedNode = null;
          }
          else {
            let newPlaceInOrder = Math.max(0, Math.min(this.order.length - 1, pointInOrder + stepsToMove));
            let newOrder = [...this.order];
            newOrder.splice(pointInOrder, 1);
            newOrder.splice(newPlaceInOrder, 0, this.selectedNode);
            this.order = newOrder;
            this.setState({ scrollEnabled: false }, () => {
              core.eventBus.emit('nodesReordered', gestureState)
              this.selectedNode = null;
            });
          }
        }
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
    let items = {
      1: "ios-play",
      2: "ios-cog",
      3: "ios-pause",
      4: "ios-male",
      5: "ios-female",
    }

    let sets = [];
    let counter = 0;
    for (let itemId of this.order) {
      let data = items[itemId];
      sets.push(<Item key={"ITEM" + itemId}  id={itemId} icon={data} pos={{x:10, y: 30 + 100*counter++}} selectedCallback={(id) => { this.setState({scrollEnabled: false}); this.selectedNode = id; }}/>);
    }
    return sets;
  }

  render() {
    return (
      <Background image={require("../../../assets/images/test/test.jpg")} hideNotifications={true}>
        <ScrollView scrollEnabled={this.state.scrollEnabled} {...this._panResponder.panHandlers} style={{backgroundColor:'rgba(0,0,0,0.3)'}}>
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
  }


  componentDidMount() {
    this.unsubscribeControlEvents.push(core.eventBus.on('nodesReordered', (data) => {
      this.handleTouchReleased(data);
    }));

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
    return <Icon name={this.props.icon} size={50} color='#fff' />;

  }

  getCircle() {
    return (
      <Circle size={70} color={colors.white.hex}>
        <Circle size={66} color={this.state.state ? colors.green.hex : colors.menuBackground.hex}>
          {this.getIcon()}
        </Circle>
      </Circle>
    );
  }



  render() {
    const animatedStyle = {transform: [{scale: this.state.scale }]};

    return (
      <Animated.View style={[animatedStyle, {position:'absolute', top: this.state.top, left: this.state.left, opacity: this.state.opacity, zIndex: this.state.touching ? 1000 : 0}]}>
        <TouchableOpacity style={{marginLeft:70, marginTop:18, padding:10, justifyContent: 'center'}} onPress={() => { Alert.alert("Crownstone settings")}}>
          <Text style={{color:colors.white.hex, fontWeight:'bold'}}>Crownstone</Text>
        </TouchableOpacity>
        <View style={{position:"absolute", top:0, left:0, width: 70}}>
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
    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.top, {toValue: this.props.pos.y, useNativeDriver: false, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.left, {toValue: this.props.pos.x, useNativeDriver: false, duration: 100}));
    Animated.parallel(revertAnimations).start(() => {this.setState({touching: false})});
  }

  handleDragging(data) {
    this.touching = true;
    this.state.top.setValue(this.props.pos.y + data.dy);
    // this.state.left.setValue(this.props.pos.x + data.dx);
  }
}


function getTopBarProps(state, props) {
  NAVBAR_PARAMS_CACHE = { title: "Living room" }
  return NAVBAR_PARAMS_CACHE
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;



