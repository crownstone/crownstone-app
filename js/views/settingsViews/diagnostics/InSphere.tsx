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
    return <Text style={diagnosticStyles.headerStyle}>{"You're in your Sphere!"}</Text>
  }

  _getTests() {
    return (
      <SlideFadeInView visible={this.state.userInputProblemType !== 'localization'} height={180}>
        <TestResult label={"Database is healthy"}          state={ true } />
        <TestResult label={"Scanning is enabled"}          state={ true } />
        <TestResult label={"Receiving Sphere beacons"}     state={ true } />
        <TestResult label={"Receiving Crownstone data"}    state={ true } />
      </SlideFadeInView>
    )
  }


  _getResults() {
    if (this.state.userInputProblemType === 'other') {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={'Perhaps the Help menu can help you further.'}
          explanation={"Alternatively you can send us an email at team@crownstone.rocks and we'll do our best to help you!"}
        />
      );
    }
    else if (this.state.userInputProblems === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"Everything is working properly."}
          explanation={"You can close the diagnostics now.\n\nPress the button below to go back."}
        />
      );
    }
    else if (this.state.userInputProblems === true) {
      return (
        <DiagOptions
          visible={this.state.visible}
          header={"What are you having problems with?"}
          subExplanation={"Scroll down to see all options."}
          labels={[
            "A Crownstone.",
            "The indoor localization.",
            "Inviting users.",
            "Other..."
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
          header={"You're in your Sphere, and scanning is working as it should be."}
          explanation={"Are you experiencing any problems?"}
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
      let state = this.props.store.getState();
      let presentSphereId = Util.data.getPresentSphereId(state);

      if (Permissions.inSphere(presentSphereId).inviteGuestToSphere === false) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"You do not have permission to invite users to this Sphere...."}
            explanation={"You will have to ask a member or an admin to invite other users."}
          />
        );
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"You can add people to this Sphere by tapping on the '+' button in the lower right hand corner of the Sphere overview."}
            explanation={"Alternatively, you can tap 'Edit' in the top right hand corner of the Sphere overview."}
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