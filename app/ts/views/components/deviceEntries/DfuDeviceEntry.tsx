
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuDeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableOpacity,
  Text,
  View, ActivityIndicator
} from "react-native";

import { SetupStateHandler } from '../../../native/setup/SetupStateHandler'
import { Icon } from '../Icon';
import { styles, colors} from '../../styles'
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { DfuUtil } from "../../../util/DfuUtil";
import { BleUtil } from "../../../util/BleUtil";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class DfuDeviceEntry extends Component<any, any> {
  baseHeight : any;
  currentLoadingWidth : any;
  dfuEvents : any;
  rssiTimeout : any = null;

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;
    this.state = {
      name: props.name || 'DFU Crownstone',
      subtext:  lang("Tap_here_to_configure_me_"),
      showRssi: false,
      rssi: null,
      restoring: false
    };

    this.currentLoadingWidth = 0;
    this.dfuEvents = [];
  }

  componentDidMount() {
    this.dfuEvents.push(core.nativeBus.on(core.nativeBus.topics.dfuAdvertisement, (data : crownstoneBaseAdvertisement) => {
      if (data.handle === this.props.handle) {
        if (data.rssi < 0) {
          if (this.state.rssi === null) {
            this.setState({rssi: data.rssi, showRssi: true});
          }
          else {
            this.setState({rssi: Math.round(0.2 * data.rssi + 0.8 * this.state.rssi), showRssi: true});
          }
          clearTimeout(this.rssiTimeout);
          this.rssiTimeout = setTimeout(() => {
            this.setState({showRssi: false, rssi: null})
          }, 5000);
        }
      }
    }));
  }

  componentWillUnmount() { // cleanup
    clearTimeout(this.rssiTimeout);
    this.dfuEvents.forEach((unsubscribe) => { unsubscribe(); });
  }

  _getIcon() {
    if (this.state.restoring) {
      return (
        <View style={[{
          width:60,
          height:60,
          backgroundColor: 'transparent',
        }, styles.centered]}>
          <ActivityIndicator size={"large"} color={colors.purple.hex} />
        </View>
      );
    }
    return (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: colors.purple.hex,
        }, styles.centered]}>
        <Icon name={'ios-settings'} size={50} color={'#ffffff'} style={{backgroundColor:'transparent'}} />
      </View>
    );
  }


  render() {
    return (
      <View style={{flexDirection: 'column', height: this.baseHeight, flex: 1}}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.repair(); }}>
            {this._getIcon()}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.repair(); }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17}}>{this.props.name}</Text>
              {this._getSubText()}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  repair() {
    if (this.state.restoring === false) {
      if (Permissions.inSphere(this.props.sphereId).canUpdateCrownstone) {
        let updatableStones = DfuUtil.getUpdatableStones(this.props.sphereId);
        if (updatableStones.stones[this.props.stoneId]) {
          NavigationUtil.launchModal("DfuIntroduction", { sphereId: this.props.sphereId });
        }
        else {
          this.setState({restoring: true})
          let proxy = BleUtil.getProxy(this.props.handle, this.props.sphereId);
          proxy.performPriority(() => {
            return BluenetPromiseWrapper.bootloaderToNormalMode(this.props.handle)
          })
            .then(() => {
              // this.setState({restoring: false});
            })
            .catch((err) => {
              core.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data:{firmwareVersion: null}});
              this.setState({restoring: false})
              NavigationUtil.launchModal("DfuIntroduction", { sphereId: this.props.sphereId });
            })
        }
      }
      else {
        Alert.alert(
        lang("_You_dont_have_permission_header"),
        lang("_You_dont_have_permission_body"),
        [{text: lang("_You_dont_have_permission_left")}])
      }
    }
  }

  _getSubText() {
    if (this.state.showRssi && SetupStateHandler.isSetupInProgress() === false && this.state.restoring === false) {
      if (this.state.rssi > -40) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Very_Near_") }</Text>
        </View>;
      }
      if (this.state.rssi > -60) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Near_") }</Text>
        </View>;
      }
      else if (this.state.rssi > -80) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Visible_") }</Text>
        </View>;
      }
      else if (this.state.rssi > -90) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Barely_visible_") }</Text>
        </View>;
      }
      else {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Too_far_away_") }</Text>
        </View>;
      }
    }
    else {
      return <View style={{flexDirection: 'column'}}>
        <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
        <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("Working___",this.state.restoring) }</Text>
      </View>;
    }
  }
}