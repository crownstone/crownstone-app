
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ProblemWithNewCrownstone", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';
import {screenWidth} from "../../styles";
import {FadeInView} from "../../components/animated/FadeInView";
import {
  DiagSingleButton,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonToOverview, TestResult
} from "./DiagnosticUtil";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {TestRunner} from "./TestRunner";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import { diagnosticStyles } from "./DiagnosticStyles";


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
    TestRunner.addSetupCrownstoneTest();
    TestRunner.addNearestCheck();
    TestRunner.run()
      .then((result) => {
        let newState = {};

        newState["stonesInSetupMode"] = TestRunner.getSetupCrownstoneResult(result);
        let nearestScans = TestRunner.getNearestScans(result);
        let nearestCrownstone = null;
        let nearestCrownstoneRssi = -100;
        nearestScans.forEach((near) => {
          if (near.rssi > -1) { return; }

          if (nearestCrownstoneRssi < near.rssi) {
            nearestCrownstone = near;
            nearestCrownstoneRssi = near.rssi;
          }
        });

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
    return <Text style={diagnosticStyles.headerStyle}>{ lang("Problem_with_new_Crownsto") }</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={!this.state.newTestsVisible} height={180}>
          <TestResult label={ lang("Database_is_healthy")}          state={ true } />
          <TestResult label={ lang("Scanning_is_enabled")}          state={ true } />
          <TestResult label={ lang("Receiving_Sphere_beacons")}     state={ true } />
          <TestResult label={ lang("Receiving_Crownstone_data")}    state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.newTestsVisible} height={90}>
          <TestResult label={ lang("Checking_nearest_Crownsto")}    state={ this.state.nearestSuccess } />
          <TestResult label={ lang("Looking_for_setup_Crownst")}    state={ this.state.stonesInSetupMode } />
        </SlideFadeInView>
      </View>
    )
  }


  _getResults() {
    if (this.state.userInputPhoneIsClose === null) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={ lang("In_order_to_check_what_ma")}
          explanation={ lang("Press_the_button_below_on")}
          label={ lang("Ready_to_Test_")}
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
          header={ lang("The_nearest_Crownstone_is")}
          explanation={lang("You_can_add_it_to_your_Sp")}
        />
      );
    }
    else if (this.state.nearestSetup === true && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ lang("The_nearest_Crownstone_is_")}
          explanation={ lang("Only_admins_can_setup_Cro")}
        />
      );
    }
    else if (this.state.stonesInSetupMode === true && this.props.canSetupStones === true) {
      return (
        <DiagSingleButtonToOverview
          visible={this.state.visible}
          header={ lang("There_is_a_Crownstone_in_")}
          explanation={lang("You_can_add_it_to_your_Sp")}
        />
      );
    }
    else if (this.state.stonesInSetupMode === true && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ lang("There_is_a_Crownstone_in_s")}
          explanation={ lang("Only_admins_can_setup_Crow")}
        />
      );
    }
    else if (this.state.nearestVerified === true) {
      let name = "'" + this.state.nearestStoneObject.name + "'";
      if (this.state.nearestStoneObject.locationName) {
        name +=  lang("_in_",this.state.nearestStoneObject.locationName);
      }
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("The_nearest_stone_I_can_f",name) }
          explanation={lang("Please_ensure_that_the_Cr")}
        />
      );
    }
    else if (this.state.nearestOtherSphere === true && this.props.canSetupStones === true) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={ lang("I_can_hear_a_Crownstone_n")}
          explanation={lang("If_it_does_belong_to_you_")}
        />
      );
    }
    else if (this.state.nearestOtherSphere === true && this.props.canSetupStones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ lang("I_can_hear_a_Crownstone_ne")}
          explanation={lang("Since_you_are_not_an_admi")}
        />
      );
    }
    else if (this.state.userInputPhoneIsClose === true) {
      return (
        <View style={{flex:1}}>
          <View style={{flex:1}} />
          <FadeInView visible={this.state.visible} style={{width:screenWidth}}>
            <Text style={diagnosticStyles.headerStyle}>{ lang("Let_me_run_a_few_more_tes") }</Text>
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