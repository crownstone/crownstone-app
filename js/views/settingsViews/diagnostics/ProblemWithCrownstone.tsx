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
  TestResult
} from "./DiagnosticUtil";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {ProblemWithExistingCrownstone} from "./ProblemWithExistingCrownstone";
import {ProblemWithNewCrownstone} from "./ProblemWithNewCrownstone";


export class ProblemWithCrownstone extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      userInputExistingCrownstone:     null,
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
      <View>
        <TestResult label={"Database is healthy"}          state={ true } />
        <TestResult label={"Scanning is enabled"}          state={ true } />
        <TestResult label={"Receiving Sphere beacons"}     state={ true } />
        <TestResult label={"Receiving Crownstone data"}    state={ true } />
      </View>
    )
  }

  render() {
    if (this.state.userInputExistingCrownstone === true) {
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
            header={"Is the problem with a new or an existing Crownstone?"}
            labels={["new", "existing"]}
            pressHandlers={[
              () => { this._changeContent(() => { this.setState({userInputExistingCrownstone: false}); }); },
              () => { this._changeContent(() => { this.setState({userInputExistingCrownstone: true }); }); }
            ]}
          />
        </View>
      )
    }
  } 

}