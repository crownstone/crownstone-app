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
import {diagnosticStyles} from "../SettingsDiagnostics";
import {colors, screenWidth} from "../../styles";
import {FadeInView} from "../../components/animated/FadeInView";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {
  DiagOptions,
  DiagSingleBleTroubleshooter, DiagSingleButton,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonQuit, DiagSingleButtonToOverview, DiagYesNo, TestResult
} from "./DiagnosticUtil";
import {SlideInView} from "../../components/animated/SlideInView";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {TestRunner} from "./TestRunner";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {Util} from "../../../util/Util";


export class ProblemWithNewCrownstone extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      newTestsVisible: false,

      stonesInSetupMode:  null,
      nearestSuccess:     null,

      nearestVerified:    null,
      nearestSetup:       null,
      nearestOtherSphere: null,
      nearestStoneObject: null,

      problemStoneSummary:      null,
      crownstoneProblemType:    null,

      userInputProblemCrownstoneId:    null,
      userInputProblemsWithCrownstone: null,
      userInputProblems:               null,
      userInputExistingCrownstone:     null,
      userInputPhoneIsClose:           null,
    };
    setTimeout(() => { this.setState({visible: true}) }, 10);
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe(); })
  }

  _changeContent(changeAction) {
    this.setState({visible: false});
    setTimeout(() => {
      changeAction(); this.setState({visible: true})
    }, 400)
  }


  _runNewCrownstoneTests() {
    this.setState({newTestsVisible: true});
    TestRunner.prepare();
    TestRunner.addSetupCrownstoneTest()
    TestRunner.addNearestCheck()
    TestRunner.run()
      .then((result) => {
        let newState = {};

        newState["stonesInSetupMode"] = TestRunner.getSetupCrownstoneResult(result);
        let nearestScans = TestRunner.getNearestScans(result);
        let nearestCrownstone = null
        let nearestCrownstoneRssi = -100;
        nearestScans.forEach((near) => {
          if (near.rssi > -1) { return; }

          if (nearestCrownstoneRssi < near.rssi) {
            nearestCrownstone = near;
            nearestCrownstoneRssi = near.rssi;
          }
        })

        if (nearestCrownstone === null && nearestScans.length > 0) {
          nearestCrownstone = nearestScans[0];
        }

        // load default values.
        newState["nearestVerified"]    = false;
        newState["nearestSetup"]       = false;
        newState["nearestOtherSphere"] = false;
        newState["nearestSuccess"]     = false;

        // check what we got
        if (nearestCrownstone) {
          let stone = MapProvider.stoneHandleMap[nearestCrownstone.handle];
          newState["nearestSuccess"] = true;
          if (stone) {
            newState["nearestVerified"] = true;
            newState["nearestStoneObject"] = stone;
          }
          else {
            newState["nearestOtherSphere"] = true;
          }
          if (nearestCrownstone.setupMode) {
            newState["nearestSetup"] = true;
          }
        }
        this.setState(newState);
      })
  }

  _getHeader() {
    return <Text style={diagnosticStyles.headerStyle}>{"You're in your Sphere!"}</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={!this.state.newTestsVisible} height={180}>
          <TestResult label={"Database is healthy"}          state={ true } />
          <TestResult label={"Scanning is enabled"}          state={ true } />
          <TestResult label={"Receiving Sphere beacons"}     state={ true } />
          <TestResult label={"Receiving Crownstone data"}    state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.newTestsVisible} height={90}>
          <TestResult label={"Checking nearest Crownstone"}    state={ this.state.nearestSuccess } />
          <TestResult label={"Looking for setup Crownstones"}    state={ this.state.stonesInSetupMode } />
        </SlideFadeInView>
      </View>
    )
  }


  _getResults() {
    if (this.state.userInputPhoneIsClose === null) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={"In order to check what may the the problem, your phone should be nearly touching this Crownstone and it should be powered on."}
          explanation={"Press the button below once everything is ready."}
          label={"Ready to Test!"}
          onPress={() => { this._changeContent(() => {
            this.setState({userInputPhoneIsClose: true  });
            this._runNewCrownstoneTests();
          }); }}
        />
      );
    }
    else if (this.state.nearestSetup === true && this.props.canSetupStones === true) {
      return (
        <DiagSingleButtonToOverview
          visible={this.state.visible}
          header={"The nearest Crownstone is in setup mode!"}
          explanation={ "You can add it to your Sphere by going to the overview.\n\n" +
          "Tap the button below to go there now!"}
        />
      );
    }
    else if (this.state.nearestSetup === true && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"The nearest Crownstone is in setup mode! However, you do not have any Spheres in which you are an admin."}
          explanation={"Only admins can setup Crownstones."}
        />
      );
    }
    else if (this.state.stonesInSetupMode === true && this.props.canSetupStones === true) {
      return (
        <DiagSingleButtonToOverview
          visible={this.state.visible}
          header={"There is a Crownstone in setup mode nearby!"}
          explanation={"You can add it to your Sphere by going to the overview.\n\n" +
          "Tap the button below to go there now!"}
        />
      );
    }
    else if (this.state.stonesInSetupMode === true && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"There is a Crownstone in setup mode nearby! However, you do not have any Spheres in which you are an admin."}
          explanation={"Only admins can setup Crownstones."}
        />
      );
    }
    else if (this.state.nearestVerified === true) {
      let name = "'" + this.state.nearestStoneObject.name + "'";
      if (this.state.nearestStoneObject.applianceName) {
        name +=  " with device '" + this.state.nearestStoneObject.applianceName + "'";
      }
      if (this.state.nearestStoneObject.locationName) {
        name += " in '" + this.state.nearestStoneObject.locationName + "'";
      }
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"The nearest stone I can find is " + name + '.' }
          explanation={"Please ensure that the Crownstone you're near is in fact a new one."}
        />
      );
    }
    else if (this.state.nearestOtherSphere === true && this.props.canSetupStones === true) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={"I can hear a Crownstone near, but it does not seem to belong to your Sphere."}
          explanation={"If it does belong to you, you can try to factory reset it.\n\n" +
          "Tap the button below to go to help and tap on 'I need to factory reset a Crownstone'."}
        />
      );
    }
    else if (this.state.nearestOtherSphere === true && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear a Crownstone near , but it does not seem to belong to your Sphere."}
          explanation={ "Since you are not an admin in any Sphere, you cannot setup Crownstones.\n\n" +
          "This means you can't see them while they are in setup mode."}
        />
      );
    }
    else if (this.state.userInputPhoneIsClose === true) {
      return (
        <View style={{flex:1}}>
          <View style={{flex:1}} />
          <FadeInView visible={this.state.visible} style={{width:screenWidth}}>
            <Text style={diagnosticStyles.headerStyle}>{"Let me run a few more tests..."}</Text>
          </FadeInView>
          <View style={{flex:1}} />
        </View>
      );
    }
  }


  render() {
    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        { this._getHeader()  }
        { this._getTests()   }
        { this._getResults() }
      </View>
    )
  } 

}