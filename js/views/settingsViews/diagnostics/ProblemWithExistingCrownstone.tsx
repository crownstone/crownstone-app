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
import {colors, screenWidth} from "../../styles";
import {FadeInView} from "../../components/animated/FadeInView";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {
  DiagOptions,
  DiagSingleBleTroubleshooter, DiagSingleButton,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonQuit, DiagSingleButtonToOverview, DiagYesNo, TestResult, nameFromSummary
} from "./DiagnosticUtil";
import {SlideInView} from "../../components/animated/SlideInView";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {TestRunner} from "./TestRunner";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {Util} from "../../../util/Util";


export class ProblemWithExistingCrownstone extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      existingTestsVisible: false,

      nearestCheck: [],
      amountOfIBeacons: 0,
      canSeeCrownstoneNotInSphere: null,
      canSeeCrownstoneAddress: null,
      canSeeCrownstoneBeacon: null,
      canSeeCrownstoneDirectly: null,
      canSeeCrownstoneRssi: null,
      canSeeCrownstoneViaMesh : null,
      existingTestsFinished : false,

      problemStoneSummary:      null,
      crownstoneProblemType:    null,

      userInputProblemCrownstoneId:    null,
      userInputProblemsWithCrownstone: null,
      userInputProblems:               null,
      userInputExistingCrownstone:     null,
      userInputPhoneIsClose:           null,
      userInputCycledPower:            null,
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

  _runExistingCrownstoneTests() {
    this.setState({existingTestsVisible: true});
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
        })

        setTimeout(() => { this.setState({canSeeCrownstoneDirectly: TestRunner.getSearchResultForAdvertisment(stoneId, result)}) }, 200);
        setTimeout(() => { this.setState({canSeeCrownstoneViaMesh:  TestRunner.getSearchResultForMesh(stoneId, result)        }) }, 400);
        setTimeout(() => { this.setState({
          existingTestsFinished: true,
          canSeeCrownstoneAddress: (TestRunner.getSearchResultForUnVerified(stoneId, result) || TestRunner.getSearchResultForAdvertisment(stoneId, result))
        }) }, 600)
      })
      .catch((err) => { console.error(err)})
  }

  _getHeader() {
    return <Text style={diagnosticStyles.headerStyle}>{"You're in your Sphere!"}</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={!this.state.existingTestsVisible} height={180}>
          <TestResult label={"Database is healthy"}          state={ true } />
          <TestResult label={"Scanning is enabled"}          state={ true } />
          <TestResult label={"Receiving Sphere beacons"}     state={ true } />
          <TestResult label={"Receiving Crownstone data"}    state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.existingTestsVisible} height={180}>
          <TestResult label={"Looking for beacon"}    state={ this.state.canSeeCrownstoneBeacon   } />
          <TestResult label={"Looking for data"}      state={ this.state.canSeeCrownstoneDirectly } />
          <TestResult label={"Looking for mesh"}      state={ this.state.canSeeCrownstoneViaMesh  } />
          <TestResult label={"Looking for address"}   state={ this.state.canSeeCrownstoneAddress  } />
        </SlideFadeInView>
      </View>
    )
  }


  _handleNotInRange() {
    // not in range
    if (this.state.userInputPhoneIsClose === null) {
      return (
        <DiagYesNo
          visible={this.state.visible}
          header={"I can't hear this Crownstone at all..."}
          explanation={"Are you close to this Crownstone?"}
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
            existingTestsFinished : false,
            userInputPhoneIsClose: true
          });
            this._runExistingCrownstoneTests();
          }); }}
        />
      );
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
      let explanation = "Try disconnecting it's power, then wait 5 seconds, make sure it's powered again, wait 5 more seconds and press the button below."

      if (nearest) {
        let nearSummary = MapProvider.stoneHandleMap[nearest.handle];
        if (nearSummary.id !== this.state.userInputProblemCrownstoneId) {
          // nearest Crownstone is not the selected one.
          let name = nameFromSummary(nearSummary);
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

          if (noun) {
            header = "The nearest Crownstone I can detect is " + name + " and it's " + noun + " close!"
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
              existingTestsFinished : false,
              userInputCycledPower: true,
              userInputPhoneIsClose: true
            });
              this._runExistingCrownstoneTests();
            }); }}
          />
        );
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
    else if (this.state.canSeeCrownstoneBeacon === true && this.state.canSeeCrownstoneDirectly === true && this.state.canSeeCrownstoneViaMesh === false) {
      // good but not in mesh
      let inMesh = this.state.problemStoneSummary.stoneConfig.meshNetworkId !== null;

      let explanation = null;
      if (inMesh === true) {
        explanation = "I didn't hear it via the mesh right now, but it is connected to the mesh. This is not a problem, as Crownstones take turns to broadcast eachother state."
      }
      else {
        if (this.state.amountOfIBeacons <= 1) {
          explanation = "I didn't hear it via the mesh though. From over here, I can only hear this Crownstone so it's unlikely that it's close enough to other Crownstones to form a mesh."
        }
        else {
          explanation = "I didn't hear it via the mesh though. From over here, I can a few Crownstones but it could be too far from the other Crownstones to form a mesh."
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
          explanation={"Since I can't hear this Crownstone directly from over here, some commands will go through the mesh and won't always be delivered. We're working to improve that!"}
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
  }


  _getResults() {
    if (this.state.userInputProblemCrownstoneId === null) {
      let state = this.props.store.getState();
      let sphereId = Util.data.getPresentSphereId(state);
      let stones = state.spheres[sphereId].stones;
      let labels : string[] = [];
      let pressHandlers : any = [];
      let summaries = [];
      Object.keys(stones).forEach((stoneId) => {
        summaries.push(MapProvider.stoneSummaryMap[stoneId]);
      });

      summaries.sort((a,b) => { return String(a.locationName) < String(b.locationName) ? -1 : 1 })

      summaries.forEach((summary) => {
        let name = summary.name;
        if (summary.applianceName) { name = summary.applianceName; }
        if (summary.locationName)  { name += " in " + summary.locationName; }
        labels.push(name);
        pressHandlers.push(() => {
          this._changeContent(() => {
            this.setState({problemStoneSummary: summary, userInputProblemCrownstoneId: summary.id  });
          });
        });
      })

      return (
        <DiagOptions
          visible={this.state.visible}
          header={"Which Crownstone is giving problems?"}
          labels={labels}
          pressHandlers={pressHandlers}
        />
      );
    }
    else if (this.state.userInputProblemCrownstoneId !== null && this.state.crownstoneProblemType === null) {
      let name = nameFromSummary(this.state.problemStoneSummary);
      return (
        <DiagOptions
          visible={this.state.visible}
          header={"What's wrong with " + name + '?'}
          labels={[
            "The app says 'Searching...'.",
            "It never switches.",
            "It switches unexpectedly.",
            "It sometimes switches, sometimes it won't.",
            "I can't connect to it.",
            "Other..."
          ]}
          pressHandlers={[
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({crownstoneProblemType: 'searching'      }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({crownstoneProblemType: 'never_switches' }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({crownstoneProblemType: 'unexpected_switches' }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({crownstoneProblemType: 'unreliable_switches' }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({crownstoneProblemType: 'cant_connect'   }); }); },
            () => { this._changeContent(() => { this._runExistingCrownstoneTests(); this.setState({crownstoneProblemType: 'other'          }); }); },
          ]}
        />
      );
    }
    else if (this.state.existingTestsFinished === false) {
      let name = this.state.problemStoneSummary.name;
      if (this.state.problemStoneSummary.applianceName) { name =  this.state.problemStoneSummary.applianceName;         }
      if (this.state.problemStoneSummary.locationName ) { name += " in " + this.state.problemStoneSummary.locationName; }
      return (
        <View style={{flex:1}}>
          <View style={{flex:1}} />
          <FadeInView visible={this.state.visible} style={{width:screenWidth}}>
            <Text style={diagnosticStyles.headerStyle}>{"Checking on " + name + '...'}</Text>
          </FadeInView>
          <View style={{flex:1}} />
        </View>
      );
    }
    else if (this.state.crownstoneProblemType === 'searching') {
      this._handleSearching();
    }
    else if (this.state.crownstoneProblemType === 'wont_switch') {

    }
    else if (this.state.crownstoneProblemType === 'cant_connect') {

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