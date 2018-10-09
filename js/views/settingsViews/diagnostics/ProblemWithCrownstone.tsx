
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ProblemWithCrownstone", key)(a,b,c,d,e);
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
import {diagnosticStyles} from "../SettingsDiagnostics";
import {
  DiagOptions,
  DiagSingleButton,
  DiagSingleButtonGoBack,
  DiagSingleButtonHelp,
  DiagSingleButtonToOverview,
  DiagWaiting,
  DiagYesNo, nameFromSummary,
  TestResult
} from "./DiagnosticUtil";
import {ProblemWithExistingCrownstone} from "./ProblemWithExistingCrownstone";
import {ProblemWithNewCrownstone} from "./ProblemWithNewCrownstone";
import {ProblemWithOtherCrownstone} from "./ProblemWithOtherCrownstone";


export class ProblemWithCrownstone extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      userInputOther: null,
      userInputExistingCrownstone: null,
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
      <View>
        <TestResult label={ lang("Database_is_healthy")}          state={ true } />
        <TestResult label={ lang("Scanning_is_enabled")}          state={ true } />
        <TestResult label={ lang("Receiving_Sphere_beacons")}     state={ true } />
        <TestResult label={ lang("Receiving_Crownstone_data")}    state={ true } />
      </View>
    )
  }

  render() {
    if (this.state.userInputOther) {
      return <ProblemWithOtherCrownstone {...this.props} />
    }
    else if (this.state.userInputExistingCrownstone === true) {
      return <ProblemWithExistingCrownstone {...this.props} />
    }
    else if (this.state.userInputExistingCrownstone === false) {
      return <ProblemWithNewCrownstone {...this.props} />
    }
    else {
      return (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          {this._getHeader()}
          {this._getTests()}
          <DiagOptions
            visible={this.state.visible}
            header={ lang("Is_the_problem_with_a_new")}
            labels={[
              "new",
              "existing",
              "other"
            ]}
            pressHandlers={[
              () => { this._changeContent(() => { this.setState({userInputExistingCrownstone: false}); }); },
              () => { this._changeContent(() => { this.setState({userInputExistingCrownstone: true }); }); },
              () => { this._changeContent(() => { this.setState({userInputOther: true }); }); }
            ]}
          />
        </View>
      );
    }
  }

}