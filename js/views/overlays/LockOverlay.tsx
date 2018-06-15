import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconButton }           from '../components/IconButton'
import { OverlayBox }           from '../components/overlays/OverlayBox'
import { styles, colors } from '../styles'
import { eventBus }             from "../../util/EventBus";
import { BatchCommandHandler }  from "../../logic/BatchCommandHandler";
import { Scheduler }            from "../../logic/Scheduler";
import { Permissions }          from "../../backgroundProcesses/PermissionManager";

export class LockOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      sphereId: null,
      stoneId: null
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showLockOverlay", (data) => {
      this.setState({ visible: true, sphereId: data.sphereId, stoneId: data.stoneId });
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getText(stone) {
    if (!stone) {
      return "";
    }

    if (!Permissions.inSphere(this.state.sphereId).canLockCrownstone) {
      return "Only Admins have permission to lock Crownstones...";
    }

    if (stone.config.dimmingEnabled) {
      return "You can only lock Crownstones that do not have dimming enabled.";
    }

    if (stone.state.state > 0) {
      return "You can lock this Crownstone so it will not turn off without someone unlocking it first.";
    }
    else {
      return "You can lock this Crownstone so it will not turn on without someone unlocking it first.";
    }
  }

  _lockCrownstone(stone) {
    eventBus.emit("showLoading", "Locking Crownstone...");
    BatchCommandHandler.loadPriority(stone, this.state.stoneId, this.state.sphereId, { commandName : 'lockSwitch', value: true })
      .then(() => {
        eventBus.emit("showLoading", "Done!");
        Scheduler.scheduleCallback(() => {
          eventBus.emit("hideLoading");
          this.props.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: this.state.sphereId, stoneId: this.state.stoneId, data: {locked: true}});
          this.setState({visible: false, sphereId: null});
        }, 500, 'Locked Crownstone');
      })
      .catch((err) => {
        eventBus.emit("hideLoading");
        Alert.alert("I'm sorry..", "Something went wrong while locking this Crownstone. Make sure you're near the Crownstone that you want to lock.",[{text:'OK'}]);
        this.setState({visible: false, sphereId: null});
      });
    BatchCommandHandler.executePriority();
  }

  _getButtons(stone) {
    if (!Permissions.inSphere(this.state.sphereId).canLockCrownstone || stone.config.dimmingEnabled) {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}/>
          <TouchableOpacity onPress={() => { this.setState({visible: false}); }} style={[styles.centered, {
            width: 110,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.darkBackground.rgba(0.5),
          }]}>
            <Text style={{fontSize: 14, color: colors.darkBackground.rgba(0.8)}}>OK...</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}/>
        </View>
      );
    }
    else {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}/>
          <TouchableOpacity onPress={() => { this.setState({visible: false})}} style={[styles.centered, {
            width: 110,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.darkBackground.rgba(0.5),
          }]}>
            <Text style={{fontSize: 14, color: colors.darkBackground.rgba(0.8)}}>Cancel</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}/>
          <TouchableOpacity onPress={() => { this._lockCrownstone(stone); }} style={[styles.centered, {
            width: 110,
            height: 36,
            borderRadius: 18,
            borderWidth: 3,
            borderColor: colors.darkBackground.hex,
          }]}>
            <Text style={{fontSize: 14, color: colors.darkBackground.hex, fontWeight: 'bold'}}>Lock!</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}/>
        </View>
      );
    }
  }

  render() {
    let iconSize = 150;
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.state.sphereId];
    var stone = null;
    if (sphere) {
      stone = sphere.stones[this.state.stoneId];
    }

    return (
      <OverlayBox visible={this.state.visible} height={400} width={300} overrideBackButton={false} backgroundColor={colors.black.rgba(0.4)}>
        <View style={{flex:1}} />
        <IconButton
          name="md-lock"
          size={100}
          color="#fff"
          buttonStyle={{width: iconSize, height: iconSize, backgroundColor:colors.darkBackground.hex, borderRadius: 0.5*iconSize}}
          style={{position:'relative', top:0}}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.black.hex, padding:5, textAlign:'center'}}>{"Locking a Crownstone"}</Text>
        <Text style={{fontSize: 12, fontWeight: '400',  color: colors.darkBackground.hex, padding:15, textAlign:'center'}}>{this._getText(stone)}</Text>
        <View style={{flex:1}} />
        { this._getButtons(stone) }
        <View style={{flex:1}} />
      </OverlayBox>
    );
  }
}