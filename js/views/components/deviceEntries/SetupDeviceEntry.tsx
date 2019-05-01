
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SetupDeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { SetupStateHandler } from '../../../native/setup/SetupStateHandler'
import { Icon } from '../Icon';
import { styles, colors, screenWidth } from '../../styles'
import {Util} from "../../../util/Util";
import { core } from "../../../core";


export class SetupDeviceEntry extends Component<any, any> {
  baseHeight : any;
  setupEvents : any;
  rssiTimeout : any = null;

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;

    this.state = {
      name: props.item.name,
      subtext:  lang("Tap_here_to_add_it_to_thi"),
      showRssi: false,
      rssi: null
    };

    this.setupEvents = [];
  }

  componentDidMount() {this.setupEvents.push(core.eventBus.on(Util.events.getSetupTopic(this.props.handle), (data) => {
    if (data.rssi < 0) {
      if (this.state.rssi === null) {
        this.setState({rssi: data.rssi, showRssi: true});
      }
      else {
        this.setState({rssi: Math.round(0.2 * data.rssi + 0.8 * this.state.rssi), showRssi: true});
      }
      clearTimeout(this.rssiTimeout);
      this.rssiTimeout = setTimeout(() => { this.setState({showRssi: false, rssi: null}) }, 5000);
    }
  }));
  }

  componentWillUnmount() { // cleanup
    clearTimeout(this.rssiTimeout);
    this.setupEvents.forEach((unsubscribe) => { unsubscribe(); });
  }

  _getIcon() {
    let color = colors.blinkColor1.hex;

    return (
      <View style={[{
        width:60,
        height:60,
        borderRadius:30,
        backgroundColor: color,
        }, styles.centered]}>
        <Icon name={this.props.item.icon} size={35} color={'#ffffff'} style={{ backgroundColor:'transparent' }} />
      </View>
    );
  }


  render() {
    return (
      <View style={{flexDirection: 'column', height: this.baseHeight, flex: 1}}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.props.callback(); }}>
            {this._getIcon()}
          </TouchableOpacity>
          <TouchableOpacity style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this.props.callback(); }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17, fontWeight: '100'}}>{this.state.name}</Text>
              {this._getSubText()}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }



  _getSubText() {
    if (this.state.showRssi && SetupStateHandler.isSetupInProgress() === false) {
      if (this.state.rssi > -50) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Very_Near_") }</Text>
        </View>;
      }
      if (this.state.rssi > -75) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Near_") }</Text>
        </View>;
      }
      else if (this.state.rssi > -90) {
        return <View style={{flexDirection: 'column'}}>
          <Text style={{fontSize: 12}}>{this.state.subtext}</Text>
          <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{ lang("_Visible_") }</Text>
        </View>;
      }
      else if (this.state.rssi > -95) {
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
        <Text style={{fontSize: 12, color: colors.iosBlue.hex}}>{''}</Text>
      </View>;
    }
  }
}