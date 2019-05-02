
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SetupDeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableOpacity,
  Text,
  View, Switch, ActivityIndicator, ViewStyle
} from "react-native";

import { SetupStateHandler } from '../../../native/setup/SetupStateHandler'
import { Icon } from '../Icon';
import { styles, colors, screenWidth } from '../../styles'
import {Util} from "../../../util/Util";
import { core } from "../../../core";
import { StoneUtil } from "../../../util/StoneUtil";
import { IconButton } from "../IconButton";
import { HiddenFadeInView } from "../animated/FadeInView";
import { SlideFadeInView } from "../animated/SlideFadeInView";


export class SetupDeviceEntry extends Component<{handle, sphereId, item, callback: any}, any> {
  baseHeight : any;
  setupEvents : any;
  rssiTimeout : any = null;

  constructor(props) {
    super(props);

    this.baseHeight = props.height || 90;

    this.state = {
      name: props.item.name,
      subtext:  lang("Tap_here_to_add_it_to_thi"),
      showRssi: false,
      rssi: null,
      pendingCommand: false,
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
        width:  60,
        height: 60,
        borderRadius:30,
        backgroundColor: color,
        }, styles.centered]}>
        <Icon name={this.props.item.icon} size={35} color={'#ffffff'} style={{ backgroundColor:'transparent' }} />
      </View>
    );
  }


  _getControl() {
    let content;
    let action = null;
    if (this.state.pendingCommand === true) {
      content = <ActivityIndicator animating={true} size='large' />;
    }
    else {
      let iconSize = 40
      content = <IconButton name={"md-color-wand"}
                  size={iconSize*0.8}
                  buttonSize={iconSize}
                  radius={iconSize*0.5}
                  button={true}
                  color={ colors.blinkColor1.rgba(1)}
                  buttonStyle={{ backgroundColor: colors.white.hex, borderWidth: 2, borderColor: colors.blinkColor1.hex }}
                />;
      action = () => {
        this.setState({pendingCommand:true});

        StoneUtil.setupPulse(this.props.handle, this.props.sphereId)
          .then(() => {  this.setState({pendingCommand: false})})
          .catch((err) => {
            // console.log("ERROR", err)
            Alert.alert(
            "Something went wrong...",
            "I tried to make this Crownstone toggle, but something went wrong.\n\nPlease try again!",
            [{text:'OK'}]
            );
            this.setState({pendingCommand: false});
          })
      };
    }


    let wrapperStyle : ViewStyle = {height: this.baseHeight, width: 60, alignItems:'flex-end', justifyContent:'center'};
    if (action) {
      return (
        <TouchableOpacity onPress={() => { action() }} style={wrapperStyle}>
          {content}
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle}>{content}</View>;
    }
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
              <SlideFadeInView visible={!this.state.pendingCommand} height={20}><Text style={{fontSize: 17, fontWeight: '100'}}>{this.state.name}</Text></SlideFadeInView>
              <SlideFadeInView visible={ this.state.pendingCommand} height={50}><Text style={{fontSize: 13, fontWeight: '100'}}>{"Briefly toggling this Crownstone!\nIf this is the right one, tap here to add it!"}</Text></SlideFadeInView>
              <SlideFadeInView visible={!this.state.pendingCommand} height={30}>{this._getSubText()}</SlideFadeInView>
            </View>
          </TouchableOpacity>
          { this._getControl() }
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