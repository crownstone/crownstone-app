import { Languages } from "../../../Languages"
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
import {
  DiagSingleBleTroubleshooter,
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
      return <Text style={diagnosticStyles.headerStyle}>{ Languages.text("NotInSphere", "Sphere_tests_completed_")() }</Text>
    }
    else if (this.state.shouldBeInSphere === true && !this.state.scanningFinished) {
      return <Text style={diagnosticStyles.headerStyle}>{ Languages.text("NotInSphere", "Running_Sphere_tests___")() }</Text>
    }
    else {
      return <Text style={diagnosticStyles.headerStyle}>{ Languages.text("NotInSphere", "Initial_tests_completed_")() }</Text>
    }
  }

  _getTests() {
    if (this.state.shouldBeInSphere === true) {
      return (
        <View>
          <TestResult label={ Languages.label("NotInSphere", "Database_is_healthy")()}       state={ this.props.databaseHealth   } />
          <TestResult label={ Languages.label("NotInSphere", "Scanning_is_enabled")()}       state={ this.props.isMonitoring     } />
          <TestResult label={ Languages.label("NotInSphere", "Listening_for_Crownstones")()} state={ this.state.scanningFinished } />
        </View>
      );
    }
    else {
      return (
        <View>
          <TestResult label={ Languages.label("NotInSphere", "Database_is_healthy")()} state={ this.props.databaseHealth } />
          <TestResult label={ Languages.label("NotInSphere", "Scanning_is_enabled")()} state={ this.props.isMonitoring   } />
        </View>
      )
    }
  }

  _getResults() {
    let state = this.props.store.getState();
    let spheres = state.spheres;
    let keysLoaded = false;
    Object.keys(spheres).forEach((sphereId) => {
      if (spheres[sphereId].state.present === true) {
        keysLoaded = true;
      }
    })

    if (this.state.scanningFinished) {
      if (this.state.ibeacons && this.state.verifiedAdvertisements === false && !this.props.canSetupStones) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={Languages.label("NotInSphere","Im_picking_up_beacon_sign")()}
            explanation={ Languages.label("NotInSphere","This_can_happen_if_someon")() }
          />
        );
      }
      else if (this.state.ibeacons && this.state.verifiedAdvertisements === false) {
        return (
          <DiagSingleButtonHelp
            visible={this.state.visible}
            header={Languages.label("NotInSphere","Im_picking_up_beacon_sign")()}
            explanation={ Languages.label("NotInSphere","This_can_be_bad_timing_or")() }
          />
        );
      }
      else if (this.state.ibeacons === false && this.state.verifiedAdvertisements) {
        return (
          <DiagSingleButtonQuit
            visible={this.state.visible}
            header={ Languages.label("NotInSphere","Im_picking_up_data_from_y")()}
            explanation={ Languages.label("NotInSphere", "This_can_happen_if_there_")()}
          />
        );
      }
      else if (this.state.setupAdvertisements && this.props.canSetupStones) {
        return (
          <DiagSingleButtonToOverview
            visible={this.state.visible}
            header={Languages.label("NotInSphere","I_cant_hear_any_of_your_Cr_adm")()}
            explanation={Languages.label("NotInSphere","You_can_add_it_to_your_Sph")()}
          />
        );
      }
      else if (this.state.setupAdvertisements && !this.props.canSetupStones) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ Languages.label("NotInSphere","I_cant_hear_any_of_your_Cr")()}
            explanation={ Languages.label("NotInSphere", "Only_admins_can_setup_Cro")()}
          />
        );
      }
      else if (this.state.anyCrownstoneAdvertisements && this.props.canSetupStones && this.state.userInputVisitingSphere === false) {
        if (!keysLoaded) {
          return (
            <DiagSingleBleTroubleshooter
              visible={this.state.visible}
              header={Languages.label("NotInSphere","I_can_hear_a_Crownstone_bu")()}
              explanation={ Languages.label("NotInSphere", "In_this_case__you_can_try")()}
            />
          );
        }
        else {
          return (
            <DiagSingleButtonHelp
              visible={this.state.visible}
              header={
                Languages.label("NotInSphere","I_can_hear_a_Crownstone__noAdm")()
              }
              explanation={Languages.label("NotInSphere","Tap_the_button_below_to_go")()}
            />
          );
        }
      }
      else if (this.state.anyCrownstoneAdvertisements && !this.props.canSetupStones && this.state.userInputVisitingSphere === false) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={Languages.label("NotInSphere","I_can_hear_a_Crownstone__b")()}
          />
        );
      }
      else if (this.state.anyCrownstoneAdvertisements && this.state.userInputVisitingSphere === true) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={Languages.label("NotInSphere","If_you_want_to_join_a_frie")()}
            explanation={ Languages.label("NotInSphere", "Once_they_invite_you__you")()}
          />
        );
      }
      else if (this.state.anyCrownstoneAdvertisements) {
        return (
          <DiagYesNo
            visible={this.state.visible}
            header={ Languages.label("NotInSphere", "I_can_hear_a_Crownstone__")()}
            explanation={Languages.label("NotInSphere","Are_you_visiting_a_friends")()}
            onPressNo={ () => { this._changeContent(() => { this.setState({userInputVisitingSphere: false}); }); }}
            onPressYes={() => { this._changeContent(() => { this.setState({userInputVisitingSphere: true}); }); }}
          />
        );
      }
      else if (this.state.anyAdvertisements) {
        return (
          <DiagSingleButtonQuit
            visible={this.state.visible}
            header={Languages.label("NotInSphere","Im_not_picking_up_any_Crow")()}
            explanation={Languages.label("NotInSphere","This_can_happen_if_there_i")()}
          />
        );
      }
      else if (this.state.anyAdvertisements === false) {
        return (
          <DiagSingleBleTroubleshooter
            visible={this.state.visible}
            header={ Languages.label("NotInSphere", "I_m_not_picking_up_anythi")()}
            explanation={ Languages.label("NotInSphere", "It_could_be_that_your_phone")()}
          />
        );
      }
    }

    if (this.state.shouldBeInSphere === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("NotInSphere", "In_that_case__everything_")()}
          explanation={ Languages.label("NotInSphere", "If_you_have_any_questions")()}
        />
      );
    }
    else if (this.state.shouldBeInSphere === true) {
      return (
        <View style={{flex:1}}>
          <View style={{flex:1}} />
          <FadeInView visible={this.state.visible} style={{width:screenWidth}}>
            <Text style={diagnosticStyles.headerStyle}>{ Languages.text("NotInSphere", "Let_me_run_a_few_more_tes")() }</Text>
          </FadeInView>
          <View style={{flex:1}} />
        </View>
      );
    }
    else {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={ Languages.label("NotInSphere", "So_far_so_good__n_nAre_yo")()}
          subExplanation={ Languages.label("NotInSphere", "_close_to_your_Crownstone")()}
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