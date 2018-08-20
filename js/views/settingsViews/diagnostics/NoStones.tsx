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
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {FadeInView, HiddenFadeInView} from "../../components/animated/FadeInView";
import {Actions} from "react-native-router-flux";
import {BackAction} from "../../../util/Back";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {
  DiagSingleBleTroubleshooter, DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonToOverview,
  DiagYesNo, TestResult
} from "./DiagnosticUtil";
import {TestRunner} from "./TestRunner";


export class NoStones extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = {
      visible: true,

      setupAdvertisements: null,
      crownstoneAdvertisements: null,
      anyAdvertisements: null,

      scanningFinished: null,
      userInputNearCrownstone: null,
      userInputHasPower: null,
      userInputVisitingSphere: null
    };
    setTimeout(() => { this.init(); }, 150);
  }

  init() {
    TestRunner.prepare();
    TestRunner.addAnyCrownstoneTest();
    TestRunner.addSetupCrownstoneTest();
    TestRunner.addBleTest();
    TestRunner.run()
      .then((result) => {
        let newState = { scanningFinished: true };
        newState["setupAdvertisements"]        = TestRunner.getSetupCrownstoneResult(result);
        newState["crownstoneAdvertisements"]   = TestRunner.getAnyCrownstoneResult(result);
        newState["anyAdvertisements"]          = TestRunner.getBleResult(result);

        this._changeContent(() => { this.setState(newState); });
      })
  }



  _changeContent(changeAction) {
    this.setState({visible: false});
    setTimeout(() => {
      changeAction(); this.setState({visible: true});
    }, 500);
  }


  _getResults() {
    if (this.state.userInputHasPower === true) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"If the Crownstone has power, and my scanning is working fine... You can try to take the power off the Crownstone and restarting your phone."}
          explanation={"If none of these work, this Crownstone may be broken.\n\nContact us at team@crownstone.rocks and we'll do our best to help you!"}
        />
      );
    }
    else if (this.state.userInputHasPower === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"The Crownstone needs power to work."}
          explanation={"Please ensure the Crownstone is powered and rerun the diagnostic if you still can't see it."}
        />
      );
    }
    else if (this.state.userInputNearCrownstone === true && this.state.anyAdvertisements) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={"\"You're near a Crownstone but I can't hear it. I am picking up other Bluetooth signals however. Are you sure the Crownstone has power?"}
          onPressNo={ () => { this._changeContent(() => { this.setState({userInputHasPower: false}); }); }}
          onPressYes={() => { this._changeContent(() => { this.setState({userInputHasPower: true}); }); }}
        />
      );
    }
    else if (this.state.userInputNearCrownstone === true && !this.state.anyAdvertisements) {
      return (
        <DiagSingleBleTroubleshooter
          visible={this.state.visible}
          header={"You're near a Crownstone and I'm not detecting any BLE signals, Crownstones or otherwise..."}
          explanation={"It could be that your phone's scanning has stopped.\n\nTap the button below to start the troubleshooter."}
        />
      );
    }
    else if (this.state.userInputNearCrownstone === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I'm not detecting anything and you're not near any Crownstones, everything should be OK!"}
        />
      );
    }
    else if (this.state.setupAdvertisements && this.props.canSetupStones === true) {
      return (
        <DiagSingleButtonToOverview
          visible={this.state.visible}
          header={"There is a Crownstone in setup mode nearby!"}
          explanation={ "You can add it to your Sphere by going to the overview.\n\n" +
          "Tap the button below to go there now!"}
        />
      );
    }
    else if (this.state.setupAdvertisements && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"There is a Crownstone in setup mode nearby. However, you do not have any Spheres in which you are an admin."}
          explanation={"Only admins can setup Crownstones."}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements && this.props.canSetupStones === false && this.state.userInputVisitingSphere === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear a Crownstone, but it does not seem to belong to your Sphere."}
          explanation={ "Since you are not an admin in any Sphere, you cannot setup Crownstones.\n\n" +
          "This means you can't see them while they are in setup mode."}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements && this.props.canSetupStones === true && this.state.userInputVisitingSphere === false) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={"I can hear a Crownstone, but it does not seem to belong to your Sphere."}
          explanation={"If it does belong to you, you can try to factory reset it.\n\n" +
          "Tap the button below to go to help and tap on 'I need to factory reset a Crownstone'."}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements && this.state.userInputVisitingSphere === true) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"If you want to join a friend's Sphere, they will need to invite you."}
          explanation={"Once they invite you, you can use their Crownstones!."}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements) {
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
        <DiagYesNo
          visible={this.state.visible}
          header={"I'm not picking up any Crownstones, but I am receiving other Bluetooth advertisements so my scanning should be working fine."}
          explanation={"Are you near a Crownstone?"}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputNearCrownstone: false}); }); }}
          onPressYes={() => { this._changeContent(() => { this.setState({userInputNearCrownstone: true}); }); }}
        />
      );
    }
    else {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={"I'm not picking up anything on my Bluetooth scan, Crownstone or otherwise."}
          explanation={"Are you near a Crownstone?"}
          onPressNo={ () => { this._changeContent(() => { this.setState({userInputNearCrownstone: false}); }); }}
          onPressYes={() => { this._changeContent(() => { this.setState({userInputNearCrownstone: true}); }); }}
        />
      );
    }
  }

  render() {
    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <Text style={diagnosticStyles.headerStyle}>{"You don't have any Crownstones yet..."}</Text>
        <View>
          <TestResult label={"Database is healthy"} state={ this.props.databaseHealth } />
          <TestResult label={"Scanning is enabled"} state={ this.props.iBeaconScanningEnabled } />
          <TestResult label={"Searching for Crownstones"}  state={ this.state.scanningFinished } />
        </View>
        { this._getResults() }
      </View>
    )
  }
}