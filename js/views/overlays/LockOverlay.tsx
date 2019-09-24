
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LockOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconButton }           from '../components/IconButton'
import { OverlayBox }           from '../components/overlays/OverlayBox'
import { styles, colors } from '../styles'
import { BatchCommandHandler }  from "../../logic/BatchCommandHandler";
import { Scheduler }            from "../../logic/Scheduler";
import { Permissions }          from "../../backgroundProcesses/PermissionManager";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

export class LockOverlay extends Component<any, any> {

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      sphereId: props.data.sphereId,
      stoneId: props.data.stoneId,
    };
  }

  componentDidMount() {
    this.setState({ visible: true });
  }

  _getText() {
    let stone = this._getStone();

    if (!stone) {
      return "";
    }

    if (!Permissions.inSphere(this.state.sphereId).canLockCrownstone) {
      return lang("Only_Admins_have_permissi");
    }

    if (stone.config.dimmingEnabled) {
      return lang("You_can_only_lock_Crownst");
    }

    if (stone.state.state > 0) {
      return lang("You_can_lock_this_Crownst_off");
    }
    else {
      return lang("You_can_lock_this_Crownst");
    }
  }

  _lockCrownstone(stone) {
    core.eventBus.emit("showLoading", lang("Locking_Crownstone___"));
    BatchCommandHandler.loadPriority(stone, this.state.stoneId, this.state.sphereId, { commandName : 'lockSwitch', value: true })
      .then(() => {
        core.eventBus.emit("showLoading", "Done!");
        Scheduler.scheduleCallback(() => {
          core.eventBus.emit("hideLoading");
          core.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: this.state.sphereId, stoneId: this.state.stoneId, data: {locked: true}});
          this.setState({visible: false, sphereId: null}, () => {  NavigationUtil.closeOverlay(this.props.componentId); });
        }, 500, 'Locked Crownstone');
      })
      .catch((err) => {
        core.eventBus.emit("hideLoading");
        Alert.alert(
          lang("_Im_sorry____Something_we_header"),
          lang("_Im_sorry____Something_we_body"),
          [{text:lang("_Im_sorry____Something_we_left")}]);
        this.setState({visible: false, sphereId: null}, () => {  NavigationUtil.closeOverlay(this.props.componentId); });
      });
    BatchCommandHandler.executePriority();
  }

  _getButtons() {
    let stone = this._getStone();
    if (!stone) {
      return;
    }

    if (!Permissions.inSphere(this.state.sphereId).canLockCrownstone || stone.config.dimmingEnabled) {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}/>
          <TouchableOpacity
            onPress={() => { this.setState({visible: false}, () => {  NavigationUtil.closeOverlay(this.props.componentId); }); }}
            style={[styles.centered, {
            width: 110,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.csBlueDark.rgba(0.5),
          }]}>
            <Text style={{fontSize: 14, color: colors.csBlueDark.rgba(0.8)}}>{ lang("OK___") }</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}/>
        </View>
      );
    }
    else {
      return (
        <View style={{flexDirection: 'row'}}>
          <View style={{flex: 1}}/>
          <TouchableOpacity
            onPress={() => { this.setState({visible: false}, () => {  NavigationUtil.closeOverlay(this.props.componentId); })}}
            style={[styles.centered, {
            width: 110,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.csBlueDark.rgba(0.5),
          }]}>
            <Text style={{fontSize: 14, color: colors.csBlueDark.rgba(0.8)}}>{ lang("Cancel") }</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}/>
          <TouchableOpacity onPress={() => { this._lockCrownstone(stone); }} style={[styles.centered, {
            width: 110,
            height: 36,
            borderRadius: 18,
            borderWidth: 3,
            borderColor: colors.csBlueDark.hex,
          }]}>
            <Text style={{fontSize: 14, color: colors.csBlueDark.hex, fontWeight: 'bold'}}>{ lang("Lock_") }</Text>
          </TouchableOpacity>
          <View style={{flex: 1}}/>
        </View>
      );
    }
  }

  _getStone() {
    if (!this.state.visible) {
      return null;
    }

    const state = core.store.getState();
    const sphere = state.spheres[this.state.sphereId];
    var stone = null;
    if (sphere) {
      stone = sphere.stones[this.state.stoneId];
    }
    return stone;
  }

  render() {
    let iconSize = 150;

    return (
      <OverlayBox visible={this.state.visible} height={400} width={300} overrideBackButton={false} backgroundColor={colors.black.rgba(0.4)}>
        <View style={{flex:1}} />
        <IconButton
          name="md-lock"
          size={100}
          color="#fff"
          buttonStyle={{width: iconSize, height: iconSize, backgroundColor:colors.csBlueDark.hex, borderRadius: 0.5*iconSize}}
          style={{position:'relative', top:0}}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.black.hex, padding:5, textAlign:'center'}}>{ lang("Locking_a_Crownstone") }</Text>
        <Text style={{fontSize: 12, fontWeight: 'bold',  color: colors.csBlueDark.hex, padding:15, textAlign:'center'}}>{this._getText()}</Text>
        <View style={{flex:1}} />
        { this._getButtons() }
        <View style={{flex:1}} />
      </OverlayBox>
    );
  }
}