
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ReviewInitialTests", key)(a,b,c,d,e);
}
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
          <Text style={diagnosticStyles.headerStyle}>{ lang("Problems_found__") }</Text>
          <TestResult label={ lang("Problem_in_database__")} state={ this.props.databaseHealth } />
          <SlideInView visible={this.state.visible} height={100} duration={500}>
            <Text style={diagnosticStyles.headerStyle}>{ lang("To_fix_this_well_have_to_") }</Text>
          </SlideInView>
          <TestResult label={ lang("Scanning_is_enabled")} state={ this.props.isMonitoring } />
          <View style={{flex:1}}>
            <View style={{flex:1}} />
            <FadeInView visible={this.state.visible} delay={750}>
              <TouchableOpacity onPress={() => { AppUtil.resetDatabase(this.props.store, eventBus); }} style={diagnosticStyles.buttonStyle}>
                <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{ lang("Restore_database") }</Text>
              </TouchableOpacity>
            </FadeInView>
          </View>
        </View>
      )
    }
    else if (this.props.isMonitoring === false) {
      return (
        <View style={{flex:1, alignItems:'center'}}>
          <Text style={diagnosticStyles.headerStyle}>{ lang("Problems_found__") }</Text>
          <TestResult label={ lang("Database_is_healthy")}     state={ this.props.databaseHealth } />
          <TestResult label={ lang("Scanning_is_disabled___")} state={ this.props.isMonitoring } />
          <SlideInView visible={this.state.visible} height={250} duration={500}>
            <Text style={diagnosticStyles.headerStyle}>{ lang("Your_phone_is_currently_n") }</Text>
          </SlideInView>
          <View style={{flex:1}}>
            <View style={{flex:1}} />
            <FadeInView visible={this.state.visible} delay={750}>
              <TouchableOpacity onPress={() => { AppUtil.quit(); }} style={diagnosticStyles.buttonStyle}>
                <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{ lang("Quit_app_now") }</Text>
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
          <Text style={diagnosticStyles.headerStyle}>{ lang("Running_initial_tests___") }</Text>
          <View>
            <TestResult label={ lang("Database_is_healthy")}          state={ this.props.databaseHealth }         />
            <TestResult label={ lang("Scanning_is_enabled")}          state={ this.props.isMonitoring }           />
            <SlideInView visible={this.state.visible} height={90} duration={500}>
              <TestResult label={ lang("Receiving_Sphere_beacons")}     state={ this.state.ibeacons }               />
              <TestResult label={ lang("Receiving_Crownstone_data")}    state={ this.state.verifiedAdvertisements } />
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