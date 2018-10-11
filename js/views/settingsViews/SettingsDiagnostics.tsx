
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsDiagnostics", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Animated,
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

import { Background } from '../components/Background'
import {availableScreenHeight, colors, OrangeLine, screenWidth} from "../styles";
import {IconButton} from "../components/IconButton";
import {Bluenet} from "../../native/libInterface/Bluenet";
import {BluenetPromiseWrapper} from "../../native/libInterface/BluenetPromise";
import {ReviewInitialTests} from "./diagnostics/ReviewInitialTests";
import {NotInSphere} from "./diagnostics/NotInSphere";
import {NoStones} from "./diagnostics/NoStones";
import {TestResult} from "./diagnostics/DiagnosticUtil";
import {InSphere} from "./diagnostics/InSphere";
import {Permissions} from "../../backgroundProcesses/PermissionManager";

export const diagnosticStyles = {
  explanationStyle: {fontSize:15, paddingLeft:20, paddingRight:20, textAlign:'center'},
  headerStyle:      {fontSize:15, paddingLeft:20, paddingRight:20, padding:30, textAlign:'center', fontWeight:'bold'},
  titleStyle:       {fontSize:30, paddingLeft:20, paddingRight:20, paddingTop:25, textAlign:'center', fontWeight:'bold'},
  labelStyle:       {fontSize: 18, color: colors.menuBackground.hex, fontWeight: 'bold', },
  optionLabelStyle: {fontSize: 16, color: colors.csBlue.hex, fontWeight: 'bold', width: 0.80*screenWidth},
  buttonStyle:      {
    width:0.7*screenWidth,
    height:50,
    borderRadius: 25,
    borderWidth:2,
    borderColor: colors.menuBackground.hex,
    alignItems:'center',
    justifyContent:'center',
    marginBottom:30,
    marginTop:50,
  },
  smallButtonStyle: {
    width:0.35*screenWidth,
    height:50,
    borderRadius: 25,
    borderWidth:2,
    borderColor: colors.menuBackground.hex,
    alignItems:'center',
    justifyContent:'center',
    marginBottom:30,
    marginTop:50,
  },
  optionStyle: {
    flexDirection:'row',
    width:0.9*screenWidth,
    backgroundColor: colors.white.rgba(0.5),
    borderRadius:27,
    height:54,
    alignItems:'center',
    justifyContent:'flex-start',
    paddingLeft:10,
    marginTop:20,
  }
};


export const DiagnosticStates = {
  INTRODUCTION:         'INTRODUCTION',
  INITIAL_TESTS:        'INITIAL_TESTS',
  INITIAL_TESTS_REVIEW: 'INITIAL_TESTS_REVIEW',
  NO_STONES:            'NO_STONES',
  NOT_IN_SPHERE:        'NOT_IN_SPHERE',
  IN_SPHERE:            'IN_SPHERE',

};

export class SettingsDiagnostics extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Diagnostics"),
    }
  };

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

  evaluateTestProcess() {

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

    let state = this.props.store.getState();
    let spheres = state.spheres;
    let healthySpheres = true;
    let stoneCount = 0;

    Object.keys(spheres).forEach((sphereId) => {
      let sphere = spheres[sphereId];
      if (!sphere.config.iBeaconUUID || !sphere.config.adminKey && !sphere.config.memberKey && !sphere.config.guestKey ) {
        healthySpheres = false;
      }
      if (Permissions.inSphere(sphereId).canSetupCrownstone === true) {
        this.canSetupStones = true;
      }
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
            store={this.props.store}
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
            store={this.props.store}
          />
        );
      case DiagnosticStates.NOT_IN_SPHERE:
        return (
          <NotInSphere
            {...this.state}
            canSetupStones={this.canSetupStones}
            store={this.props.store}
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
            store={this.props.store}
          />
        );
    }
  }


  render() {
    this.evaluateTestProcess();
    return (
      <Background image={this.props.backgrounds.menu}>
        <OrangeLine/>
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

