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
import {FadeInView, HiddenFadeInView} from "../../components/animated/FadeInView";
import {BackAction} from "../../../util/Back";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {Actions} from "react-native-router-flux";
import {AppUtil} from "../../../util/AppUtil";
import {
  DiagSingleBleTroubleshooter,
  DiagSingleButton,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonQuit, DiagSingleButtonToOverview, DiagYesNo, TestResult
} from "./DiagnosticUtil";
import {TestRunner} from "./TestRunner";


export class NotInSphere extends Component<any, any> {
  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      shouldBeInSphere: this.props.ibeacons === false ? true : null,

      ibeacons: null,
      setupAdvertisements: null,
      anyCrownstoneAdvertisements: null,
      verifiedAdvertisements: null,
      anyAdvertisements: null,

      scanningFinished: null,
      userInputVisitingSphere: null,
    };

    if (this.props.ibeacons === false) {
      setTimeout(() => { this._runSphereTests(); }, 250);

    }

    setTimeout(() => { this.setState({visible: true}) }, 10);
  }


  _changeContent(changeAction) {
    this.setState({visible: false});
    setTimeout(() => {
      changeAction(); this.setState({visible: true})
    }, 400)
  }

  _runSphereTests() {
    TestRunner.prepare();
    TestRunner.addIBeaconTest();
    TestRunner.addVerifiedCrownstoneTest();
    TestRunner.addAnyCrownstoneTest();
    TestRunner.addSetupCrownstoneTest();
    TestRunner.addBleTest();
    TestRunner.run()
      .then((result) => {
        let newState = { scanningFinished: true };
        newState["ibeacons"]                    = TestRunner.getIBeaconResult(result);
        newState["setupAdvertisements"]         = TestRunner.getSetupCrownstoneResult(result);
        newState["anyCrownstoneAdvertisements"] = TestRunner.getAnyCrownstoneResult(result);
        newState["verifiedAdvertisements"]      = TestRunner.getVerifiedCrownstoneResult(result);
        newState["anyAdvertisements"]           = TestRunner.getBleResult(result);

        if (newState["ibeacons"] && newState["verifiedAdvertisements"]) {
          this.props.amInSphere();
        }
        else {
          this._changeContent(() => { this.setState(newState); });
        }
      })
  }

  _getHeader() {
    if (this.state.shouldBeInSphere === true && this.state.scanningFinished) {
      return <Text style={diagnosticStyles.headerStyle}>{"Sphere tests completed!"}</Text>
    }
    else if (this.state.shouldBeInSphere === true && !this.state.scanningFinished) {
      return <Text style={diagnosticStyles.headerStyle}>{"Running Sphere tests..."}</Text>
    }
    else {
      return <Text style={diagnosticStyles.headerStyle}>{"Initial tests completed!"}</Text>
    }
  }

  _getTests() {
    if (this.state.shouldBeInSphere === true) {
      return (
        <View>
          <TestResult label={"Database is healthy"}       state={ this.props.databaseHealth   } />
          <TestResult label={"Scanning is enabled"}       state={ this.props.isMonitoring     } />
          <TestResult label={"Listening for Crownstones"} state={ this.state.scanningFinished } />
        </View>
      );
    }
    else {
      return (
        <View>
          <TestResult label={"Database is healthy"} state={ this.props.databaseHealth } />
          <TestResult label={"Scanning is enabled"} state={ this.props.isMonitoring   } />
        </View>
      )
    }
  }

  _getResults() {
    if (this.state.scanningFinished) {
      if (this.state.ibeacons && this.state.verifiedAdvertisements === false && !this.props.canSetupStones) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"I'm picking up beacon signals from your Sphere, but no data from your Crownstones."}
            explanation={
              "This can happen if someone has removed a Crownstone from your Sphere without telling it to forget your Sphere.\n\n" +
              "You should ask the admin of your Sphere to factory reset this Crownstone."
            }
          />
        );
      }
      else if (this.state.ibeacons && this.state.verifiedAdvertisements === false) {
        return (
          <DiagSingleButtonHelp
            visible={this.state.visible}
            header={"I'm picking up beacon signals from your Sphere, but no data from your Crownstones."}
            explanation={
              "This can be bad timing or this can happen if someone has removed a Crownstone from your Sphere without telling it to forget your Sphere.\n\n" +
              "If this happens more often, you can factory reset the Crownstone that was wrongly removed.\n\n" +
              "To do this, tap the button below to go to the Help menu and tap on 'I need to factory reset a Crownstone'."
            }
          />
        );
      }
      else if (this.state.ibeacons === false && this.state.verifiedAdvertisements) {
        return (
          <DiagSingleButtonQuit
            visible={this.state.visible}
            header={"I'm picking up data from your Crownstones, but no beacon signals from your Sphere."}
            explanation={"This can happen if there is a miscommunication between your phone and the app. Try restarting both to fix this problem."}
          />
        );
      }
      else if (this.state.setupAdvertisements && this.props.canSetupStones) {
        return (
          <DiagSingleButtonToOverview
            visible={this.state.visible}
            header={"I can't hear any of your Crownstones, nor beacon signals from your Sphere. But there is a Crownstone in setup mode nearby!"}
            explanation={"You can add it to your Sphere by going to the overview.\n\n" +
            "Tap the button below to go there now!"}
          />
        );
      }
      else if (this.state.setupAdvertisements && !this.props.canSetupStones) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"I can't hear any of your Crownstones, nor beacon signals from your Sphere.\n\nThere is a Crownstone in setup mode nearby. However, you do not have any Spheres in which you are an Admin."}
            explanation={"Only admins can setup Crownstones."}
          />
        );
      }
      else if (this.state.anyCrownstoneAdvertisements && this.props.canSetupStones && this.state.userInputVisitingSphere === false) {
        return (
          <DiagSingleButtonHelp
            visible={this.state.visible}
            header={
              "I can hear a Crownstone, but it does not seem to belong to your Sphere.\n\n" +
              "If it does belong to you, you can try to factory reset it."
            }
            explanation={"Tap the button below to go to help and tap on 'I need to factory reset a Crownstone'."}
          />
        );
      }
      else if (this.state.anyCrownstoneAdvertisements && !this.props.canSetupStones && this.state.userInputVisitingSphere === false) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"I can hear a Crownstone, but it does not seem to belong to your Sphere.\n\n" +
            "Since you are not an admin in any Sphere, you cannot setup Crownstones.\n\n" +
            "This means you can't see them while they are in setup mode."}
          />
        );
      }
      else if (this.state.anyCrownstoneAdvertisements && this.state.userInputVisitingSphere === true) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"If you want to join a friend's Sphere, they will need to invite you."}
            explanation={"Once they invite you, you can use their Crownstones!."}
          />
        );
      }
      else if (this.state.anyCrownstoneAdvertisements) {
        return (
          <DiagYesNo
            visible={this.state.visible}
            header={"I can hear a Crownstone, but it does not seem to belong to your Sphere."}
            explanation={"Are you visiting a friend's Sphere?"}
            onPressNo={ () => { this._changeContent(() => { this.setState({userInputVisitingSphere: false}); }); }}
            onPressYes={() => { this._changeContent(() => { this.setState({userInputVisitingSphere: true}); }); }}
          />
        );
      }
      else if (this.state.anyAdvertisements) {
        return (
          <DiagSingleButtonQuit
            visible={this.state.visible}
            header={"I'm not picking up any Crownstones, but I am receiving other Bluetooth advertisements so my scanning should be working fine."}
            explanation={"This can happen if there is a miscommunication between your phone and the app. Try restarting both to fix this problem.\n\n" +
            "If this persists, your Crownstones may be unpowered or defective. Contact us at team@crownstone.rocks for more assistance."}
          />
        );
      }
      else if (this.state.anyAdvertisements === false) {
        return (
          <DiagSingleBleTroubleshooter
            visible={this.state.visible}
            header={"I'm not picking up anything on my Bluetooth scan, Crownstone or otherwise."}
            explanation={"It could be that your phone's scanning has stopped.\n\nTap the button below to start the troubleshooter."}
          />
        );
      }
    }

    if (this.state.shouldBeInSphere === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"In that case, everything seems to be working as it should be!"}
          explanation={
            "If you have any questions you can take a look at the Help menu, or run the diagnostic again when you're in your Sphere."
          }
        />
      );
    }
    else if (this.state.shouldBeInSphere === true) {
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
    else {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={"So far so good!\n\nAre you in a Sphere right now?"}
          subExplanation={"(close to your Crownstones)"}
          onPressNo={() => { this._changeContent(() => { this.setState({shouldBeInSphere: false}); }); }}
          onPressYes={() => {
            this._changeContent(() => {
              this.setState({shouldBeInSphere: true});
              this._runSphereTests();
            });
          }}
        />
      );
    }
  }


  render() {
    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        { this._getHeader() }
        { this._getTests() }
        { this._getResults() }
      </View>
    )
  }

}