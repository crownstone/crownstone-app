
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("InSphere", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';
import {
  DiagOptions,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagYesNo,
  TestResult
} from "./DiagnosticUtil";
import {ProblemWithCrownstone} from "./ProblemWithCrownstone";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {ProblemWithLocalization} from "./ProblemWithLocalization";
import {Util} from "../../../util/Util";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { diagnosticStyles } from "./DiagnosticStyles";
import { core } from "../../../core";


export class InSphere extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,

      userInputProblemType: null,
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

  _getHeader() {
    return <Text style={diagnosticStyles.headerStyle}>{ lang("Youre_in_your_Sphere_") }</Text>
  }

  _getTests() {
    return (
      <SlideFadeInView visible={this.state.userInputProblemType !== 'localization'} height={180}>
        <TestResult label={ lang("Database_is_healthy")}          state={ true } />
        <TestResult label={ lang("Scanning_is_enabled")}          state={ true } />
        <TestResult label={ lang("Receiving_Sphere_beacons")}     state={ true } />
        <TestResult label={ lang("Receiving_Crownstone_data")}    state={ true } />
      </SlideFadeInView>
    )
  }


  _getResults() {
    if (this.state.userInputProblemType === 'other') {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={ lang("Perhaps_the_Help_menu_can")}
          explanation={lang("Alternatively_you_can_send")}
        />
      );
    }
    else if (this.state.userInputProblems === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ lang("Everything_is_working_pro")}
          explanation={ lang("You_can_close_the_diagnos")}
        />
      );
    }
    else if (this.state.userInputProblems === true) {
      return (
        <DiagOptions
          visible={this.state.visible}
          header={ lang("What_are_you_having_probl")}
          subExplanation={ lang("Scroll_down_to_see_all_op")}
          labels={[
            lang("aCrownstone"),
            lang("theIndoorLocalization"),
            lang("invitingUsers"),
            lang("other___"),
          ]}
          pressHandlers={[
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'crownstone'   }); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'localization' }); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'inviting'     }); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'other'        }); }); },
          ]}
        />
      );
    }
    else {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={lang("You_re_in_your_sphere_and")}
          explanation={ lang("Are_you_experiencing_any_") }
          onPressNo={() => { this._changeContent(() => { this.setState({userInputProblems: false}); }); }}
          onPressYes={() => {this._changeContent(() => { this.setState({userInputProblems: true }); }); }}
        />
      );
    }
  }


  render() {
    if (this.state.userInputProblemType === 'crownstone') {
      return (
        <ProblemWithCrownstone
          { ...this.props }
        />
      );
    }
    else if (this.state.userInputProblemType === 'localization') {
      return (
        <ProblemWithLocalization
          { ...this.props }
        />
      );
    }
    else if (this.state.userInputProblemType === 'inviting') {
      let state = core.store.getState();
      let presentSphereId = Util.data.getPresentSphereId(state);

      if (Permissions.inSphere(presentSphereId).inviteGuestToSphere === false) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ lang("You_do_not_have_permissio")}
            explanation={ lang("You_will_have_to_ask_a_me")}
          />
        );
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={lang("You_can_add_people_to_thi")}
            explanation={lang("Alternatively_you_can_tap")}
          />
        );
      }
    }
    else {
      return (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          { this._getHeader()  }
          { this._getTests()   }
          { this._getResults() }
        </View>
      )
    }
  }

}