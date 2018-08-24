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
  DiagSingleButtonQuit, DiagSingleButtonToOverview, DiagYesNo, TestResult, DiagListOfStones
} from "./DiagnosticUtil";
import {SlideInView} from "../../components/animated/SlideInView";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
import {TestRunner} from "./TestRunner";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {Util} from "../../../util/Util";
import {
  enoughCrownstonesForIndoorLocalization,
  enoughCrownstonesInLocationsForIndoorLocalization, requireMoreFingerprints
} from "../../../util/DataUtil";
import {STONE_TYPES} from "../../../router/store/reducers/stones";


export class ProblemWithLocalization extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      sphereTestsVisible: true,
      beaconTestVisible: false,

      stoneTypeWarningRead: null,
      problemStoneSummary: null,

      userInputProblemCrownstoneId: null,
      userInputProblemType:     null,
      userInputRoomProblemType: null,
    };
    setTimeout(() => { this.setState({visible: true, sphereTestsVisible: false}) }, 10);
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
    return <Text style={diagnosticStyles.headerStyle}>{"Problem with localization..."}</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={this.state.sphereTestsVisible} height={180}>
          <TestResult label={"Database is healthy"}       state={ true } />
          <TestResult label={"Scanning is enabled"}       state={ true } />
          <TestResult label={"Receiving Sphere beacons"}  state={ true } />
          <TestResult label={"Receiving Crownstone data"} state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.beaconTestVisible} height={45}>
          <TestResult label={"Checking for Beacons"} state={ this.state.canSeeBeacons } />
        </SlideFadeInView>
      </View>
    );
  }


  _getLocalizationInfo() {
    let state = this.props.store.getState();
    let presentSphereId = Util.data.getPresentSphereId(state);
    let enoughForLocalization = enoughCrownstonesForIndoorLocalization(state, presentSphereId);
    let enoughForLocalizationInLocations = enoughCrownstonesInLocationsForIndoorLocalization(state, presentSphereId);
    let requiresFingerprints = requireMoreFingerprints(state, presentSphereId);

    let stones = state.spheres[presentSphereId].stones;
    let stoneIds = Object.keys(stones);
    let amountOfVisible = 0;
    let amountOfStones = stoneIds.length;
    stoneIds.forEach((stoneId) => {
      if (stones[stoneId].reachability.rssi > -100 && stones[stoneId].reachability.disabled === false) {
        amountOfVisible += 1;
      }
    });

    let enoughVisible = amountOfVisible >= 3;
    let enabledInApp = state.app.indoorLocalizationEnabled;
    let tapToToggleEnabledInApp = state.app.tapToToggleEnabled;
    let tapToToggleCalibration = Util.data.getTapToToggleCalibration(state);


    return {
      enoughForLocalization,
      enoughForLocalizationInLocations,
      requiresFingerprints,
      amountOfVisible,
      amountOfStones,
      enoughVisible,
      enabledInApp,
      tapToToggleEnabledInApp,
      tapToToggleCalibration,
    }
  }

  _handleRoomLevel(inAccurate = false) {
    let ldata = this._getLocalizationInfo();

    if (ldata.enoughForLocalization) {
      if (inAccurate) {
        if (ldata.enoughVisible) {
          let header = '';
          let explanation = "Make sure the Crownstones are spread around the space evenly! If they're all side by side, it's very difficult to pinpoint you.\n\n" +
            "Alternatively you can try to retrain your rooms. You can do this by tapping on a room bubble in the overview, then tapping on the button in the top right corner.\n\n" +
            "Finally, we're working on brand new algorithms that will make this much more reliable! You'll get these as a free update when they're available!";
          if (ldata.amountOfStones > 10) {
            header = "You have a good amount of Crownstones! If you have a large area to cover, you'll need more Crownstones as well.";
          }
          else {
            header = "The more Crownstones you have, the better the indoor localization will be.";
          }
          header += "\n\nApart from the amount, the spread of Crownstones is important too!";
          // does not work right here
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={header}
              explanation={explanation}
            />
          );
        }
        else {
          let header = '';
          let explanation = "Make sure the Crownstones are spread around the space evenly! If they're all side by side, it's very difficult to pinpoint you.\n\n" +
            "Alternatively you can try to retrain your rooms. You can do this by tapping on a room bubble in the overview, then tapping on the button in the top right corner.\n\n" +
            "Finally, we're working on brand new algorithms that will make this much more reliable! You'll get these as a free update when they're available!";
          if (ldata.amountOfStones > 10) {
            header = "Even thought you have a good amount of Crownstones, if you have a large area to cover, you'll need more Crownstones as well.\n\nWhere you are right now, I can't see at least 3 Crownstones to do the indoor localization.";
          }
          else {
            header = "The more Crownstones you have, the better the indoor localization will be. If you have a large area to cover, you'll need more Crownstones as well.\n\nWhere you are right now, I can't see at least 3 Crownstones to do the indoor localization."
          }
          header += "\n\nApart from the amount, the spread of Crownstones is important too!";
          // does not work right here
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={header}
              explanation={explanation}
            />
          );
        }

      }
      else {
        if (ldata.enoughForLocalizationInLocations) {
          if (ldata.requiresFingerprints) {
            if (ldata.enabledInApp) {
              if (ldata.enoughVisible) {
                // does not work right here
                return (
                  <DiagSingleButtonGoBack
                    visible={this.state.visible}
                    header={"Indoor localization is running!"}
                    explanation={"You can see your face on the room bubbles showing where the app thinks you are!"}
                  />
                );
              }
              else {
                // does not work right here
                return (
                  <DiagSingleButtonGoBack
                    visible={this.state.visible}
                    header={"There are not enough Crownstones in range at the moment to do the indoor localization. We need at least 3."}
                    explanation={"Since the radio field is radially symmetric, we require at least 3 Crownstones in range to determine where you are."}
                  />
                );
              }
            }
            else {
              // user has disabled indoor localization in app
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={"Indoor localization is disabled by you."}
                  explanation={"You can enable this in the 'App Settings' which you can find in the " + (Platform.OS === 'android' ? 'Sidebar' : 'settings menu') + '.'}
                />
              );
            }
          }
          else {
            // rooms need to be trained
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={"You need to train the rooms before the localization can run."}
                explanation={"You can do this by tapping on the location icon in the top right corner of the room and following the instructions."}
              />
            );
          }
        }
        else {
          // not enough in room
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={"You need to have at least 4 Crownstoens places in rooms. Take the ones that are 'Floating' and assign a room to them!"}
              explanation={"Not all rooms in the app require Crownstones inside of them.\n\n" +
              "As long as you pick up a signal from at least 3 Crownstones in a room, it can be used for localization. Even if the Crownstones that send the signals are in other rooms."}
            />
          );
        }
      }
    }
    else {
      // not enough crownstones
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"Room level localization is only available if you have 4 or more Crownstones in your Sphere."}
          explanation={"This is required to be able to pinpoint you in a room. The more Crownstones you have, the better the localization will be!"}
        />
      );
    }
  }

  _handleNearFar() {
    // which crownstone
    let ldata = this._getLocalizationInfo();

    if (!ldata.enabledInApp) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"Indoor localization is disabled by you."}
          explanation={"You can enable this in the 'App Settings' which you can find in the " + (Platform.OS === 'android' ? 'Sidebar' : 'settings menu') + '.'}
        />
      );
    }

    let state = this.props.store.getState();
    let sphereId = Util.data.getPresentSphereId(state);
    let stones = state.spheres[sphereId].stones;

    if (this.state.userInputProblemCrownstoneId === null) {
      return (
        <DiagListOfStones
          visible={this.state.visible}
          stones={stones}
          callback={(summary) => {
            this._changeContent(() => {
              this.setState({ problemStoneSummary: summary, userInputProblemCrownstoneId: summary.id });
            });
          }}
        />
      );
    }
    else {
      let stone = stones[this.state.userInputProblemCrownstoneId];
      let element = Util.data.getElement(this.props.store, sphereId, this.state.userInputProblemCrownstoneId, stone);
      let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, sphereId) && stone.config.locationId !== null;
      let nearFarDisabled = canDoIndoorLocalization === false && stone.config.nearThreshold === null && element.behaviour.onAway.active === true && element.behaviour.onNear.active === true;

      if (canDoIndoorLocalization) {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"When indoor localization at room-level is available, we do not use near/further away."}
            explanation={"This is a design choice, not a bug. We're working on smarter behaviour though, which will allow you to incorporate near/further away together with room-level localization."}
          />
        );
      }
      else if (nearFarDisabled) {
        if (stone.config.nearThreshold === null) {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={"You will need to train the distance of what exactly is near. This differs from phone to phone so everyone using this will have to train it."}
              explanation={"Tap on the room, tap on the Crownstone icon, navigate to the right and tap edit on the Behaviour menu. You can train the distance there."}
            />
          );
        }
        else {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={"Near/further away behaviour has not been configured by you."}
              explanation={"Tap on the room, tap on the Crownstone icon, navigate to the right and tap edit on the Behaviour menu. Tell me what you'd like me to do when you get near and move further away and train the distance."}
            />
          );
        }
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"Near/further away is configured correctly on this Crownstone."}
            explanation={"You can retrain where you want 'near' to be by editing the behaviour.\n\nTap on the room, tap on the Crownstone icon, navigate to the right and tap edit on the Behaviour menu. You can train the distance there.\n\n" +
            "Keep in mind, since human beings are essentially big sacks of water, if you sit between your phone and the Crownstone it will think it's further away than it really is!"}
          />
        );
      }
    }
  }

  _handleTapToToggle() {
    let ldata = this._getLocalizationInfo();

    if (!ldata.tapToToggleEnabledInApp) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"Tap-to-toggle is disabled."}
          explanation={"You can enable this in the 'App Settings' which you can find in the " + (Platform.OS === 'android' ? 'Sidebar' : 'settings menu') + '.'}
        />
      );
    }

    if (!ldata.tapToToggleCalibration) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"Tap-to-toggle is not configured yet!"}
          explanation={"You can enable this in the in the " + (Platform.OS === 'android' ? 'Sidebar' : 'settings menu') + " by tapping on 'Calibrate Tap-to-Toggle'."}
        />
      );
    }

    let state = this.props.store.getState();
    let sphereId = Util.data.getPresentSphereId(state);
    let stones = state.spheres[sphereId].stones;

    if (this.state.userInputProblemCrownstoneId === null) {
      return (
        <DiagListOfStones
          visible={this.state.visible}
          stones={stones}
          callback={(summary) => {
            this._changeContent(() => {
              this.setState({ problemStoneSummary: summary, userInputProblemCrownstoneId: summary.id });
            });
          }}
        />
      );
    }
    else {
      let stone = stones[this.state.userInputProblemCrownstoneId];
      if (stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin && this.state.stoneTypeWarningRead === true) {
        if (stone.config.tapToToggle) {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={"Tap-to-toggle is configured correctly on this Crownstone."}
              explanation={"If it's not working as you'd like, try recalibrating the distance.\n\n" +
              "You can do this in the in the \" + (Platform.OS === 'android' ? 'Sidebar' : 'settings menu') + \" by tapping on 'Calibrate Tap-to-Toggle'."}
            />
          );
        }
        else {
          if (Permissions.inSphere(sphereId).editCrownstone) {
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={"Tap-to-toggle is disabled on this Crownstone."}
                explanation={"You can enable it by tapping on the room, tapping on the Crownstone icon, tapping edit in the top right corner and enabling it there."}
              />
            );
          }
          else {
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={"Tap-to-toggle is disabled on this Crownstone."}
                explanation={"You will have to ask an admin in your Sphere to enable this."}
              />
            );
          }
        }
      }
      else if (stone.config.type === STONE_TYPES.builtin) {
        return (
          <DiagSingleButton
            visible={this.state.visible}
            header={"We don't generally recommend using tap-to-toggle on built-ins. Calibrating tap-to-toggle for built-ins can cause issues with tap-to-toggle on plugs."}
            explanation={"Press the button to continue, or close the diagnostic menu."}
            label={"Continue"}
            onPress={() => { this._changeContent(() => { this.setState({ stoneTypeWarningRead: true }); }); }}
          />
        );
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={"Tap-to-toggle does not work on a device that can't toggle anything."}
            explanation={"I can't help you with this."}
          />
        );
      }
    }
  }

  _handleThingsTurnOff() {
    // check how many users in sphere
    let state = this.props.store.getState();
    let presentSphereId = Util.data.getPresentSphereId(state);

    let sphere = state.spheres[presentSphereId];
    let multipleUsers = Object.keys(sphere.users).length > 1;
    if (multipleUsers) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={"We have recently added an Activity Log just for this! For room events, like room exit, I can't take multiple users into account yet.\n\n" +
          "I'm working on this!"}
          explanation={"You can find the Activity Log in the stone properties: tap on the room, tap on the Crownstone icon and navigate to the right until you see it."}
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
    // activity log.
  }

  _handleMultiUser() {
    return (
      <DiagSingleButtonGoBack
        visible={this.state.visible}
        header={"This is currently unavoidable for the room events. However, the Sphere Exit event does work with multiple users."}
        explanation={"We are working on new behaviour that will combine the schedules and the behaviour to facilitate this!"}
      />
    );
  }

  _handleWhenDark() {
    return (
      <DiagSingleButtonGoBack
        visible={this.state.visible}
        header={"Only turn on when dark will only suppress the action the moment you enter a room or enter your Sphere."}
        explanation={"It will not turn on at a later time if you don't re-enter your room or Sphere.\n\n" +
        "We are working on new behaviour that will combine the schedules and the behaviour to facilitate this!"}
      />
    );
  }

  _getResults() {
    if (this.state.userInputProblemType === null) {
      return (
        <DiagOptions
          visible={this.state.visible}
          header={"What's wrong with the Localization?"}
          subExplanation={"Scroll down to see all options."}
          labels={[
            "It does not do room-level localization.",
            "Room-level localization is inaccurate.",
            "Near/far does not work.",
            "Tap to toggle does not work.",
            "Things turn off while I'm still there.",
            "If I leave the room but someone is still there, Crownstones still turn off.",
            "'Only on when dark' does not turn on.",
            "Other..."
          ]}
          pressHandlers={[
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'no_room_level'}); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'room_level_inaccurate'}); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'near_far'  }); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'tap_to_toggle'}); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'things_turn_off'}); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'multi_user'}); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'when_dark' }); }); },
            () => { this._changeContent(() => { this.setState({userInputProblemType: 'other'     }); }); },
          ]}
        />
      );
    }
    else if (this.state.userInputProblemType === 'no_room_level') {
      return this._handleRoomLevel();
    }
    else if (this.state.userInputProblemType === 'room_level_inaccurate') {
      return this._handleRoomLevel(true);
    }
    else if (this.state.userInputProblemType === 'near_far') {
      return this._handleNearFar();
    }
    else if (this.state.userInputProblemType === 'tap_to_toggle') {
      return this._handleTapToToggle();
    }
    else if (this.state.userInputProblemType === 'things_turn_off') {
      return this._handleThingsTurnOff();
    }
    else if (this.state.userInputProblemType === 'multi_user') {
      return this._handleMultiUser();
    }
    else if (this.state.userInputProblemType === 'when_dark') {
      return this._handleWhenDark();
    }
    else if (this.state.userInputProblemType === 'other') {
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