import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  TouchableHighlight,
  View
} from 'react-native';
import {diagnosticStyles} from "../SettingsDiagnostics";
import {colors, screenWidth} from "../../styles";
import {FadeInView} from "../../components/animated/FadeInView";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {
  DiagOptions,
  DiagSingleBleTroubleshooter,
  DiagSingleButton,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonQuit,
  DiagSingleButtonToOverview,
  DiagYesNo,
  TestResult,
  nameFromSummary,
  DiagSingleButtonMeshTopology,
  DiagWaiting, DiagListOfStones
} from "./DiagnosticUtil";
import {SlideInView} from "../../components/animated/SlideInView";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {TestRunner} from "./TestRunner";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {Util} from "../../../util/Util";
import {StoneUtil} from "../../../util/StoneUtil";
import {INTENTS} from "../../../native/libInterface/Constants";
import {BlePromiseManager} from "../../../logic/BlePromiseManager";
import {BleUtil} from "../../../util/BleUtil";
import {BluenetPromiseWrapper} from "../../../native/libInterface/BluenetPromise";


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

    let state = this.props.store.getState();
    let sphereId = Util.data.getPresentSphereId(state);
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
    return <Text style={diagnosticStyles.headerStyle}>{ Languages.text("ProblemWithExistingCrownstone", "Problem_with_existing_Cro")() }</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={!this.state.existingTestsVisible && !this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={180}>
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Database_is_healthy")()}       state={ true } />
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Scanning_is_enabled")()}       state={ true } />
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Receiving_Sphere_beacons")()}  state={ true } />
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Receiving_Crownstone_data")()} state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.existingTestsVisible && !this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={180}>
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Looking_for_beacon")()}    state={ this.state.canSeeCrownstoneBeacon   } />
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Looking_for_data")()}      state={ this.state.canSeeCrownstoneDirectly } />
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Looking_for_mesh")()}      state={ this.state.canSeeCrownstoneViaMesh || this.state.canSeeThisCrownstoneMesh } />
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Looking_for_address")()}   state={ this.state.canSeeCrownstoneAddress  } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={45}>
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Checking_mesh")()}  state={ this.state.canSeeCrownstoneViaMesh || this.state.canSeeThisCrownstoneMesh } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.switchTestVisible} height={45}>
          <TestResult label={ Languages.label("ProblemWithExistingCrownstone", "Switching_Crownstone")()}  state={ this.state.switchedCrownstone } />
        </SlideFadeInView>
      </View>
    )
  }

  _factoryResetMyLostCrownstone(handle) {
    let proxy = BleUtil.getProxy(handle);
    return proxy.performPriority(BluenetPromiseWrapper.commandFactoryReset)
      .then(() => { this.setState({factoryResetSuccess: true}); })
      .catch(() => { this.setState({factoryResetSuccess: false}); })
  }


  _handleNotInRange() {
    let helpPlace =  Languages.label("ProblemWithExistingCrownstone", "Settings")();
    if (Platform.OS === 'android') {
      helpPlace =  Languages.label("ProblemWithExistingCrownstone", "Sidebar_")();
    }

    // not in range
    if (this.state.canSeeCrownstoneAddress === true) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","I_can_hear_a_Crownstone_w")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","You_can_try_to_factory_re")()}
        />
      );
    }
    else if (this.state.userInputPhoneIsClose === null) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "I_cant_hear_this_Crowns_atAll")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "Are_you_close_to_it_")()}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputPhoneIsClose: false}); }); }}
          onPressYes={() => {this._changeContent(() => { this.setState({userInputPhoneIsClose: true }); }); }}
        />
      )
    }
    else if (this.state.userInputPhoneIsClose === false) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "It_could_just_be_out_of_r")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "Press_the_button_to_conti")()}
          label={ Languages.label("ProblemWithExistingCrownstone","Im_near_now_")()}
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
          header={ Languages.label("ProblemWithExistingCrownstone", "OK__we_can_do_it_later_")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","Run_the_diagnostic_again_")(helpPlace)}
        />
      );
    }
    else if (this.state.factoryResetSuccess === true) {
      return (
        <DiagSingleButtonToOverview
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "Crownstone_successfully_r")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "It_will_be_in_setup_mode_")()}
        />
      );
    }
    else if (this.state.factoryResetSuccess === false) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "Failed_to_reset_Crownston")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone","Something_went_wrong_duri")()}
        />
      );
    }
    else if (this.state.userInputResetCrownstoneNow === true) {
      return <DiagWaiting visible={this.state.visible} header={ Languages.label("ProblemWithExistingCrownstone", "Factory_resetting_your_lo")()}/>;
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

      let header =  Languages.label("ProblemWithExistingCrownstone", "I_cant_hear_this_Crownsto")();
      let explanation =  Languages.label("ProblemWithExistingCrownstone", "Try_disconnecting_its_pow")();

      if (nearest) {
        let noun = null;
        if (nearest.rssi > -55) {
          noun =  Languages.label("ProblemWithExistingCrownstone", "very")();
        }
        else if (nearest.rssi > -65) {
          noun =  Languages.label("ProblemWithExistingCrownstone", "pretty")()}
        else if (nearest.rssi > -75) {
          noun =  Languages.label("ProblemWithExistingCrownstone", "somewhat")()}
        else if (nearest.rssi > -85) {
          noun =  Languages.label("ProblemWithExistingCrownstone", "not_that")()}

        let nearSummary = MapProvider.stoneHandleMap[nearest.handle];
        if (!nearSummary) {
          if (nearest.verified === true) {
            if (Permissions.inSphere(this.state.problemStoneSummary.sphereId).removeCrownstone) {
              return (
                <DiagYesNo
                  visible={this.state.visible}
                  header={Languages.label("ProblemWithExistingCrownstone","The_nearest_Crownstone_be")(noun)}
                  explanation={ Languages.label("ProblemWithExistingCrownstone", "This_can_happen_when_some")()}
                  onPressNo={ () => { this._changeContent(() => { this.setState({userInputResetCrownstoneNow: false }); }) }}
                  onPressYes={() => { this._changeContent(() => { this.setState({userInputResetCrownstoneNow: true  }); this._factoryResetMyLostCrownstone(nearest.handle) }) }}
                />
              );
            }
            else {
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={Languages.label("ProblemWithExistingCrownstone","The_nearest_Crownstone_be")(noun)}
                  explanation={ Languages.label("ProblemWithExistingCrownstone","This_can_happen_when_some_noAdm")() }
                />
              );
            }
          }
          else {
            return (
              <DiagSingleButtonHelp
                visible={this.state.visible}
                header={Languages.label("ProblemWithExistingCrownstone","The_nearest_Crownstone_is")(noun)}
                explanation={Languages.label("ProblemWithExistingCrownstone","If_youre_sure_its_one_of_")()}
              />
            );
          }
        }
        else {
          if (nearSummary.id !== this.state.userInputProblemCrownstoneId) {
            // nearest Crownstone is not the selected one.
            let name = nameFromSummary(nearSummary);
            if (noun) {
              header =  Languages.label("ProblemWithExistingCrownstone", "The_nearest_Crownstone_I_")(name,noun);
              explanation =  Languages.label("ProblemWithExistingCrownstone", "If_youre_sure_youre_near_")()}
          }

          // phone is close
          return (
            <DiagSingleButton
              visible={this.state.visible}
              header={header}
              explanation={explanation}
              label={ Languages.label("ProblemWithExistingCrownstone", "OK__done_")()}
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
            header={Languages.label("ProblemWithExistingCrownstone","I_cant_hear_this_Crowns_atAll")()}
            explanation={Languages.label("ProblemWithExistingCrownstone","Try_disconnecting_its_pow")()}
            label={ Languages.label("ProblemWithExistingCrownstone", "Power_has_been_cycled_")()}
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
          header={Languages.label("ProblemWithExistingCrownstone","I_still_cant_hear_this_Cr")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "Contact_us_at_team_crowns")()}
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
      let inMesh = this.state.problemStoneSummary.stoneConfig.meshNetworkId !== null;

      let explanation = null;
      if (inMesh === true) {
        explanation =  Languages.label("ProblemWithExistingCrownstone", "I_didnt_hear_it_via_the_o")()}
      else {
        if (this.state.amountOfIBeacons <= 1) {
          explanation =  Languages.label("ProblemWithExistingCrownstone", "I_didnt_hear_it_via_the_m")()}
        else {
          explanation =  Languages.label("ProblemWithExistingCrownstone", "I_didnt_hear_it_via_the_me")()}
      }

      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","I_can_hear_the_directly")()}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === false) {
      // good but not in mesh
      let inMesh = this.state.problemStoneSummary.stoneConfig.meshNetworkId !== null;

      let explanation = null;
      if (inMesh === true) {
        explanation =  Languages.label("ProblemWithExistingCrownstone", "I_didnt_hear_it_via_the_mes")()}
      else {
        if (this.state.amountOfIBeacons <= 1) {
          explanation =  Languages.label("ProblemWithExistingCrownstone", "I_didnt_hear_it_via_the_mesh")()}
        else {
          explanation =  Languages.label("ProblemWithExistingCrownstone", "I_didnt_hear_it_via_the_mesh_")()}
      }

      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","I_can_hear_the_directly")()}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === true) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","I_can_hear_the_Crown_mesh")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","Since_I_cant_hear_this_Cr")()}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === true) {
      // Crownstone is not beaconing
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone","I_can_hear_the_Crownstone")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","You_can_try_to_take_the_p2")()}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === true) {
      // everything is perfect
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "I_can_see_this_Crownstone")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","It_is_not_on_Searching___")()}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      // crownstone has no data (resetting?)
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","I_can_hear_this_Crownston2")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","You_can_try_to_take_the_p")()}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      // crownstone has no data (resetting?)
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","I_can_hear_this_Crownston2")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","You_can_try_to_take_the_p")()}
        />
      );
    }
  }

  _handleNotInMesh() {
    if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      return this._handleNotInRange();
    }
    else if (this.state.canSeeCrownstoneViaMesh === false && this.state.canSeeThisCrownstoneMesh === false) {
      // good but not in mesh
      let inMesh = this.state.problemStoneSummary.stoneConfig.meshNetworkId !== null;

      let explanation = null;
      if (this.state.amountOfIBeacons <= 1) {
        if (inMesh) {
          explanation =  Languages.label("ProblemWithExistingCrownstone", "I_cant_hear_it_via_the_me")();
        }
        else {
          explanation =  Languages.label("ProblemWithExistingCrownstone", "I_cant_hear_it_via_the_mes")();
        }
      }
      else {
        explanation =  Languages.label("ProblemWithExistingCrownstone", "I_cant_hear_it_via_the_mesh")();
      }
      explanation +=  Languages.label("ProblemWithExistingCrownstone", "You_can_try_moving_it_clo")();
      if (Platform.OS === 'android') {
        explanation +=  Languages.label("ProblemWithExistingCrownstone", "Sidebar_")();
      }
      else {
          explanation +=  Languages.label("ProblemWithExistingCrownstone", "Settings_")();
      }

      return (
        <DiagSingleButtonMeshTopology
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "I_see_what_you_mean__")()}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneViaMesh === true) {
      // everything is perfect
      let explanation =  Languages.label("ProblemWithExistingCrownstone", "It_is_in_the_mesh__You_ca")();
      if (Platform.OS === 'android') {
        explanation +=  Languages.label("ProblemWithExistingCrownstone", "Sidebar_")();
      }
      else {
        explanation +=  Languages.label("ProblemWithExistingCrownstone", "Settings_")();
      }
      return (
        <DiagSingleButtonMeshTopology
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "I_can_hear_other_Crownsto")()}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeThisCrownstoneMesh === true) {
      // everything is perfect
      let explanation =  Languages.label("ProblemWithExistingCrownstone", "It_is_in_the_mesh__You_can")();
      if (Platform.OS === 'android') {
        explanation +=  Languages.label("ProblemWithExistingCrownstone", "Sidebar_")();
      }
      else {
        explanation +=  Languages.label("ProblemWithExistingCrownstone", "Settings_")();
      }
      return (
        <DiagSingleButtonMeshTopology
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "I_can_hear_this_Crownston")()}
          explanation={explanation}
        />
      );
    }
  }

  _handleOnlySwitchesWhenNear() {
    let inMesh = this.state.problemStoneSummary.stoneConfig.meshNetworkId !== null;
    if (inMesh) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "This_is_usually_because_t")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","It_can_happen_that_messag")()}
        />
      );
    }
    else {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","Youre_probably_out_of_ran")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","A_Crownstone_does_not_swi")()}
        />
      );
    }
  }

  _tryToSwitchCrownstone() {
    let sphereId = this.state.problemStoneSummary.sphereId;
    let stoneId = this.state.problemStoneSummary.id;
    let state = this.props.store.getState();
    let sphere = state.spheres[sphereId];
    let stone = sphere.stones[stoneId];

    StoneUtil.switchBHC(sphereId, stoneId, stone,stone.state.state > 0 ? 0 : 1, this.props.store,{onlyAllowDirectCommand: true},
      (err) => {
        if (err) {
          if (typeof err === 'object' && err.code === "NO_STONES_FOUND") {
            this.setState({switchedCrownstone: false, switchedCrownstoneNotNear: true});
          }
          else {
            this.setState({switchedCrownstone: false});
          }
        }
        else {
          this.setState({switchedCrownstone: true});
        }
      },
      INTENTS.manual,
      2,
      'from Diagnostics')
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
            header={ Languages.label("ProblemWithExistingCrownstone", "Something_went_wrong_")()}
            explanation={ Languages.label("ProblemWithExistingCrownstone", "Please_restart_the_diagno")()}
          />
        );
      }
      let currentState = adv.serviceData.switchState;

      if (adv.serviceData.hasError === true) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ Languages.label("ProblemWithExistingCrownstone", "This_Crownstone_seems_to_")()}
            explanation={Languages.label("ProblemWithExistingCrownstone","This_does_not_mean_your_d")()}
          />
        );
      }

      // check if locked
      if (adv.serviceData.switchLocked === true) {
        if (Permissions.inSphere(this.state.problemStoneSummary.sphereId).canUnlockCrownstone) {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={ Languages.label("ProblemWithExistingCrownstone", "Someone_has_locked_this_C")()}
              explanation={ Languages.label("ProblemWithExistingCrownstone", "A_Crownstone_can_be_locke")()}
            />
          );
        }
        else {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={ Languages.label("ProblemWithExistingCrownstone", "Someone_has_locked_this_Cr")()}
              explanation={Languages.label("ProblemWithExistingCrownstone","A_Crownstone_can_be_locke_noAdm")()}
            />
          );
        }
      }

      if (this.state.userInputAllowedToSwitch === null) {
        return (
          <DiagYesNo
            visible={this.state.visible}
            header={ Languages.label("ProblemWithExistingCrownstone", "Let_me_try_to_switch_this")()}
            explanation={ Languages.label("ProblemWithExistingCrownstone", "Is_that_OK__Its_currently")(currentState > 0)}
            onPressNo={() => { this._changeContent(() => { this.setState({userInputAllowedToSwitch: false}); }); }}
            onPressYes={() => {this._changeContent(() => { this._tryToSwitchCrownstone(); this.setState({userInputAllowedToSwitch: true, switchTestVisible:true }); }); }}
          />
        );
      }
      else if (this.state.userInputAllowedToSwitch === false) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ Languages.label("ProblemWithExistingCrownstone", "No_problem__maybe_next_ti")()}
            explanation={Languages.label("ProblemWithExistingCrownstone","Rerun_the_diagnostic_once")()}
          />
        );
      }
      else if (this.state.userInputAllowedToSwitch === true) {
        if (this.state.switchedCrownstone === null) {
          // switching...
          let name = nameFromSummary(this.state.problemStoneSummary);
          return <DiagWaiting visible={this.state.visible} header={Languages.label("ProblemWithExistingCrownstone","Trying_to_switch____")(name)}/>;
        }
        else if (this.state.switchedCrownstone === false) {
          if (this.state.userInputOnlyThisCrownstone === null) {
            if (this.state.switchedCrownstoneNotNear === true) {
              // is it only this one?
              return (
                <DiagSingleButton
                  visible={this.state.visible}
                  header={Languages.label("ProblemWithExistingCrownstone","I_couldnt_hear_any_messag")()}
                  explanation={Languages.label("ProblemWithExistingCrownstone","Could_you_try_moving_a_li")()}
                  label={ Languages.label("ProblemWithExistingCrownstone", "OK")()}
                  onPress={() => {this._changeContent(() => { this._tryToSwitchCrownstone(); this.setState({ switchedCrownstone: null, userInputOnlyThisCrownstone: null, switchedCrownstoneNotNear: null }); }); }}
                />
              );
            }
            else {
              // is it only this one?
              return (
                <DiagYesNo
                  visible={this.state.visible}
                  header={ Languages.label("ProblemWithExistingCrownstone", "I_see____It_failed_to_swi")()}
                  explanation={ Languages.label("ProblemWithExistingCrownstone", "It_could_be_this_Crownsto")()}
                  onPressNo={() => { this._changeContent(() => { this.setState({ userInputOnlyThisCrownstone: false}); }); }}
                  onPressYes={() => {this._changeContent(() => { this.setState({ userInputOnlyThisCrownstone: true }); }); }}
                />
              );
            }
          }
          else if (this.state.userInputOnlyThisCrownstone === false) {
            // ble troubleshooter
            return <DiagSingleBleTroubleshooter visible={this.state.visible} header={Languages.label("ProblemWithExistingCrownstone","In_that_case__its_probabl")()}/>
          }
          else if (this.state.userInputOnlyThisCrownstone === true) {
            // power on / off
            return (
              <DiagSingleButton
                visible={this.state.visible}
                header={ Languages.label("ProblemWithExistingCrownstone", "Could_you_try_restarting_")()}
                explanation={Languages.label("ProblemWithExistingCrownstone","Try_disconnecting_its_pow")()}
                label={ Languages.label("ProblemWithExistingCrownstone", "OK__done_")()}
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
                header={ Languages.label("ProblemWithExistingCrownstone", "It_looks_like_I_can_switc")()}
                explanation={ Languages.label("ProblemWithExistingCrownstone", "Did_it_switch_successfull")()}
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
                  header={ Languages.label("ProblemWithExistingCrownstone", "It_could_be_that_the_conn")()}
                  explanation={ Languages.label("ProblemWithExistingCrownstone", "If_you_try_it_with_a_simp")()}
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
                  header={ Languages.label("ProblemWithExistingCrownstone", "Glad_it_works_now_")()}
                  explanation={Languages.label("ProblemWithExistingCrownstone","If_theres_anything_else__")()}
                />
              );
            }
            else {
              // borked
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={ Languages.label("ProblemWithExistingCrownstone", "In_that_case__this_Crowns")()}
                  explanation={ Languages.label("ProblemWithExistingCrownstone", "Contact_us_at_team_crownst")()}
                />
              );
            }
          }
          else { // success!
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={ Languages.label("ProblemWithExistingCrownstone", "Glad_it_works_")()}
                explanation={Languages.label("ProblemWithExistingCrownstone","If_theres_anything_else__")()}
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
          header={Languages.label("ProblemWithExistingCrownstone","I_cant_hear_this_Crownsto2")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "Are_you_close_to_it_")()}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputPhoneIsClose: false}); }); }}
          onPressYes={() => {this._changeContent(() => { this.setState({userInputPhoneIsClose: true }); }); }}
        />
      )
    }
    else if (this.state.canSeeCrownstoneDirectly === false && this.state.userInputPhoneIsClose === false) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "It_could_just_be_out_of_ra")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "Press_the_button_to_contin")()}
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
      if (state.user.betaAccess) {
        return Languages.label("ProblemWithExistingCrownstone","You_can_disable_Switchcra")();
      }
      else {
        if (state.user.developer) {
          return  Languages.label("ProblemWithExistingCrownstone","The_option_for_Switchcraf_dev")();
        }
        else {
          return  Languages.label("ProblemWithExistingCrownstone","The_option_for_Switchcraf")();
        }
      }
    }
    else {
      return Languages.label("ProblemWithExistingCrownstone","You_can_ask_an_Admin_to_d")();
    }
  }

  _getResults() {
    let state = this.props.store.getState();
    if (this.state.userInputProblemCrownstoneId === null) {
      let sphereId = Util.data.getPresentSphereId(state);
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
          header={Languages.label("ProblemWithExistingCrownstone","Whats_wrong_with__")(name)}
          subExplanation={ Languages.label("ProblemWithExistingCrownstone", "Scroll_down_to_see_all_op")()}
          labels={[
            Languages.label("ProblemWithExistingCrownstone","The_app_says_Searching___")(),
            Languages.label("ProblemWithExistingCrownstone","I_cant_get_it_to_switch_")(),
            Languages.label("ProblemWithExistingCrownstone","It_is_not_in_the_mesh_")(),
            Languages.label("ProblemWithExistingCrownstone","It_switches_unexpectedly_")(),
            Languages.label("ProblemWithExistingCrownstone","It_only_switches_when_Im_")(),
            Languages.label("ProblemWithExistingCrownstone","Its_behaviour_is_weird_")(),
            Languages.label("ProblemWithExistingCrownstone","Other___")()
          ]}
          pressHandlers={[
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'searching'      }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'never_switches' }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(true); this.setState({ crownstoneProblemType: 'not_in_mesh' }); }); },
            () => { this._changeContent(() => { this.setState({ existingTestsFinished: true, crownstoneProblemType: 'unexpected_switches'   }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'only_switches_when_near' }); }); },
            () => { this._changeContent(() => { this.setState({ crownstoneProblemType: 'behaviour_is_weird' }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({ crownstoneProblemType: 'other' }); }); },
          ]}
        />
      );
    }
    else if (this.state.existingTestsFinished === false) {
      let name = nameFromSummary(this.state.problemStoneSummary);
      return <DiagWaiting visible={this.state.visible} header={"Checking on " + name + '...'}/>;
    }
    else if (this.state.crownstoneProblemType === 'searching') {
      return this._handleSearching();
    }
    else if (this.state.crownstoneProblemType === 'never_switches') {
      return this._handleNeverSwitches();
    }
    else if (this.state.crownstoneProblemType === 'not_in_mesh') {
      return this._handleNotInMesh();
    }
    else if (this.state.crownstoneProblemType === 'only_switches_when_near') {
      return this._handleOnlySwitchesWhenNear();
    }
    else if (this.state.crownstoneProblemType === 'unexpected_switches') {
      if (this.state.problemStoneSummary.stoneConfig.switchCraftEnabled) {
        let explanation =  Languages.label("ProblemWithExistingCrownstone", "To_find_the_Activity_Log_")();
        explanation += this._getSwitchCraftExplanation(state);
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ Languages.label("ProblemWithExistingCrownstone", "You_can_look_at_the_Activ")()}
            explanation={explanation}
          />
        );
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ Languages.label("ProblemWithExistingCrownstone", "We_have_recently_added_an")()}
            explanation={ Languages.label("ProblemWithExistingCrownstone", "You_can_find_it_in_the_st")()}
          />
        );
      }

    }
    else if (this.state.crownstoneProblemType === 'behaviour_is_weird' && this.state.weirdType === null) {
      // check for switchCraft
      return (
        <DiagOptions
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "Weird_how_")()}
          labels={[
            Languages.label("ProblemWithExistingCrownstone","I_think_it_should_react_d")(),
            Languages.label("ProblemWithExistingCrownstone","It_switches_unexpectedly_")(),
            Languages.label("ProblemWithExistingCrownstone","It_does_not_work_if_the_a")(),
            Languages.label("ProblemWithExistingCrownstone","Other___")()
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
          header={Languages.label("ProblemWithExistingCrownstone","Its_very_possible_that_so")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "You_can_take_a_look_at_th")()}
        />
      );
    }
    else if (this.state.crownstoneProblemType === 'behaviour_is_weird' && this.state.weirdType === 'not_in_background') {
      return (
        <DiagSingleBleTroubleshooter
          visible={this.state.visible}
          header={Languages.label("ProblemWithExistingCrownstone","Sometimes_the_background_")()}
          explanation={ Languages.label("ProblemWithExistingCrownstone", "This_differs_from_phone_t")()}
        />
      );
    }
    else if (this.state.crownstoneProblemType === 'other') {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={ Languages.label("ProblemWithExistingCrownstone", "Perhaps_the_Help_menu_can")()}
          explanation={Languages.label("ProblemWithExistingCrownstone","Alternatively_you_can_sen")()}
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