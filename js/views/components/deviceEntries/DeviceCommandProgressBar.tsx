import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Util } from '../../../util/Util'
import { colors, screenWidth } from '../../styles'
import {MapProvider} from "../../../backgroundProcesses/MapProvider";

export class DeviceCommandProgressBar extends Component<any, any> {
  unsubscribe = [];
  animating = false;
  id = Util.getUUID();
  initiallyOpenTimeout : any;
  _connectingToRelatedCrownstone = false;
  _pendingProcess = true;

  constructor(props) {
    super(props);

    this.state = {
      progressWidth:   new Animated.Value(0),
      progressOpacity: new Animated.Value(0),
      progressColor:   new Animated.Value(0)
    };
  }

  componentDidMount() {

    // this makes the loading bar roll. It waits on the mesh propagation timeout which is used for multiswitching. It is emitted from the MeshHelper
    this.unsubscribe.push(this.props.eventBus.on(Util.events.getIgnoreTopic(this.props.stoneId), (data) => {
      if (!data.timeoutMs) { return; }
      this.state.progressWidth.stopAnimation();
      this.state.progressWidth.setValue(0.15*screenWidth);
      Animated.timing(this.state.progressWidth, { toValue: screenWidth, duration: data.timeoutMs }).start((animationState) => {
        if (animationState.finished === true) {
          this._failureFinish();
        }
      });
    }));

    // this shows that the command has been emitted successfully and animates the progress bar to the end quickly
    this.unsubscribe.push(this.props.eventBus.on(Util.events.getIgnoreConditionFulfilledTopic(this.props.stoneId), (data) => {
      // the Crownstone pending state should be false again when this event is received. If it is not, a new command was sent. Since this event is only used to
      // show the state of the last switch command, we ignore it if there is a pendingCommand
      if (this.props.pendingCommand)      { return; }
      if (this._pendingProcess === false) { return;}

      this.state.progressWidth.stopAnimation();
      this._successFinish();
    }));

    // Shows the progress on connecting to a crownstone
    this.unsubscribe.push(this.props.eventBus.on('connecting', (handle) => {
      // if we do not know this stone, ignore the event. This happens during a setup (or recovery)
      let connectedStone = MapProvider.stoneSphereHandleMap[this.props.sphereId][handle];
      if (!connectedStone) { return; }

      // get the most recent mesh network id of this stone.
      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

      // if we are connected with this stone or one in it's meshnetwork, we show progress
      if ((connectedStone.id === this.props.stoneId || connectedStone.stoneConfig.meshNetworkId === stone.config.meshNetworkId)) {
        if (this.props.pendingCommand) {
          this.props.updateStatusText("connecting...");
        }
        else {
          this._connectingToRelatedCrownstone = true;
        }
      }
    }));

    // Shows the progress on connecting to a crownstone
    this.unsubscribe.push(this.props.eventBus.on('disconnect', () => {
      this._connectingToRelatedCrownstone = false;
    }));

    // Shows the progress on when a crownstone has connected with the app
    this.unsubscribe.push(this.props.eventBus.on('connected', (handle) => {
      // these events are only relevant if we switched this Crownstone
      if (!this.props.pendingCommand) { return; }

      // if we do not know this stone, ignore the event. This happens during a setup (or recovery)
      let connectedStone = MapProvider.stoneSphereHandleMap[this.props.sphereId][handle];
      if (!connectedStone) { return; }

      // get the most recent mesh network id of this stone.
      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

      let isInMesh = connectedStone.stoneConfig.meshNetworkId === null;
      // if the stone is not in the mesh
      if (!isInMesh && connectedStone.id === this.props.stoneId) {
        this.state.progressWidth.stopAnimation();
        this.state.progressWidth.setValue(0.15*screenWidth);
        this._successFinish();
      }
      else {
        // if we are connected with this stone or one in it's meshnetwork, we show progress
        if (connectedStone.id === this.props.stoneId || connectedStone.stoneConfig.meshNetworkId === stone.config.meshNetworkId) {
          this.props.updateStatusText("checking...");
          this.state.progressWidth.stopAnimation();
          Animated.timing(this.state.progressWidth, { toValue: 0.15*screenWidth, duration: 150 }).start()
        }
      }
    }));
  }

  _successFinish() {
    let animations = [];
    animations.push(Animated.timing(this.state.progressWidth, {toValue: screenWidth, duration: 250}));
    animations.push(Animated.timing(this.state.progressColor, {toValue: 1,           duration: 50 }));
    this.props.updateStatusText("Success!");
    Animated.parallel(animations).start(() => {
      this._hideCommandProgressBar();
    });
  }

  _failureFinish() {
    this.props.updateStatusText(null);
    Animated.timing(this.state.progressColor, {toValue: -1, duration: 250}).start( () => { this._hideCommandProgressBar(500) });
  }

  /**
   *  hide the connection/command progress bar
   */
  _hideCommandProgressBar(delay = 0) {
    this._pendingProcess = false;
    Animated.timing(this.state.progressOpacity, { toValue: 0, duration: 100, delay: delay}).start( () => {
      this.state.progressWidth.setValue(0);
      this.state.progressColor.setValue(0);
      this.props.updateStatusText(null);
    })
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.props.pendingCommand === false && nextProps.pendingCommand === true) {
      let animations = [];
      this._pendingProcess = true;
      if (this._connectingToRelatedCrownstone) {
        this.props.updateStatusText("connecting...");
      }
      else {
        this.props.updateStatusText("preparing...");
      }
      animations.push(Animated.timing(this.state.progressOpacity, { toValue: 1, duration: 50 }));
      animations.push(Animated.timing(this.state.progressWidth, { toValue: 0.05*screenWidth, duration: 350 }));
      Animated.parallel(animations).start();
    }
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
    clearTimeout(this.initiallyOpenTimeout);
  }



  render() {
    // we change the colors of the progressbar based on success or failure.
    let progressColor = this.state.progressColor.interpolate({
      inputRange: [-1,0,1],
      outputRange: [colors.black.rgba(0.05), colors.lightBlue.rgba(0.35), colors.green.rgba(0.5)]
    });

    return (
      <Animated.View
        style={{
          position:'absolute',
          left: 0,
          top: 0,
          width: this.state.progressWidth,
          height: this.props.baseHeight,
          backgroundColor: progressColor,
          opacity: this.state.progressOpacity
        }}
      />
    );
  }
}
