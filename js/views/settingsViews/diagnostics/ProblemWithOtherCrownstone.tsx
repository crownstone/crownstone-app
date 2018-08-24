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
import {BleUtil} from "../../../util/BleUtil";
import {BluenetPromiseWrapper} from "../../../native/libInterface/BluenetPromise";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {Util} from "../../../util/Util";
import {TestRunner} from "./TestRunner";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";


export class ProblemWithOtherCrownstone extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      otherTestsVisible: false,

      factoryResetSuccess: null,
      canSeeNearbyCrownstones: null,
      nearestCheck: null,

      userInputOther: null,
      userInputNearby: null,
      userInputResetCrownstoneNow: null,

    };
    setTimeout(() => { this.setState({visible: true}) }, 10);
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe(); })
  }

  _factoryResetMyLostCrownstone(handle) {
    let proxy = BleUtil.getProxy(handle);
    return proxy.performPriority(BluenetPromiseWrapper.commandFactoryReset)
      .then(() => { this.setState({factoryResetSuccess: true}); })
      .catch(() => { this.setState({factoryResetSuccess: false}); })
  }

  _changeContent(changeAction) {
    this.setState({visible: false});
    setTimeout(() => {
      changeAction(); this.setState({visible: true})
    }, 400)
  }

  _getHeader() {
    return <Text style={diagnosticStyles.headerStyle}>{"Problem with missing Crownstone..."}</Text>
  }

  _runOtherCrownstoneTests() {
    this.setState({otherTestsVisible: true});

    TestRunner.prepare();
    TestRunner.addNearestCheck();
    TestRunner.run()
      .then((result) => {
        setTimeout(() => {
          this.setState({
            canSeeNearbyCrownstones: TestRunner.getNearestResult(result),
            nearestCheck: TestRunner.getNearestScans(result),
          });
        }, 500)
      })
      .catch((err) => { console.error(err); })
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={!this.state.otherTestsVisible} height={180}>
          <TestResult label={"Database is healthy"}          state={ true } />
          <TestResult label={"Scanning is enabled"}          state={ true } />
          <TestResult label={"Receiving Sphere beacons"}     state={ true } />
          <TestResult label={"Receiving Crownstone data"}    state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.otherTestsVisible} height={180}>
          <TestResult label={"Scanning for nearby Crownstones"} state={ this.state.canSeeNearbyCrownstones } />
        </SlideFadeInView>
      </View>
    )
  }

  _getOtherCrownstone() {
    if (this.state.userInputNearby === null) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={"It can sometimes happen that a Crownstone that used to be in your Sphere is gone.\n\n" +
          "This does not mean it is 'Searching...' in the app. If that is what you're looking for, restart the diagnostics and select 'existing'."}
          explanation={"If you think this is the case here, go close to the Crownstone that has disappeared and press the button below."}
          label={"I'm near it!"}
          onPress={() => {
            this._changeContent(() => {
              this.setState({ userInputNearby: true });
              this._runOtherCrownstoneTests();
            });
          }}
        />
      );
    }
    else if (this.state.canSeeNearbyCrownstones === null) {
      return <DiagWaiting visible={this.state.visible} header={"Checking for nearby Crownstones..."}/>
    }
    else if (this.state.canSeeNearbyCrownstones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can't detect any Crownstone nearby... You can try to take the power off it for a while and restart the diagnostic."}
          explanation={"If this keeps happening, contact us at team@crownstone.rocks and we'll do our best to help!"}
        />
      );
    }
    else {
      if (this.state.factoryResetSuccess === true) {
        return (
          <DiagSingleButtonToOverview
            visible={this.state.visible}
            header={"Crownstone successfully reset!"}
            explanation={"It will be in setup mode now. You can add it to your Sphere again from the Sphere overview.\n\nTap the button below to go there now."}
          />
        );
      }
      else if (this.state.factoryResetSuccess === false) {
        return (
          <DiagSingleButtonHelp
            visible={this.state.visible}
            header={"Failed to reset Crownstone..."}
            explanation={"Something went wrong during the recover process.. You can try to factory reset it yourself!\n\n" +
            "Tap the button below to go to help and tap on 'I need to factory reset a Crownstone'."}
          />
        );
      }
      else if (this.state.userInputResetCrownstoneNow === true) {
        return <DiagWaiting visible={this.state.visible} header={"Factory resetting your lost Crownstone..."}/>;
      }
      else {
        let nearCrownstones = this.state.nearestCheck;
        let maxRssi = -1000;
        let nearest = null;
        nearCrownstones.forEach((near: nearestStone) => {
          if (maxRssi < near.rssi) {
            nearest = near;
            maxRssi = near.rssi;
          }
        });

        if (nearest) {
          let noun = null;
          if (nearest.rssi > -55) {
            noun = 'very';
          }
          else if (nearest.rssi > -65) {
            noun = 'pretty'
          }
          else if (nearest.rssi > -75) {
            noun = 'somewhat'
          }
          else if (nearest.rssi > -85) {
            noun = 'not that'
          }
          let state = this.props.store.getState();
          let sphereId = Util.data.getPresentSphereId(state);
          let nearSummary = MapProvider.stoneHandleMap[nearest.handle];
          if (!nearSummary) {
            if (nearest.verified === true) {
              if (Permissions.inSphere(sphereId).removeCrownstone) {
                return (
                  <DiagYesNo
                    visible={this.state.visible}
                    header={"The nearest Crownstone belongs to your Sphere but it has been removed from your database.\n\nIt's " + noun + " close by."}
                    explanation={"This can happen when someone removed this Crownstone from your Sphere, but they did not factory reset it.\n\nWould you like me to reset it?"}
                    onPressNo={() => {
                      this._changeContent(() => {
                        this.setState({userInputResetCrownstoneNow: false});
                      })
                    }}
                    onPressYes={() => {
                      this._changeContent(() => {
                        this.setState({userInputResetCrownstoneNow: true});
                        this._factoryResetMyLostCrownstone(nearest.handle)
                      })
                    }}
                  />
                );
              }
              else {
                return (
                  <DiagSingleButtonGoBack
                    visible={this.state.visible}
                    header={"TThe nearest Crownstone belongs to your Sphere but it has been removed from your database.\n\nIt's " + noun + " close by."}
                    explanation={
                      "This can happen when someone removed this Crownstone from your Sphere, but they did not factory reset it.\n\n" +
                      "You will have to ask an admin to reset it for you."
                    }
                  />
                );
              }
            }
            else {
              return (
                <DiagSingleButtonHelp
                  visible={this.state.visible}
                  header={"The nearest Crownstone is not registered to your Sphere, and it's " + noun + " close!"}
                  explanation={"If you're sure it's one of your Crownstones, you can try to factory reset it!\n\n" +
                  "Tap the button below to go to help and tap on 'I need to factory reset a Crownstone'."}
                />
              );
            }
          }
          else {
            // nearest Crownstone is not missing
            let name = nameFromSummary(nearSummary);
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={"The nearest Crownstone I can detect is " + name + " and it's " + noun + " close!"}
                explanation={"If this is not the one you were looking for, then take the power off it for a while and restart the diagnostic.\n\n" +
                "If this keeps happening, contact us at team@crownstone.rocks and we'll do our best to help!"
                }
              />
            );
          }
        }
        else {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={"Something went wrong..."}
              explanation={"Please restart the diagnostic and try again."}
            />
          );
        }
      }
    }
  }

  render() {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        {this._getHeader()}
        {this._getTests()}
        {this._getOtherCrownstone()}
      </View>
    );
  }

}