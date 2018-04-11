import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

import { SetupStateHandler }    from '../../native/setup/SetupStateHandler'
const Actions = require('react-native-router-flux').Actions;
import { colors } from '../styles'
import {eventBus} from "../../util/EventBus";
import {BackAction} from "../../util/Back";


/**
 * This element contains all logic to show the explanation bar in the room overview.
 * It requires:
 *  - {object} state
 *  - {string | undefined} explanation
 *  - {string} sphereId
 *  - {string} locationId
 */
export class RoomBottomExplanation extends Component<any, any> {
  unsubscribeSetupEvents : any;
  cleanupTimeout : any;


  constructor(props) {
    super(props);
    this.unsubscribeSetupEvents = [];
    this.state = {explanation: null, buttonCallback: null};

    let seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    if (seeStoneInSetupMode === true && this.props.locationId !== null) {
      this._loadSetupMessage();
    }
  }

  componentDidMount() {
    this.unsubscribeSetupEvents.push(eventBus.on("setupStonesDetected", () => {
      this._loadSetupMessage();
    }));
    this.unsubscribeSetupEvents.push(eventBus.on("noSetupStonesVisible", () => {
      this.cleanupTimeout = setTimeout(() => {
        this.setState({explanation: null, buttonCallback: null});
      }, 500);
    }));
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeSetupEvents = [];
    clearTimeout(this.cleanupTimeout);
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.locationId === null) {
      this.setState({explanation: null, buttonCallback: null});
    }
    else {
      this._loadSetupMessage();
    }
  }

  _loadSetupMessage() {
    if (this.props.locationId !== null && SetupStateHandler.areSetupStonesAvailable()) {
      let explanation = "Crownstone in setup mode found.\nTap here to see it!";
      let buttonCallback = () => {
        BackAction();
        setTimeout(() => {
          Actions.roomOverview({sphereId: this.props.sphereId, locationId: null})
        }, 150);
      };
      this.setState({explanation: explanation, buttonCallback: buttonCallback});
    }
    else {
      this.setState({explanation: null, buttonCallback: null});
    }
  }

  render() {
    if (this.state.explanation === null) {
      return <View />
    }
    else {
      return (
        <TouchableOpacity
          style={{backgroundColor: colors.white.rgba(0.5), justifyContent: 'center', alignItems:'center', borderTopWidth :1, borderColor: colors.menuBackground.rgba(0.3)}}
          onPress={this.state.buttonCallback}>
          <View style={{flexDirection: 'column', paddingLeft: 15, paddingRight: 15, height: 60, justifyContent: 'center', alignItems:'center'}}>
            <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center', color:colors.black.rgba(0.7)}}>{this.state.explanation}</Text>
          </View>
        </TouchableOpacity>
      );
    }
  }
}