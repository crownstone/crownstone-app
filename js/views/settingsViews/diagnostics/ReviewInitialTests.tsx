import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  TouchableOpacity,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';
import {colors, screenWidth} from "../../styles";
import {AppUtil} from "../../../util/AppUtil";
import {eventBus} from "../../../util/EventBus";
import {SlideInView} from "../../components/animated/SlideInView";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {DiagSingleButton, TestResult} from "./DiagnosticUtil";
import {FadeInView} from "../../components/animated/FadeInView";
import {diagnosticStyles} from "../SettingsDiagnostics";
import {TestRunner} from "./TestRunner";


export class ReviewInitialTests extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = { visible: false, ibeacons: null, verifiedAdvertisements: null };
    setTimeout(() => {
      this.setState({visible: true});
      if (this.props.inSphere) {
        this._runBeaconDataTests()
      }
    }, 50);


  }

  _runBeaconDataTests() {
    TestRunner.prepare();
    TestRunner.addIBeaconTest();
    TestRunner.addVerifiedCrownstoneTest();
    TestRunner.run()
      .then((result) => {
        this.setState({ibeacons: TestRunner.getIBeaconResult(result)});
        setTimeout(() => { this.setState({verifiedAdvertisements: TestRunner.getVerifiedCrownstoneResult(result)}); }, 500);
        setTimeout(() => { this.props.nextPhase(this.state.ibeacons, this.state.verifiedAdvertisements) }, 800);
      })
  }


  _getResults() {
    if (this.props.databaseHealth === false) {
      return (
        <View style={{flex:1, alignItems:'center'}}>
          <Text style={diagnosticStyles.headerStyle}>{"Problems found.."}</Text>
          <TestResult label={"Problem in database.."} state={ this.props.databaseHealth } />
          <SlideInView visible={this.state.visible} height={100} duration={500}>
            <Text style={diagnosticStyles.headerStyle}>To fix this we'll have to fully re-sync with the Cloud. Press the button below to fix this!</Text>
          </SlideInView>
          <TestResult label={"Scanning is enabled"} state={ this.props.isMonitoring } />
          <View style={{flex:1}}>
            <View style={{flex:1}} />
            <FadeInView visible={this.state.visible} delay={750}>
              <TouchableOpacity onPress={() => { AppUtil.resetDatabase(this.props.store, eventBus); }} style={diagnosticStyles.buttonStyle}>
                <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{"Restore database"}</Text>
              </TouchableOpacity>
            </FadeInView>
          </View>
        </View>
      )
    }
    else if (this.props.isMonitoring === false) {
      return (
        <View style={{flex:1, alignItems:'center'}}>
          <Text style={diagnosticStyles.headerStyle}>{"Problems found.."}</Text>
          <TestResult label={"Database is healthy"}     state={ this.props.databaseHealth } />
          <TestResult label={"Scanning is disabled..."} state={ this.props.isMonitoring } />
          <SlideInView visible={this.state.visible} height={250} duration={500}>
            <Text style={diagnosticStyles.headerStyle}>{
              "Your phone is currently not scanning for the beacon signals sent by the Crownstones.\n\n" +
              "To fix this, make sure the Bluetooth is on, the permission for Location Services is set to \"always\" and try to restart the app.\n\n" +
              "Press the button below to fully quit the app."
            }</Text>
          </SlideInView>
          <View style={{flex:1}}>
            <View style={{flex:1}} />
            <FadeInView visible={this.state.visible} delay={750}>
              <TouchableOpacity onPress={() => { AppUtil.quit(); }} style={diagnosticStyles.buttonStyle}>
                <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{"Quit app now"}</Text>
              </TouchableOpacity>
            </FadeInView>
          </View>
        </View>
      )
    }
    else if (this.props.inSphere) {
      // check for incoming ibeacons messages.
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <Text style={diagnosticStyles.headerStyle}>{"Running initial tests..."}</Text>
          <View>
            <TestResult label={"Database is healthy"}          state={ this.props.databaseHealth }         />
            <TestResult label={"Scanning is enabled"}          state={ this.props.isMonitoring }           />
            <SlideInView visible={this.state.visible} height={90} duration={500}>
              <TestResult label={"Receiving Sphere beacons"}     state={ this.state.ibeacons }               />
              <TestResult label={"Receiving Crownstone data"}    state={ this.state.verifiedAdvertisements } />
            </SlideInView>
          </View>
          <View style={{flex:1}} />
        </View>
      );
    }
  }

  render() {
    return this._getResults();
  }
}