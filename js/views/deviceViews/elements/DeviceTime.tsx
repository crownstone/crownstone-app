import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import {IconButton} from "../../components/IconButton";
import {eventBus} from "../../../util/EventBus";
import {Util} from "../../../util/Util";
import {Scheduler} from "../../../logic/Scheduler";
import {BatchCommandHandler} from "../../../logic/BatchCommandHandler";
import {LOG} from "../../../logging/Log";


export class DeviceTime extends Component<any, any> {
  tickInterval : any;
  unsubscribeStoreEvents : any;
  timeSet : number;

  constructor() {
    super();

    this.state = { time:0, pendingCommand: false, actionLabel: "Retrieving" };
  }

  componentWillMount() {
    this._initClock();

    this.unsubscribeStoreEvents = eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.stoneTimeUpdated && change.stoneTimeUpdated.stoneIds[this.props.stoneId]
         ) {
        this._initClock();
        this.forceUpdate();
      }
    });
  }

  _initClock() {
    clearInterval(this.tickInterval);
    let tick = () => {
      const store = this.props.store;
      const state = store.getState();
      const sphere = state.spheres[this.props.sphereId];
      const stone = sphere.stones[this.props.stoneId];

      let now = new Date().valueOf();

      let offset = 0;
      if (stone.config.stoneTimeChecked) {
        offset = now - stone.config.stoneTimeChecked;
      }

      this.setState({time: stone.config.stoneTime + offset/1000});
    };

    tick();
    this.tickInterval = setInterval(tick, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.tickInterval);
    this.unsubscribeStoreEvents();
  }

  _getButton(stone) {
    let buttonStyle = [styles.centered, {
      width: 0.50 * screenWidth,
      height: 50,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: colors.white.hex,
      backgroundColor: colors.csBlue.rgba(0.5),
      flexDirection: 'row'
    }];
    if (this.state.pendingCommand) {
      return (
        <View style={buttonStyle}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{this.state.actionLabel + "... "}</Text>
          <ActivityIndicator animating={true} size='small' color={colors.white.hex} />
        </View>
      )
    }
    else {

      return (
        <View style={{flexDirection:'row'}}>
          <View style={{flex:1}} />
          <TouchableOpacity
            onPress={() => {
              this.setState({pendingCommand:true, actionLabel:'Setting'});
              let now = new Date().valueOf();
              let newTime = now/1000;
              BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName:'setTime', time: newTime}, 5, 'from getButton in DeviceTime')
                .then(() => {
                  this.setState({pendingCommand: false});
                  this.props.store.dispatch({
                    type:'UPDATE_STONE_REMOTE_TIME',
                    sphereId: this.props.sphereId,
                    stoneId: this.props.stoneId,
                    data: {stoneTime: newTime, stoneTimeChecked: now}
                  });
                })
                .catch((err) => {
                  this.setState({pendingCommand: false});
                  Alert.alert("Failed to set new time...", "Maybe try it again?", [{text:'OK'}]);
                  LOG.error("DeviceTime: Could not set Time:", err);
                });
              BatchCommandHandler.executePriority();
            }}
            style={[buttonStyle, {width:50}]}>
            <Text style={{fontSize: 15, fontWeight: 'bold', color: colors.white.hex}}>{"now"}</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <TouchableOpacity
          onPress={() => {
            this.setState({pendingCommand:true, actionLabel:'Retrieving'});
            let now = new Date().valueOf();
            BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName:'getTime'}, 5, 'from getButton in DeviceTime')
              .then((time) => {
                this.setState({pendingCommand: false});
                this.props.store.dispatch({
                  type:'UPDATE_STONE_REMOTE_TIME',
                  sphereId: this.props.sphereId,
                  stoneId: this.props.stoneId,
                  data: {stoneTime: time, stoneTimeChecked: now}
                });
              })
              .catch((err) => {
                this.setState({pendingCommand: false});
                Alert.alert("Failed to get time...", "Maybe try it again?", [{text:'OK'}]);
                LOG.error("DeviceTime: Could not get Time:", err);
              });
              BatchCommandHandler.executePriority();
          }}
          style={buttonStyle}>
            <Text style={{fontSize: 15, fontWeight: 'bold', color: colors.white.hex}}>{"Get time now!"}</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <TouchableOpacity
            onPress={() => {
              this.setState({pendingCommand:true, actionLabel:'Setting'});
              let now = new Date().valueOf();
              let newTime = now/1000+3600*1.54;
              BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName:'setTime', time: newTime}, 5, 'from getButton in DeviceTime')
                .then(() => {
                  this.setState({pendingCommand: false, lastStoneTime: newTime});
                  this.props.store.dispatch({
                    type:'UPDATE_STONE_REMOTE_TIME',
                    sphereId: this.props.sphereId,
                    stoneId: this.props.stoneId,
                    data: {stoneTime: newTime, stoneTimeChecked: now}
                  });
                })
                .catch((err) => {
                  this.setState({pendingCommand: false});
                  Alert.alert("Failed to set new time...", "Maybe try it again?", [{text:'OK'}]);
                  LOG.error("DeviceTime: Could not set Time:", err);
                });
              BatchCommandHandler.executePriority();
            }}
            style={[buttonStyle, {width:50}]}>
            <Text style={{fontSize: 15, fontWeight: 'bold', color: colors.white.hex}}>{"+1.5h"}</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      )
    }

  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];


    let buttonSize = 0.19*screenHeight;
    return (
      <View style={{flex:1, alignItems:'center', padding:20, paddingTop: 30, paddingBottom:50}}>
        <Text style={deviceStyles.header}>Time on Crownstone</Text>
        <View style={{flex:1}} />
        <IconButton
          name="md-time"
          size={buttonSize}
          color={colors.darkBackground.hex}
          buttonStyle={{width: buttonSize, height: buttonSize, backgroundColor:colors.white.hex, borderRadius: 0.15*buttonSize}}
        />
        <View style={{flex:1}} />
        <Text style={deviceStyles.text}>{'This one thinks the time is:'}</Text>
        <View style={{flex:0.2}} />
        <Text style={deviceStyles.header}>{Util.getTimeFormat(this.state.time * 1000)}</Text>
        <View style={{flex:0.5}} />
        <Text style={deviceStyles.subText}>{'Last checked: ' + Util.getTimeFormat(stone.config.stoneTimeChecked)}</Text>
        <Text style={deviceStyles.subText}>{'Stone: ' + Util.getTimeFormat(stone.config.stoneTime*1000)}</Text>
        <Text style={deviceStyles.subText}>{'Now: ' + Util.getTimeFormat(new Date().valueOf())}</Text>
        <View style={{flex:1}} />
        { this._getButton(stone) }
      </View>
    )
  }
}


let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 23,
    fontWeight:'800'
  },
  text: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
    fontWeight:'500'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});