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
          header={ Languages.label("NoStones", "If_the_Crownstone_has_pow")()}
          explanation={ Languages.label("NoStones", "If_none_of_these_work_this")()}
        />
      );
    }
    else if (this.state.userInputHasPower === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("NoStones", "The_Crownstone_needs_powe")()}
          explanation={ Languages.label("NoStones", "Please_ensure_the_Crownstone")()}
        />
      );
    }
    else if (this.state.userInputNearCrownstone === true && this.state.anyAdvertisements) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={Languages.label("NoStones", "You_re_near_a_Crownstone_but")()}
          onPressNo={ () => { this._changeContent(() => { this.setState({userInputHasPower: false}); }); }}
          onPressYes={() => { this._changeContent(() => { this.setState({userInputHasPower: true}); }); }}
        />
      );
    }
    else if (this.state.userInputNearCrownstone === true && !this.state.anyAdvertisements) {
      return (
        <DiagSingleBleTroubleshooter
          visible={this.state.visible}
          header={Languages.label("NoStones", "You_re_near_a_crownstone_")()}
          explanation={Languages.label("NoStones", "It_could_be_that_your_phone")()}
        />
      );
    }
    else if (this.state.userInputNearCrownstone === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={Languages.label("NoStones", "I_m_not_detecting_anythin")()}
        />
      );
    }
    else if (this.state.setupAdvertisements && this.props.canSetupStones === true) {
      return (
        <DiagSingleButtonToOverview
          visible={this.state.visible}
          header={ Languages.label("NoStones", "There_is_a_Crownstone_in_")()}
          explanation={ Languages.label("NoStones", "You_can_add_it_to_your_sphere")()}
        />
      );
    }
    else if (this.state.setupAdvertisements && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("NoStones", "There_is_a_Crownstone_in_s")()}
          explanation={ Languages.label("NoStones", "Only_admins_can_setup_Cro")()}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements && this.props.canSetupStones === false && this.state.userInputVisitingSphere === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("NoStones", "I_can_hear_a_Crownstone__")()}
          explanation={ Languages.label("NoStones", "Since_you_are_not_an_admin")()}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements && this.props.canSetupStones === true && this.state.userInputVisitingSphere === false) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={ Languages.label("NoStones", "I_can_hear_a_Crownstone__")()}
          explanation={ Languages.label("NoStones", "if_it_does_belong_to_you")()}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements && this.state.userInputVisitingSphere === true) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("NoStones", "If_you_want_to_join_a_friend")()}
          explanation={ Languages.label("NoStones", "Once_they_invite_you__you")()}
        />
      );
    }
    else if (this.state.crownstoneAdvertisements) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={ Languages.label("NoStones", "I_can_hear_a_Crownstone__")()}
          explanation={ Languages.label("NoStones", "Are_you_visiting_a_friends")()}
          onPressNo={ () => { this._changeContent(() => { this.setState({userInputVisitingSphere: false}); }); }}
          onPressYes={() => { this._changeContent(() => { this.setState({userInputVisitingSphere: true});  }); }}
        />
      );
    }
    else if (this.state.anyAdvertisements) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={  Languages.label("NoStones", "Im_not_picking_up_any")()}
          explanation={ Languages.label("NoStones", "Are_you_near_a_Crownstone")()}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputNearCrownstone: false}); }); }}
          onPressYes={() => { this._changeContent(() => { this.setState({userInputNearCrownstone: true}); }); }}
        />
      );
    }
    else {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={Languages.label("NoStones", "Im_not_picking_up_anything")()}
          explanation={ Languages.label("NoStones", "Are_you_near_a_Crownstone")()}
          onPressNo={ () => { this._changeContent(() => { this.setState({userInputNearCrownstone: false}); }); }}
          onPressYes={() => { this._changeContent(() => { this.setState({userInputNearCrownstone: true}); }); }}
        />
      );
    }
  }

  render() {
    return (
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <Text style={diagnosticStyles.headerStyle}>{ Languages.text("NoStones", "You_dont_have_any_Crownst")() }</Text>
        <View>
          <TestResult label={ Languages.label("NoStones", "Database_is_healthy")()} state={ this.props.databaseHealth } />
          <TestResult label={ Languages.label("NoStones", "Scanning_is_enabled")()} state={ this.props.iBeaconScanningEnabled } />
          <TestResult label={ Languages.label("NoStones", "Searching_for_Crownstones")()}  state={ this.state.scanningFinished } />
        </View>
        { this._getResults() }
      </View>
    )
  }
}