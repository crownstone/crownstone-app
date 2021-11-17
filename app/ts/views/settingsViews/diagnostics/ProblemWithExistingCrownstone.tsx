
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ProblemWithExistingCrownstone", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Text,
  View
} from 'react-native';
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {
  DiagOptions,
  DiagSingleBleTroubleshooter,
  DiagSingleButton,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonToOverview,
  DiagYesNo,
  TestResult,
  nameFromSummary,
  DiagWaiting, DiagListOfStones
} from "./DiagnosticUtil";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {TestRunner} from "./TestRunner";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {Util} from "../../../util/Util";
import {StoneUtil} from "../../../util/StoneUtil";
import {INTENTS} from "../../../native/libInterface/Constants";
import {BleUtil} from "../../../util/BleUtil";
import {BluenetPromiseWrapper} from "../../../native/libInterface/BluenetPromise";
import { diagnosticStyles } from "./DiagnosticStyles";
import { core } from "../../../Core";
import { tell } from "../../../logic/constellation/Tellers";


export class ProblemWithExistingCrownstone extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      existingTestsVisible: false,
      existingMeshTestsVisible: false,
      switchTestVisible: false,

      nearestCheck: [],
      amountOfIBeacons: 0,
      canSeeCrownstoneNotInSphere:  null,
      canSeeCrownstoneAddress:      null,
      canSeeCrownstoneBeacon:       null,
      canSeeCrownstoneDirectly:     null,
      canSeeCrownstoneDirectlyData: null,
      canSeeCrownstoneRssi:         null,
      canSeeCrownstoneViaMesh:      null,
      canSeeThisCrownstoneMesh:     null,
      existingTestsFinished :       false,

      problemStoneSummary:       null,
      crownstoneProblemType:     null,
      weirdType:                 null,
      cameFromOtherProblem:      false,
      switchedCrownstone:        null,
      switchedCrownstoneNotNear: null,
      switchSuccessful:          null,
      switchSuccessfulVerified:  null,
      factoryResetSuccess:       null,

      userInputProblemCrownstoneId:    null,
      userInputProblemsWithCrownstone: null,
      userInputOnlyThisCrownstone:     null,
      userInputProblems:               null,
      userInputExistingCrownstone:     null,
      userInputPhoneIsClose:           null,
      userInputCycledPower:            null,
      userInputResetCrownstoneNow:     null,

      userInputAllowedToSwitch:        null,
    };
    setTimeout(() => { this.setState({visible: true}) }, 10);
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe(); })
  }

  _changeContent(changeAction) {
    this.setState({visible: false});
    setTimeout(() => {
      changeAction(); this.setState({visible: true});
    }, 400)
  }

  _runExistingCrownstoneTests(mesh = false) {
    if (mesh) {
      this.setState({existingMeshTestsVisible: true});
    }
    else {
      this.setState({existingTestsVisible: true});
    }

    let state = core.store.getState();
    let sphereId = Util.data.getPresentSphereId();
    let sphere = state.spheres[sphereId];
    let stoneId = this.state.problemStoneSummary.id;
    TestRunner.prepare();
    TestRunner.addIBeaconTest();
    TestRunner.addSearchForCrownstone(sphere, stoneId);
    TestRunner.addNearestCheck();
    TestRunner.run()
      .then((result) => {
        let rssi = null;
        if (TestRunner.getSearchResultForAdvertisment(stoneId, result)) {
          rssi = TestRunner.getSearchRssiForAdvertisment(stoneId, result)
        }
        else if (TestRunner.getSearchResultForUnVerified(stoneId, result)) {
          rssi = TestRunner.getSearchRssiForUnVerified(stoneId, result)
        }

        this.setState({
          canSeeCrownstoneRssi: rssi,
          canSeeCrownstoneBeacon: TestRunner.getSearchResultForIbeacon(stoneId, result),
          nearestCheck: TestRunner.getNearestScans(result),
          amountOfIBeacons: TestRunner.getIBeaconData(result).length
        });

        setTimeout(() => { this.setState({
          canSeeCrownstoneDirectly:     TestRunner.getSearchResultForAdvertisment(    stoneId, result),
          canSeeCrownstoneDirectlyData: TestRunner.getSearchResultForAdvertismentData(stoneId, result),
        }) }, 200);
        setTimeout(() => { this.setState({
          canSeeCrownstoneViaMesh:   TestRunner.getSearchResultForViaMesh(stoneId, result),
          canSeeThisCrownstoneMesh:  TestRunner.getSearchResultForMeshing(stoneId, result),
        }) }, 400);
        setTimeout(() => { this.setState({
          existingTestsFinished: true,
          canSeeCrownstoneAddress: (TestRunner.getSearchResultForUnVerified(stoneId, result) || TestRunner.getSearchResultForAdvertisment(stoneId, result))
        }) }, 600)
      })
      .catch((err) => { console.error(err); })
  }


  _getHeader() {
    return <Text style={diagnosticStyles.headerStyle}>{ lang("Problem_with_existing_Cro") }</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={!this.state.existingTestsVisible && !this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={180}>
          <TestResult label={ lang("Database_is_healthy")}       state={ true } />
          <TestResult label={ lang("Scanning_is_enabled")}       state={ true } />
          <TestResult label={ lang("Receiving_Sphere_beacons")}  state={ true } />
          <TestResult label={ lang("Receiving_Crownstone_data")} state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.existingTestsVisible && !this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={180}>
          <TestResult label={ lang("Looking_for_beacon")}    state={ this.state.canSeeCrownstoneBeacon   } />
          <TestResult label={ lang("Looking_for_data")}      state={ this.state.canSeeCrownstoneDirectly } />
          <TestResult label={ lang("Looking_for_mesh")}      state={ this.state.canSeeCrownstoneViaMesh || this.state.canSeeThisCrownstoneMesh } />
          <TestResult label={ lang("Looking_for_address")}   state={ this.state.canSeeCrownstoneAddress  } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={45}>
          <TestResult label={ lang("Checking_mesh")}  state={ this.state.canSeeCrownstoneViaMesh || this.state.canSeeThisCrownstoneMesh } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.switchTestVisible} height={45}>
          <TestResult label={ lang("Switching_Crownstone")}  state={ this.state.switchedCrownstone } />
        </SlideFadeInView>
      </View>
    )
  }

  _factoryResetMyLostCrownstone(handle) {
    let referenceId = Util.data.getReferenceId(core.store.getState());
    tell(handle).commandFactoryReset()
      .then(() => { this.setState({factoryResetSuccess: true}); })
      .catch(() => { this.setState({factoryResetSuccess: false}); })
  }


  _handleNotInRange() {
    let helpPlace =  lang("Settings");
    if (Platform.OS === 'android') {
      helpPlace =  lang("Sidebar_");
    }

    // not in range
    if (this.state.canSeeCrownstoneAddress === true) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={lang("I_can_hear_a_Crownstone_w")}
          explanation={lang("You_can_try_to_factory_re")}
        />
      );
    }
    else if (this.state.userInputPhoneIsClose === null) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={ lang("I_cant_hear_this_Crowns_atAll")}
          explanation={ lang("Are_you_close_to_it_")}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputPhoneIsClose: false}); }); }}
          onPressYes={() => {this._changeContent(() => { this.setState({userInputPhoneIsClose: true }); }); }}
        />
      )
    }
    else if (this.state.userInputPhoneIsClose === false) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={ lang("It_could_just_be_out_of_r")}
          explanation={ lang("Press_the_button_to_conti")}
          label={ lang("Im_near_now_")}
          onPress={() => { this._changeContent(() => { this.setState({
            canSeeCrownstoneNotInSphere: null,
            canSeeCrownstoneAddress: null,
            canSeeCrownstoneBeacon: null,
            canSeeCrownstoneDirectly: null,
            canSeeCrownstoneRssi: null,
            canSeeCrownstoneViaMesh : null,
            canSeeThisCrownstoneMesh : null,
            existingTestsFinished : false,
            userInputPhoneIsClose: true
          });
            this._runExistingCrownstoneTests();
          }); }}
        />
      );
    }
    else if (this.state.userInputResetCrownstoneNow === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ lang("OK__we_can_do_it_later_")}
          explanation={lang("Run_the_diagnostic_again_",helpPlace)}
        />
      );
    }
    else if (this.state.factoryResetSuccess === true) {
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
          explanation={ lang("Something_went_wrong_duri")}
        />
      );
    }
    else if (this.state.userInputResetCrownstoneNow === true) {
      return <DiagWaiting visible={this.state.visible} header={ lang("Factory_resetting_your_lo")}/>;
    }
    else if (this.state.userInputCycledPower === null) {
      let nearCrownstones = this.state.nearestCheck;
      let maxRssi = -1000;
      let nearest = null;
      nearCrownstones.forEach((near : nearestStone) => {
        if (maxRssi < near.rssi) {
          nearest = near;
          maxRssi = near.rssi;
        }
      });

      let header =  lang("I_cant_hear_this_Crownsto");
      let explanation =  lang("Try_disconnecting_its_pow");

      if (nearest) {
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

        let nearSummary = MapProvider.stoneHandleMap[nearest.handle];
        if (!nearSummary) {
          if (nearest.verified === true) {
            if (Permissions.inSphere(this.state.problemStoneSummary.sphereId).removeCrownstone) {
              return (
                <DiagYesNo
                  visible={this.state.visible}
                  header={lang("The_nearest_Crownstone_be",noun)}
                  explanation={ lang("This_can_happen_when_some")}
                  onPressNo={ () => { this._changeContent(() => { this.setState({userInputResetCrownstoneNow: false }); }) }}
                  onPressYes={() => { this._changeContent(() => { this.setState({userInputResetCrownstoneNow: true  }); this._factoryResetMyLostCrownstone(nearest.handle) }) }}
                />
              );
            }
            else {
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={lang("The_nearest_Crownstone_be",noun)}
                  explanation={ lang("This_can_happen_when_some_noAdm") }
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
          if (nearSummary.id !== this.state.userInputProblemCrownstoneId) {
            // nearest Crownstone is not the selected one.
            let name = nameFromSummary(nearSummary);
            if (noun) {
              header =  lang("The_nearest_Crownstone_I_",name,noun);
              explanation =  lang("If_youre_sure_youre_near_")}
          }

          // phone is close
          return (
            <DiagSingleButton
              visible={this.state.visible}
              header={header}
              explanation={explanation}
              label={ lang("OK__done_")}
              onPress={() => { this._changeContent(() => { this.setState({
                canSeeCrownstoneNotInSphere: null,
                canSeeCrownstoneAddress: null,
                canSeeCrownstoneBeacon: null,
                canSeeCrownstoneDirectly: null,
                canSeeCrownstoneRssi: null,
                canSeeCrownstoneViaMesh : null,
                canSeeThisCrownstoneMesh : null,
                existingTestsFinished : false,
                userInputCycledPower: true,
                userInputPhoneIsClose: true
              });
                this._runExistingCrownstoneTests();
              }); }}
            />
          );
        }


      }
      else {
        return (
          <DiagSingleButton
            visible={this.state.visible}
            header={lang("I_cant_hear_this_Crowns_atAll")}
            explanation={lang("Try_disconnecting_its_pow")}
            label={ lang("Power_has_been_cycled_")}
            onPress={() => { this._changeContent(() => { this.setState({
              canSeeCrownstoneNotInSphere: null,
              canSeeCrownstoneAddress: null,
              canSeeCrownstoneBeacon: null,
              canSeeCrownstoneDirectly: null,
              canSeeCrownstoneRssi: null,
              canSeeCrownstoneViaMesh : null,
              canSeeThisCrownstoneMesh : null,
              existingTestsFinished : false,
              userInputCycledPower: true,
              userInputPhoneIsClose: true
            });
              this._runExistingCrownstoneTests();
            }); }}
          />
        );
      }
    }
    else {
      // phone is close
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("I_still_cant_hear_this_Cr")}
          explanation={ lang("Contact_us_at_team_crowns")}
        />
      );
    }
  }

  _handleSearching() {
    if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      return this._handleNotInRange();
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === false && this.state.canSeeThisCrownstoneMesh === true) {
      // good but not in mesh

      let explanation = null;
      if (this.state.amountOfIBeacons <= 1) {
        explanation =  lang("I_didnt_hear_it_via_the_m")
      }
      else {
        explanation =  lang("I_didnt_hear_it_via_the_me")
      }

      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("I_can_hear_the_directly")}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === false) {
      // good but not in mesh

      let explanation = null;
      if (this.state.amountOfIBeacons <= 1) {
        explanation =  lang("I_didnt_hear_it_via_the_mesh");
      }
      else {
        explanation =  lang("I_didnt_hear_it_via_the_mesh_");
      }

      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("I_can_hear_the_directly")}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === true) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("I_can_hear_the_Crown_mesh")}
          explanation={lang("Since_I_cant_hear_this_Cr")}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === true) {
      // Crownstone is not beaconing
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ lang("I_can_hear_the_Crownstone")}
          explanation={lang("You_can_try_to_take_the_p")}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === true) {
      // everything is perfect
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ lang("I_can_see_this_Crownstone")}
          explanation={lang("It_is_not_on_Searching___")}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      // crownstone has no data (resetting?)
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("I_can_hear_this_Crownston2")}
          explanation={lang("You_can_try_to_take_the_p")}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      // crownstone has no data (resetting?)
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={lang("I_can_hear_this_Crownston2")}
          explanation={lang("You_can_try_to_take_the_p")}
        />
      );
    }
  }

  _handleOnlySwitchesWhenNear() {
    return (
      <DiagSingleButtonGoBack
        visible={this.state.visible}
        header={lang("Youre_probably_out_of_ran")}
        explanation={lang("A_Crownstone_does_not_swi")}
      />
    );
  }

  async _tryToSwitchCrownstone() {
    let sphereId = this.state.problemStoneSummary.sphereId;
    let stoneId = this.state.problemStoneSummary.id;
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    let stone = sphere.stones[stoneId];

    try {
      await StoneUtil.multiSwitch(stone, stone.state.state > 0 ? 0 : 1, false);
      this.setState({switchedCrownstone: true});
    }
    catch (err) {
      if (err?.code === "NO_STONES_FOUND") {
        this.setState({switchedCrownstone: false, switchedCrownstoneNotNear: true});
      }
      else {
        this.setState({switchedCrownstone: false});
      }
    }
  }


  /**
   *
   * // ask if can switch

   // try switch

   // get errors if any

   // if errors: go to ble trouble shooter

   // else: scan if crownstone thinks it switched

   // if thinks switch: ask user if switched

   //                   user disagrees, ask if test with light

   //                                   user still disagrees --> Borked Crownstone

   //                                   else success!

   // if still thinks not switch and command successful --> Borked Crownstone
   * @private
   */
  _handleNeverSwitches() {
    if (this.state.canSeeCrownstoneDirectly === true) {
      let adv : crownstoneAdvertisement = this.state.canSeeCrownstoneDirectlyData;
      // check for hardware errors
      if (!adv.serviceData) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ lang("Something_went_wrong_")}
            explanation={ lang("Please_restart_the_diagno")}
          />
        );
      }
      let currentState = adv.serviceData.switchState;

      if (adv.serviceData.hasError === true) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ lang("This_Crownstone_seems_to_")}
            explanation={lang("This_does_not_mean_your_d")}
          />
        );
      }

      // check if locked
      if (adv.serviceData.switchLocked === true) {
        if (Permissions.inSphere(this.state.problemStoneSummary.sphereId).canUnlockCrownstone) {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={ lang("Someone_has_locked_this_C")}
              explanation={ lang("A_Crownstone_can_be_locke")}
            />
          );
        }
        else {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={ lang("Someone_has_locked_this_Cr")}
              explanation={lang("A_Crownstone_can_be_locke_noAdm")}
            />
          );
        }
      }

      if (this.state.userInputAllowedToSwitch === null) {
        return (
          <DiagYesNo
            visible={this.state.visible}
            header={ lang("Let_me_try_to_switch_this")}
            explanation={ lang("Is_that_OK__Its_currently",currentState > 0)}
            onPressNo={() => { this._changeContent(() => { this.setState({userInputAllowedToSwitch: false}); }); }}
            onPressYes={() => {this._changeContent(() => { this._tryToSwitchCrownstone(); this.setState({userInputAllowedToSwitch: true, switchTestVisible:true }); }); }}
          />
        );
      }
      else if (this.state.userInputAllowedToSwitch === false) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ lang("No_problem__maybe_next_ti")}
            explanation={lang("Rerun_the_diagnostic_once")}
          />
        );
      }
      else if (this.state.userInputAllowedToSwitch === true) {
        if (this.state.switchedCrownstone === null) {
          // switching...
          let name = nameFromSummary(this.state.problemStoneSummary);
          return <DiagWaiting visible={this.state.visible} header={lang("Trying_to_switch____",name)}/>;
        }
        else if (this.state.switchedCrownstone === false) {
          if (this.state.userInputOnlyThisCrownstone === null) {
            if (this.state.switchedCrownstoneNotNear === true) {
              // is it only this one?
              return (
                <DiagSingleButton
                  visible={this.state.visible}
                  header={lang("I_couldnt_hear_any_messag")}
                  explanation={lang("Could_you_try_moving_a_li")}
                  label={ lang("OK")}
                  onPress={() => {this._changeContent(() => { this._tryToSwitchCrownstone(); this.setState({ switchedCrownstone: null, userInputOnlyThisCrownstone: null, switchedCrownstoneNotNear: null }); }); }}
                />
              );
            }
            else {
              // is it only this one?
              return (
                <DiagYesNo
                  visible={this.state.visible}
                  header={ lang("I_see____It_failed_to_swi")}
                  explanation={ lang("It_could_be_this_Crownsto")}
                  onPressNo={() => { this._changeContent(() => { this.setState({ userInputOnlyThisCrownstone: false}); }); }}
                  onPressYes={() => {this._changeContent(() => { this.setState({ userInputOnlyThisCrownstone: true }); }); }}
                />
              );
            }
          }
          else if (this.state.userInputOnlyThisCrownstone === false) {
            // ble troubleshooter
            return <DiagSingleBleTroubleshooter visible={this.state.visible} header={lang("In_that_case__its_probabl")}/>
          }
          else if (this.state.userInputOnlyThisCrownstone === true) {
            // power on / off
            return (
              <DiagSingleButton
                visible={this.state.visible}
                header={ lang("Could_you_try_restarting_")}
                explanation={lang("Try_disconnecting_its_pow")}
                label={ lang("OK__done_")}
                onPress={() => {this._changeContent(() => { this._tryToSwitchCrownstone(); this.setState({ switchedCrownstone: null, userInputOnlyThisCrownstone: null, switchedCrownstoneNotNear: null }); }) }}
              />
            );
          }
        }
        else if (this.state.switchedCrownstone === true) {
          if (this.state.switchSuccessful === null) {
            return (
              <DiagYesNo
                visible={this.state.visible}
                header={ lang("It_looks_like_I_can_switc")}
                explanation={ lang("Did_it_switch_successfull")}
                onPressNo={() => { this._changeContent(() => { this.setState({switchSuccessful: false}); }); }}
                onPressYes={() => {this._changeContent(() => { this.setState({switchSuccessful: true }); }); }}
              />
            );
          }
          else if (this.state.switchSuccessful === false) {
            if (this.state.switchSuccessfulVerified === null) {
              return (
                <DiagYesNo
                  visible={this.state.visible}
                  header={ lang("It_could_be_that_the_conn")}
                  explanation={ lang("If_you_try_it_with_a_simp")}
                  onPressNo={() => { this._changeContent(() => { this.setState({switchSuccessfulVerified: false}); }); }}
                  onPressYes={() => {this._changeContent(() => { this.setState({switchSuccessfulVerified: true }); }); }}
                />
              );
            }
            else if (this.state.switchSuccessfulVerified === true) {
              // works perfectly!
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={ lang("Glad_it_works_now_")}
                  explanation={lang("If_theres_anything_else__")}
                />
              );
            }
            else {
              // borked
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={ lang("In_that_case__this_Crowns")}
                  explanation={ lang("Contact_us_at_team_crownst")}
                />
              );
            }
          }
          else { // success!
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={ lang("Glad_it_works_")}
                explanation={lang("If_theres_anything_else__")}
              />
            );
          }
        }
      }
    }
    else if (this.state.canSeeCrownstoneDirectly === false && this.state.userInputPhoneIsClose === null) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={lang("I_cant_hear_this_Crownsto2")}
          explanation={ lang("Are_you_close_to_it_")}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputPhoneIsClose: false}); }); }}
          onPressYes={() => {this._changeContent(() => { this.setState({userInputPhoneIsClose: true }); }); }}
        />
      )
    }
    else if (this.state.canSeeCrownstoneDirectly === false && this.state.userInputPhoneIsClose === false) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={ lang("It_could_just_be_out_of_ra")}
          explanation={ lang("Press_the_button_to_contin")}
          label={"I'm near now!"}
          onPress={() => { this._changeContent(() => { this.setState({
            canSeeCrownstoneNotInSphere: null,
            canSeeCrownstoneAddress: null,
            canSeeCrownstoneBeacon: null,
            canSeeCrownstoneDirectly: null,
            canSeeCrownstoneRssi: null,
            canSeeCrownstoneViaMesh : null,
            canSeeThisCrownstoneMesh : null,
            existingTestsFinished : false,
            userInputPhoneIsClose: true
          });
            this._runExistingCrownstoneTests();
          }); }}
        />
      );
    }
    else if (this.state.canSeeCrownstoneDirectly === false && this.state.userInputPhoneIsClose === true) {
      return this._handleNotInRange();
    }
  }

  _getSwitchCraftExplanation(state) {
    if (Permissions.inSphere(this.state.problemStoneSummary.sphereId).editCrownstone) {
      return  lang("The_option_for_Switchcraf");
    }
    else {
      return lang("You_can_ask_an_Admin_to_d");
    }
  }

  _getResults() {
    let state = core.store.getState();
    if (this.state.userInputProblemCrownstoneId === null) {
      let sphereId = Util.data.getPresentSphereId();
      let stones = state.spheres[sphereId].stones;
      return (
        <DiagListOfStones
          visible={this.state.visible}
          stones={stones}
          callback={(summary) => {
            this._changeContent(() => {
              this.setState({problemStoneSummary: summary, userInputProblemCrownstoneId: summary.id  });
            });
          }}
        />
      );
    }
    else if (this.state.userInputProblemCrownstoneId !== null && this.state.crownstoneProblemType === null) {
      let name = nameFromSummary(this.state.problemStoneSummary);
      return (
        <DiagOptions
          visible={this.state.visible}
          header={lang("Whats_wrong_with__",name)}
          subExplanation={ lang("Scroll_down_to_see_all_op")}
          labels={[
            lang("The_app_says_Searching___"),
            lang("I_cant_get_it_to_switch_"),
            // lang("It_is_not_in_the_mesh_"),
            lang("It_only_switches_when_Im_"),
            lang("Its_behaviour_is_weird_"),
            lang("Other___")
          ]}
          pressHandlers={[
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'searching'      }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'never_switches' }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'only_switches_when_near' }); }); },
            () => { this._changeContent(() => { this.setState({ existingTestsFinished: true, crownstoneProblemType: 'behaviour_is_weird' }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'other' }); }); },
          ]}
        />
      );
    }
    else if (this.state.existingTestsFinished === false) {
      let name = nameFromSummary(this.state.problemStoneSummary);
      return <DiagWaiting visible={this.state.visible} header={lang("Checking_on____",name)}/>;
    }
    else if (this.state.crownstoneProblemType === 'searching') {
      return this._handleSearching();
    }
    else if (this.state.crownstoneProblemType === 'never_switches') {
      return this._handleNeverSwitches();
    }
    else if (this.state.crownstoneProblemType === 'only_switches_when_near') {
      return this._handleOnlySwitchesWhenNear();
    }
    else if (this.state.crownstoneProblemType === 'behaviour_is_weird' && this.state.weirdType === null) {
      // check for switchCraft
      return (
        <DiagOptions
          visible={this.state.visible}
          header={ lang("Weird_how_")}
          labels={[
            lang("I_think_it_should_react_d"),
            lang("It_switches_unexpectedly_"),
            lang("It_does_not_work_if_the_a"),
            lang("Other___")
          ]}
          pressHandlers={[
            () => { this._changeContent(() => { this.setState({ weirdType: 'unexpected_behaviour'      }); }); },
            () => { this._changeContent(() => { this.setState({ crownstoneProblemType: 'unexpected_switches' }); }); },
            () => { this._changeContent(() => { this.setState({ weirdType: 'not_in_background'    }); }); },
            () => { this._changeContent(() => { this.setState({ crownstoneProblemType: 'other'    }); }); },
          ]}
        />
      );
    }
    else if (this.state.crownstoneProblemType === 'behaviour_is_weird' && this.state.weirdType === 'unexpected_behaviour') {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={lang("Its_very_possible_that_so")}
          explanation={ lang("You_can_take_a_look_at_th")}
        />
      );
    }
    else if (this.state.crownstoneProblemType === 'behaviour_is_weird' && this.state.weirdType === 'not_in_background') {
      return (
        <DiagSingleBleTroubleshooter
          visible={this.state.visible}
          header={lang("Sometimes_the_background_")}
          explanation={ lang("This_differs_from_phone_t")}
        />
      );
    }
    else if (this.state.crownstoneProblemType === 'other') {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={ lang("Perhaps_the_Help_menu_can")}
          explanation={lang("Alternatively_you_can_sen")}
        />
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
