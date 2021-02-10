
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ProblemWithOtherCrownstone", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';
import {
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
import { diagnosticStyles } from "./DiagnosticStyles";
import { core } from "../../../core";


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
    let referenceId = Util.data.getReferenceId(core.store.getState());
    let proxy = BleUtil.getProxy(handle, referenceId);
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
    return <Text style={diagnosticStyles.headerStyle}>{ lang("Problem_with_missing_Crow") }</Text>
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
          <TestResult label={ lang("Database_is_healthy")}          state={ true } />
          <TestResult label={ lang("Scanning_is_enabled")}          state={ true } />
          <TestResult label={ lang("Receiving_Sphere_beacons")}     state={ true } />
          <TestResult label={ lang("Receiving_Crownstone_data")}    state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.otherTestsVisible} height={180}>
          <TestResult label={ lang("Scanning_for_nearby_Crown")} state={ this.state.canSeeNearbyCrownstones } />
        </SlideFadeInView>
      </View>
    )
  }

  _getOtherCrownstone() {
    if (this.state.userInputNearby === null) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={lang("It_can_sometimes_happen_t")}
          explanation={ lang("If_you_think_this_is_the_")}
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
      return <DiagWaiting visible={this.state.visible} header={ lang("Checking_for_nearby_Crown")}/>
    }
    else if (this.state.canSeeNearbyCrownstones === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("I_cant_detect_any_Crownst")}
          explanation={lang("If_this_keeps_happening__")}
        />
      );
    }
    else {
      // there is a local crownstone near
      if (this.state.factoryResetSuccess === true) {
        return (
          <DiagSingleButtonToOverview
            visible={this.state.visible}
            header={ lang("Crownstone_successfully_r")}
            explanation={ lang("It_will_be_in_setup_mode_")}
          />
        );
      }
      else if (this.state.factoryResetSuccess === false) {
        return (
          <DiagSingleButtonHelp
            visible={this.state.visible}
            header={ lang("Failed_to_reset_Crownston")}
            explanation={lang("Something_went_wrong_duri")}
          />
        );
      }
      else if (this.state.userInputResetCrownstoneNow === true) {
        return <DiagWaiting visible={this.state.visible} header={ lang("Factory_resetting_your_lo")}/>;
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

        if (nearest && nearest.rssi) {
          let noun = null;
          if (nearest.rssi > -55) {
            noun =  lang("very");
          }
          else if (nearest.rssi > -65) {
            noun =  lang("pretty")}
          else if (nearest.rssi > -75) {
            noun =  lang("somewhat")}
          else if (nearest.rssi > -85) {
            noun =  lang("not_that")}
          let state = core.store.getState();
          let sphereId = Util.data.getPresentSphereId(state);
          let nearSummary = MapProvider.stoneHandleMap[nearest.handle];
          if (nearest.setupMode) {
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={lang("The_nearest_Crownstone_is_")}
                explanation={ lang("You_can_add_it_to_your_sp")}
              />
            );
          }
          // else if (nearest.dfuMode) {
          //
          // }
          else if (!nearSummary) {
            if (nearest.verified === true) {
              if (Permissions.inSphere(sphereId).removeCrownstone) {
                return (
                  <DiagYesNo
                    visible={this.state.visible}
                    header={lang("The_nearest_Crownstone_be",noun)}
                    explanation={ lang("This_can_happen_when_some")}
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
                    header={lang("The_nearest_Crownstone_be",noun)}
                    explanation={ lang("This_can_happen_when_some_noAdm")}
                  />
                );
              }
            }
            else {
              return (
                <DiagSingleButtonHelp
                  visible={this.state.visible}
                  header={lang("The_nearest_Crownstone_is",noun)}
                  explanation={lang("If_youre_sure_its_one_of_")}
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
                header={lang("The_nearest_Crownstone_I_",name, noun)}
                explanation={lang("If_this_is_not_the_one_yo")
                }
              />
            );
          }
        }
        else {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={ lang("Something_went_wrong___")}
              explanation={ lang("Please_restart_the_diagno")}
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