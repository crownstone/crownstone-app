
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsDiagnostics", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  TouchableOpacity,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import {availableScreenHeight, colors, screenWidth} from "../styles";
import {IconButton} from "../components/IconButton";
import {Bluenet} from "../../native/libInterface/Bluenet";
import {BluenetPromiseWrapper} from "../../native/libInterface/BluenetPromise";
import {ReviewInitialTests} from "./diagnostics/ReviewInitialTests";
import {NotInSphere} from "./diagnostics/NotInSphere";
import {NoStones} from "./diagnostics/NoStones";
import {TestResult} from "./diagnostics/DiagnosticUtil";
import {InSphere} from "./diagnostics/InSphere";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import { DiagnosticStates, diagnosticStyles } from "./diagnostics/DiagnosticStyles";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { DataUtil } from "../../util/DataUtil";

export class SettingsDiagnostics extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Diagnostics")});
  }

  canSetupStones = false;
  constructor(props) {
    super(props);

    this.state = {
      testPhase: DiagnosticStates.INTRODUCTION,
      databaseHealth: null,
      isMonitoring: null,
      inSphere: null,

      ibeacons: null,
      verifiedAdvertisements: null,

      opacity: new Animated.Value(1),
      leftOffset: new Animated.Value(0),
    };
  }

  startInitialTest() {
    Animated.timing(this.state.leftOffset, {toValue: -screenWidth, duration:300}).start();
    Animated.timing(this.state.opacity,    {toValue: 0, duration:200}).start();
    setTimeout(() => { this.initialTest() }, 200)
  }

  initialTest() {
    this.setState({
      testPhase: DiagnosticStates.INITIAL_TESTS,
    });

    let state = core.store.getState();
    let sphereIds = state.spheres;
    let healthySpheres = true;
    let stoneCount = 0;
    healthySpheres = DataUtil.verifyDatabase(true);
    Object.keys(sphereIds).forEach((sphereId) => {
      let sphere = sphereIds[sphereId];
      stoneCount += Object.keys(sphere.stones).length;
    });

    setTimeout(() => { this.setState({ databaseHealth: healthySpheres }); }, 500);
    setTimeout(() => {
      BluenetPromiseWrapper.getTrackingState()
        .then((trackingInformation: trackingState) => {
          let inSphere = false;
          if (trackingInformation.isRanging === true) {
            inSphere = true;
          }

          if (stoneCount === 0) {
            this.setState({isMonitoring: trackingInformation.isMonitoring, inSphere: inSphere, testPhase: DiagnosticStates.NO_STONES});
          }
          else if (trackingInformation.isMonitoring === true && inSphere === false) {
            this.setState({isMonitoring: trackingInformation.isMonitoring, inSphere: inSphere, testPhase: DiagnosticStates.NOT_IN_SPHERE});
          }
          else {
            this.setState({isMonitoring: trackingInformation.isMonitoring, inSphere: inSphere, testPhase: DiagnosticStates.INITIAL_TESTS_REVIEW});
          }
        })
    }, 1000);
  }

  componentWillUnmount() {
    Bluenet.startScanningForCrownstonesUniqueOnly();
  }


  getIntroduction() {
    return (
      <Animated.View style={{flex:1, alignItems:'center', justifyContent:'center', position:'relative', left: this.state.leftOffset, opacity: this.state.opacity}}>
        <View style={{flex:1}} />
        <IconButton name="md-analytics" buttonSize={0.27*screenWidth} size={0.21*screenWidth} radius={0.05*screenWidth} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />
        <View style={{flex:0.5}} />
        <Text style={diagnosticStyles.headerStyle}>{ lang("Since_everything_communic") }</Text>
        <View style={{flex:0.5}} />
        <Text style={diagnosticStyles.explanationStyle}>{ lang("I_can_run_a_few_tests_to_") }</Text>
        <View style={{flex:1}} />
        <TouchableOpacity onPress={() => { this.startInitialTest() }} style={diagnosticStyles.buttonStyle}>
          <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{ lang("Run_diagnostics") }</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }


  getInitialTests() {
    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <Text style={diagnosticStyles.headerStyle}>{ lang("Running_initial_tests___") }</Text>
        <View>
          <TestResult label={ lang("Database_is_healthy")}    state={ this.state.databaseHealth }         />
          <TestResult label={ lang("Scanning_is_enabled")}    state={ this.state.iBeaconScanningEnabled } />
        </View>
        <View style={{flex:1}} />
      </View>
    );
  }


  getContent() {
    switch (this.state.testPhase) {
      case DiagnosticStates.INTRODUCTION:
        return this.getIntroduction();
      case DiagnosticStates.INITIAL_TESTS:
        return this.getInitialTests();
      case DiagnosticStates.INITIAL_TESTS_REVIEW: // review results of test 1
        return (
          <ReviewInitialTests
            {...this.state}
            store={core.store}
            canSetupStones={this.canSetupStones}
            nextPhase={(ibeacons, verifiedAdvertisements) => {
              if (!ibeacons || !verifiedAdvertisements ) {
                this.setState({ibeacons: ibeacons, verifiedAdvertisements: verifiedAdvertisements, testPhase: DiagnosticStates.NOT_IN_SPHERE})
              }
              else {
                this.setState({ibeacons: ibeacons, verifiedAdvertisements: verifiedAdvertisements, testPhase: DiagnosticStates.IN_SPHERE})
              }
            }}
          />
        );
      case DiagnosticStates.NO_STONES:
        return (
          <NoStones
            {...this.state}
            canSetupStones={this.canSetupStones}
            store={core.store}
          />
        );
      case DiagnosticStates.NOT_IN_SPHERE:
        return (
          <NotInSphere
            {...this.state}
            canSetupStones={this.canSetupStones}
            store={core.store}
            amInSphere={() => {
              this.setState({ibeacons: true, verifiedAdvertisements: true, testPhase: DiagnosticStates.IN_SPHERE})
            }}
          />
        );
      case DiagnosticStates.IN_SPHERE:
        return (
          <InSphere
            {...this.state}
            canSetupStones={this.canSetupStones}
            store={core.store}
          />
        );
    }
  }


  render() {
    return (
      <Background image={core.background.menu}>
                <ScrollView>
          <View style={{alignItems:'center', justifyContent:'center'}}>
            <Text style={diagnosticStyles.titleStyle}>{ lang("Diagnostics") }</Text>
          </View>
          <View style={{width: screenWidth, alignItems:'center', justifyContent:'center', minHeight: availableScreenHeight-63}}>
            { this.getContent() }
          </View>
        </ScrollView>
      </Background>
    );
  }
}

