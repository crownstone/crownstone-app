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
    return <Text style={diagnosticStyles.headerStyle}>{"Problem with existing Crownstone..."}</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={!this.state.existingTestsVisible && !this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={180}>
          <TestResult label={"Database is healthy"}       state={ true } />
          <TestResult label={"Scanning is enabled"}       state={ true } />
          <TestResult label={"Receiving Sphere beacons"}  state={ true } />
          <TestResult label={"Receiving Crownstone data"} state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.existingTestsVisible && !this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={180}>
          <TestResult label={"Looking for beacon"}    state={ this.state.canSeeCrownstoneBeacon   } />
          <TestResult label={"Looking for data"}      state={ this.state.canSeeCrownstoneDirectly } />
          <TestResult label={"Looking for mesh"}      state={ this.state.canSeeCrownstoneViaMesh || this.state.canSeeThisCrownstoneMesh } />
          <TestResult label={"Looking for address"}   state={ this.state.canSeeCrownstoneAddress  } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.existingMeshTestsVisible && !this.state.switchTestVisible} height={45}>
          <TestResult label={"Checking mesh"}  state={ this.state.canSeeCrownstoneViaMesh || this.state.canSeeThisCrownstoneMesh } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.switchTestVisible} height={45}>
          <TestResult label={"Switching Crownstone"}  state={ this.state.switchedCrownstone } />
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
    let helpPlace = 'Settings';
    if (Platform.OS === 'android') {
      helpPlace = "Sidebar.";
    }

    // not in range
    if (this.state.canSeeCrownstoneAddress === true) {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={"I can hear a Crownstone with the same address as the one we're looking for, but it does not seem to belong to your Sphere."}
          explanation={"You can try to factory reset it.\n\n" +
          "Tap the button below to go to help and tap on 'I need to factory reset a Crownstone'."}
        />
      );
    }
    else if (this.state.userInputPhoneIsClose === null) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={"I can't hear this Crownstone at all..."}
          explanation={"Are you close to it?"}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputPhoneIsClose: false}); }); }}
          onPressYes={() => {this._changeContent(() => { this.setState({userInputPhoneIsClose: true }); }); }}
        />
      )
    }
    else if (this.state.userInputPhoneIsClose === false) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={"It could just be out of range, could you hold your phone as close as possible?"}
          explanation={"Press the button to continue?"}
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
    else if (this.state.userInputResetCrownstoneNow === false) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"OK, we can do it later!"}
          explanation={"Run the diagnostic again when you're ready or factory reset the Crownstone yourself.\n\n" +
          "Go to help in the " + helpPlace + " and tap on 'I need to factory reset a Crownstone'."}
        />
      );
    }
    else if (this.state.factoryResetSuccess === true) {
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

      let header = "I can't hear this Crownstone at all...";
      let explanation = "Try disconnecting it's power, then wait 5 seconds, make sure it's powered again, wait 5 more seconds and press the button below.";

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

        let nearSummary = MapProvider.stoneHandleMap[nearest.handle];
        if (!nearSummary) {
          if (nearest.verified === true) {
            if (Permissions.inSphere(this.state.problemStoneSummary.sphereId).removeCrownstone) {
              return (
                <DiagYesNo
                  visible={this.state.visible}
                  header={"The nearest Crownstone belongs to your Sphere but it has been removed from your database.\n\nIt's " + noun + " close by."}
                  explanation={"This can happen when someone removed this Crownstone from your Sphere, but they did not factory reset it.\n\nWould you like me to reset it?"}
                  onPressNo={ () => { this._changeContent(() => { this.setState({userInputResetCrownstoneNow: false }); }) }}
                  onPressYes={() => { this._changeContent(() => { this.setState({userInputResetCrownstoneNow: true  }); this._factoryResetMyLostCrownstone(nearest.handle) }) }}
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
          if (nearSummary.id !== this.state.userInputProblemCrownstoneId) {
            // nearest Crownstone is not the selected one.
            let name = nameFromSummary(nearSummary);
            if (noun) {
              header = "The nearest Crownstone I can detect is " + name + " and it's " + noun + " close!";
              explanation = "If you're sure you're near the right Crownstone, Try disconnecting it's power, then wait 5 seconds, make sure it's powered again, wait 5 more seconds and press the button below."
            }
          }

          // phone is close
          return (
            <DiagSingleButton
              visible={this.state.visible}
              header={header}
              explanation={explanation}
              label={"OK, done!"}
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
            header={"I can't hear this Crownstone at all..."}
            explanation={"Try disconnecting it's power, then wait 5 seconds, make sure it's powered again, wait 5 more seconds and press the button below."}
            label={"Power has been cycled."}
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
          header={"I still can't hear this Crownstone at all."}
          explanation={"Contact us at team@crownstone.rocks for further assistance."}
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
        explanation = "I didn't hear it via the other Crownstones right now, but it is connected to the mesh. This if normal, as Crownstones take turns to broadcast eachothers's state."
      }
      else {
        if (this.state.amountOfIBeacons <= 1) {
          explanation = "I didn't hear it via the mesh though. From where I am, I can only hear this Crownstone so it's unlikely that it's close enough to other Crownstones to form a mesh."
        }
        else {
          explanation = "I didn't hear it via the mesh though. From where I am, I can a few Crownstones but it could be too far from the other Crownstones to form a mesh."
        }
      }

      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear the Crownstone directly, it should not be 'Seaching...' anymore."}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === false) {
      // good but not in mesh
      let inMesh = this.state.problemStoneSummary.stoneConfig.meshNetworkId !== null;

      let explanation = null;
      if (inMesh === true) {
        explanation = "I didn't hear it via the mesh right now.. This could be just a momentary issue as Crownstones take turns to broadcast eachothers's state."
      }
      else {
        if (this.state.amountOfIBeacons <= 1) {
          explanation = "I didn't hear it via the mesh though. From where I am, I can only hear this Crownstone so it's unlikely that it's close enough to other Crownstones to form a mesh."
        }
        else {
          explanation = "I didn't hear it via the mesh though. From where I am, I can a few Crownstones but it could be too far from the other Crownstones to form a mesh."
        }
      }

      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear the Crownstone directly, it should not be 'Seaching...' anymore."}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === true) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear the Crownstone via the mesh, it should not be 'Seaching...' anymore."}
          explanation={"Since I can't hear this Crownstone directly from where I am, some commands will go through the mesh and won't always be delivered. We're working to improve that!"}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === false && this.state.canSeeCrownstoneDirectly === true) {
      // Crownstone is not beaconing
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear the Crownstone's data but not it's beacon signal."}
          explanation={"You can try to take the power off this Crownstone for a little while and see if it's fixed.\n\nIf this keeps happening, contact us at team@crownstone.rocks."}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === true) {
      // everything is perfect
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can see this Crownstone perfectly!"}
          explanation={"It is not on 'Searching...' now."}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      // crownstone has no data (resetting?)
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear this Crownstone beacon signal but not it's data."}
          explanation={"You can try to take the power off this Crownstone for a little while and see if it's fixed.\n\nIf this keeps happening, contact us at team@crownstone.rocks."}
        />
      );
    }
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === false && this.state.canSeeCrownstoneViaMesh === false) {
      // crownstone has no data (resetting?)
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"I can hear this Crownstone beacon signal but not it's data."}
          explanation={"You can try to take the power off this Crownstone for a little while and see if it's fixed.\n\nIf this keeps happening, contact us at team@crownstone.rocks."}
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
          explanation = "I can't hear it via the mesh but it was in the network. From where I am, I can only hear this Crownstone so maybe it's not close enough enough to other Crownstones to form a mesh?\n\n";
        }
        else {
          explanation = "I can't hear it via the mesh nor is it currently in one. From where I am, I can only hear this Crownstone so it's unlikely that it's close enough to other Crownstones to form a mesh.\n\n";
        }
      }
      else {
        explanation = "I can't hear it via the mesh nor is it currently in one. From where I am, I can a few Crownstones but it could be too far from the other Crownstones to form a mesh.\n\n";
      }
      explanation += "You can try moving it closer or adding more Crownstones to your network. You can use the Mesh Topology view to see how well the mesh is connected. It's in the ";
      if (Platform.OS === 'android') {
        explanation += "Sidebar.";
      }
      else {
          explanation += "Settings.";
      }

      return (
        <DiagSingleButtonMeshTopology
          visible={this.state.visible}
          header={"I see what you mean.."}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeCrownstoneViaMesh === true) {
      // everything is perfect
      let explanation = "It is in the mesh. You can take a look at the network in the Mesh Topology view which you can find in the ";
      if (Platform.OS === 'android') {
        explanation += "Sidebar.";
      }
      else {
        explanation += "Settings.";
      }
      return (
        <DiagSingleButtonMeshTopology
          visible={this.state.visible}
          header={"I can hear other Crownstones talking about this one!"}
          explanation={explanation}
        />
      );
    }
    else if (this.state.canSeeThisCrownstoneMesh === true) {
      // everything is perfect
      let explanation = "It is in the mesh. You can take a look at the network in the Mesh Topology view which you can find in the ";
      if (Platform.OS === 'android') {
        explanation += "Sidebar.";
      }
      else {
        explanation += "Settings.";
      }
      return (
        <DiagSingleButtonMeshTopology
          visible={this.state.visible}
          header={"I can hear this Crownstone broadcasting the state of his fellow Crownstones."}
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
          header={"This is usually because the message has to go through the mesh network."}
          explanation={"It can happen that messages over the mesh network are lost if there is only one path between Crownstones.\n\n" +
          "We're working to improve this!\n\n" +
          "Alternatively, a Crownstone does not switch back to 'Searching...' directly when you're out of range. It could be that the app thinks the Crownstone is still in range while you're already too far away."}
        />
      );
    }
    else {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"You're probably out of range when that happens."}
          explanation={"A Crownstone does not switch back to 'Searching...' directly when you're out of range.\n\n" +
          "It could be that the app thinks the Crownstone is still in range while you're already too far away.\n\n" +
          "If a Crownstone is in range of another, they form a mesh network. This can help you to relay a command from a Crownstone in your range to another."}
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
            header={"Something went wrong."}
            explanation={"Please restart the diagnostic."}
          />
        );
      }
      let currentState = adv.serviceData.switchState;

      if (adv.serviceData.hasError === true) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"This Crownstone seems to have a hardware error."}
            explanation={"This does not mean your device is broken. Tap on it's room and tap on the Crownstone. It will guide to to fixing the hardware error."}
          />
        );
      }

      // check if locked
      if (adv.serviceData.switchLocked === true) {
        if (Permissions.inSphere(this.state.problemStoneSummary.sphereId).canUnlockCrownstone) {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={"Someone has locked this Crownstone."}
              explanation={"A Crownstone can be locked to prevent it from switching. You can disable the lock by going to the Device settings (tap on room, tap on Crownstone) and holding your finger on the button."}
            />
          );
        }
        else {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={"Someone has locked this Crownstone."}
              explanation={"A Crownstone can be locked to prevent it from switching. You'll need to ask an Admin in your Sphere to unlock it for you."}
            />
          );
        }
      }

      if (this.state.userInputAllowedToSwitch === null) {
        return (
          <DiagYesNo
            visible={this.state.visible}
            header={"Let me try to switch this Crownstone."}
            explanation={"Is that OK? It's currently " + (currentState > 0 ? 'on' : 'off') + " and I'd like to turn it " + (currentState > 0 ? 'off' : 'on') + '.'}
            onPressNo={() => { this._changeContent(() => { this.setState({userInputAllowedToSwitch: false}); }); }}
            onPressYes={() => {this._changeContent(() => { this._tryToSwitchCrownstone(); this.setState({userInputAllowedToSwitch: true, switchTestVisible:true }); }); }}
          />
        );
      }
      else if (this.state.userInputAllowedToSwitch === false) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"No problem, maybe next time!"}
            explanation={"Rerun the diagnostic once you're ready to let me try to switch this Crownstone."}
          />
        );
      }
      else if (this.state.userInputAllowedToSwitch === true) {
        if (this.state.switchedCrownstone === null) {
          // switching...
          let name = nameFromSummary(this.state.problemStoneSummary);
          return <DiagWaiting visible={this.state.visible} header={"Trying to switch " + name + '...'}/>;
        }
        else if (this.state.switchedCrownstone === false) {
          if (this.state.userInputOnlyThisCrownstone === null) {
            if (this.state.switchedCrownstoneNotNear === true) {
              // is it only this one?
              return (
                <DiagSingleButton
                  visible={this.state.visible}
                  header={"I couldn't hear any messages from that Crownstone, but I could before.."}
                  explanation={"Could you try moving a little closer? Tap the button once you're a bit closer to this Crownstone."}
                  label={"OK"}
                  onPress={() => {this._changeContent(() => { this._tryToSwitchCrownstone(); this.setState({ switchedCrownstone: null, userInputOnlyThisCrownstone: null, switchedCrownstoneNotNear: null }); }); }}
                />
              );
            }
            else {
              // is it only this one?
              return (
                <DiagYesNo
                  visible={this.state.visible}
                  header={"I see... It failed to switch."}
                  explanation={"It could be this Crownstone or it could be your phone. Can you swith another Crownstone successfully?"}
                  onPressNo={() => { this._changeContent(() => { this.setState({ userInputOnlyThisCrownstone: false}); }); }}
                  onPressYes={() => {this._changeContent(() => { this.setState({ userInputOnlyThisCrownstone: true }); }); }}
                />
              );
            }
          }
          else if (this.state.userInputOnlyThisCrownstone === false) {
            // ble troubleshooter
            return <DiagSingleBleTroubleshooter visible={this.state.visible} header={"In that case, it's probably your phone's Bluetooth. Tap the button below to resolve this!"}/>
          }
          else if (this.state.userInputOnlyThisCrownstone === true) {
            // power on / off
            return (
              <DiagSingleButton
                visible={this.state.visible}
                header={"Could you try restarting the Crownstone?"}
                explanation={"Try disconnecting it's power, then wait 5 seconds, make sure it's powered again, wait 5 more seconds and press the button below."}
                label={"OK, done!"}
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
                header={"It looks like I can switch it OK, could you verify that it was switched?"}
                explanation={"Did it switch successfully?"}
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
                  header={"It could be that the connected device is broken.."}
                  explanation={"If you try it with a simple light (which works on another outlet), did it switch successfully?"}
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
                  header={"Glad it works now!"}
                  explanation={"If there's anything else, please run the diagnostics again!"}
                />
              );
            }
            else {
              // borked
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={"In that case, this Crownstone may be broken."}
                  explanation={"Contact us at team@crownstone.rocks for assistance."}
                />
              );
            }
          }
          else { // success!
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={"Glad it works!"}
                explanation={"If there's anything else, please run the diagnostics again!"}
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
          header={"I can't hear this Crownstone.."}
          explanation={"Are you close to it?"}
          onPressNo={() => { this._changeContent(() => { this.setState({userInputPhoneIsClose: false}); }); }}
          onPressYes={() => {this._changeContent(() => { this.setState({userInputPhoneIsClose: true }); }); }}
        />
      )
    }
    else if (this.state.canSeeCrownstoneDirectly === false && this.state.userInputPhoneIsClose === false) {
      return (
        <DiagSingleButton
          visible={this.state.visible}
          header={"It could just be out of range, could you hold your phone as close as possible?"}
          explanation={"Press the button to continue."}
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
        return "You can disable Switchcraft in the settings of the Crownstone. Navigate to the room, tap on the Crownstone, tap 'Edit' in the top right corner and disable SwitchCraft";
      }
      else {
        if (state.user.developer) {
          return  "The option for Switchcraft is hidden since you're not in the alpha program. You can enable it in the developer menu.\n\n" +
            "You can disable Switchcraft in the settings of the Crownstone. Navigate to the room, tap on the Crownstone, tap 'Edit' in the top right corner and disable SwitchCraft";
        }
        else {
          return  "The option for Switchcraft is hidden since you're not in the Alpha program. You can enable it in the developer menu, which is in the user profile.\n\n" +
            "You can disable Switchcraft in the settings of the Crownstone. Navigate to the room, tap on the Crownstone, tap 'Edit' in the top right corner and disable SwitchCraft";
        }
      }
    }
    else {
      return "You can ask an Admin to disable Switchcraft for this Crownstone.";
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
          header={"What's wrong with " + name + '?'}
          subExplanation={"Scroll down to see all options."}
          labels={[
            "The app says 'Searching...'.",
            "I can't get it to switch.",
            "It is not in the mesh.",
            "It switches unexpectedly.",
            "It only switches when I'm nearby.",
            "It's behaviour is weird.",
            "Other..."
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
        let explanation = "To find the Activity Log, tap on the room, tap on the Crownstone icon and navigate to the right until you see it.\n\n" +
                          "Switches triggered by Switchcraft won't show up in this overview. Keep in mind that Switchcraft is still experimental and it is not intended for normal use yet.\n\n";
        explanation += this._getSwitchCraftExplanation(state);
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"You can look at the Activity Log to see why the Crownstone switched.\n\nAnother possible cause is that Switchcraft is enabled for this Crownstone."}
            explanation={explanation}
          />
        );
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"We have recently added an Activity Log just for this!"}
            explanation={"You can find it in the stone properties: tap on the room, tap on the Crownstone icon and navigate to the right until you see it."}
          />
        );
      }

    }
    else if (this.state.crownstoneProblemType === 'behaviour_is_weird' && this.state.weirdType === null) {
      // check for switchCraft
      return (
        <DiagOptions
          visible={this.state.visible}
          header={"Weird how?"}
          labels={[
            "I think it should react differently based on how I configured it.",
            "It switches unexpectedly.",
            "It does not work if the app is not open",
            "Other..."
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
          header={"It's very possible that some of the behaviour has not been comminucated clearly :)."}
          explanation={"You can take a look at the help menu or let us know how we can help you and improve the app by sending an email at team@crownstone.rocks!"}
        />
      );
    }
    else if (this.state.crownstoneProblemType === 'behaviour_is_weird' && this.state.weirdType === 'not_in_background') {
      return (
        <DiagSingleBleTroubleshooter
          visible={this.state.visible}
          header={"Sometimes the background processes don't work the way they should."}
          explanation={"This differs from phone to phone. Press the button to go to the BLE troubleshooter."}
        />
      );
    }
    else if (this.state.crownstoneProblemType === 'other') {
      return (
        <DiagSingleButtonHelp
          visible={this.state.visible}
          header={'Perhaps the Help menu can help you further.'}
          explanation={"Alternatively you can send us an email at team@crownstone.rocks and we'll do our best to help you!"}
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