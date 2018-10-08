import { Languages } from "../../../Languages"
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
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {
  DiagOptions,
  DiagSingleBleTroubleshooter, DiagSingleButton,
  DiagSingleButtonHelp,
  DiagSingleButtonGoBack,
  DiagSingleButtonQuit, DiagSingleButtonToOverview, DiagYesNo, TestResult, DiagListOfStones
} from "./DiagnosticUtil";
import {SlideFadeInView} from "../../components/animated/SlideFadeInView";
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
    return <Text style={diagnosticStyles.headerStyle}>{ Languages.text("ProblemWithLocalization", "Problem_with_localization")() }</Text>
  }

  _getTests() {
    return (
      <View>
        <SlideFadeInView visible={this.state.sphereTestsVisible} height={180}>
          <TestResult label={ Languages.label("ProblemWithLocalization", "Database_is_healthy")()}       state={ true } />
          <TestResult label={ Languages.label("ProblemWithLocalization", "Scanning_is_enabled")()}       state={ true } />
          <TestResult label={ Languages.label("ProblemWithLocalization", "Receiving_Sphere_beacons")()}  state={ true } />
          <TestResult label={ Languages.label("ProblemWithLocalization", "Receiving_Crownstone_data")()} state={ true } />
        </SlideFadeInView>
        <SlideFadeInView visible={this.state.beaconTestVisible} height={45}>
          <TestResult label={ Languages.label("ProblemWithLocalization", "Checking_for_Beacons")()} state={ this.state.canSeeBeacons } />
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
          let explanation =  Languages.label("ProblemWithLocalization", "Make_sure_the_Crownstones")();
          if (ldata.amountOfStones > 10) {
            header =  Languages.label("ProblemWithLocalization", "You_have_a_good_amount_of")();
          }
          else {
            header =  Languages.label("ProblemWithLocalization", "The_more_Crownstones_you_")();
          }
          header += Languages.label("ProblemWithLocalization","__Apart_from_the_amount__")();
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
          let explanation =  Languages.label("ProblemWithLocalization", "Make_sure_the_Crownstones_")();
          if (ldata.amountOfStones > 10) {
            header = Languages.label("ProblemWithLocalization","Even_thought_you_have_a_g")();
          }
          else {
            header = Languages.label("ProblemWithLocalization","The_more_Crownstones_you_expl")()
          }
          header += Languages.label("ProblemWithLocalization","__Apart_from_the_amount__")()
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
                    header={ Languages.label("ProblemWithLocalization", "Indoor_localization_is_ru")()}
                    explanation={ Languages.label("ProblemWithLocalization", "You_can_see_your_face_on_")()}
                  />
                );
              }
              else {
                // does not work right here
                return (
                  <DiagSingleButtonGoBack
                    visible={this.state.visible}
                    header={ Languages.label("ProblemWithLocalization", "There_are_not_enough_Crow")()}
                    explanation={ Languages.label("ProblemWithLocalization", "Since_the_radio_field_is_")()}
                  />
                );
              }
            }
            else {
              // user has disabled indoor localization in app
              return (
                <DiagSingleButtonGoBack
                  visible={this.state.visible}
                  header={ Languages.label("ProblemWithLocalization", "Indoor_localization_is_di")()}
                  explanation={ Languages.label("ProblemWithLocalization", "You_can_enable_this_in_th2")(Platform.OS === 'android')}
                />
              );
            }
          }
          else {
            // rooms need to be trained
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={ Languages.label("ProblemWithLocalization", "You_need_to_train_the_roo")()}
                explanation={ Languages.label("ProblemWithLocalization", "You_can_do_this_by_tappin")()}
              />
            );
          }
        }
        else {
          // not enough in room
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={Languages.label("ProblemWithLocalization","You_need_to_have_at_least")()}
              explanation={Languages.label("ProblemWithLocalization","Not_all_rooms_in_the_app_")()}
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
          header={ Languages.label("ProblemWithLocalization", "Room_level_localization_i")()}
          explanation={ Languages.label("ProblemWithLocalization", "This_is_required_to_be_ab")()}
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
          header={ Languages.label("ProblemWithLocalization", "Indoor_localization_is_dis")()}
          explanation={ Languages.label("ProblemWithLocalization", "You_can_enable_this_in_th2")(Platform.OS === 'android')}
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
            header={ Languages.label("ProblemWithLocalization", "When_indoor_localization_")()}
            explanation={Languages.label("ProblemWithLocalization","This_is_a_design_choice__")()}
          />
        );
      }
      else if (nearFarDisabled) {
        if (stone.config.nearThreshold === null) {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={ Languages.label("ProblemWithLocalization", "You_will_need_to_train_th")()}
              explanation={ Languages.label("ProblemWithLocalization", "Tap_on_the_room__tap_on_t")()}
            />
          );
        }
        else {
          return (
            <DiagSingleButtonGoBack
              visible={this.state.visible}
              header={ Languages.label("ProblemWithLocalization", "Near_further_away_behavio")()}
              explanation={Languages.label("ProblemWithLocalization","Tap_on_the_room__tap_on_t2")()}
            />
          );
        }
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={ Languages.label("ProblemWithLocalization", "Near_further_away_is_conf")()}
            explanation={Languages.label("ProblemWithLocalization","You_can_retrain_where_you")()}
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
          header={ Languages.label("ProblemWithLocalization", "Tap_to_toggle_is_disabled")()}
          explanation={Languages.label("ProblemWithLocalization","You_can_enable_this_in_th2")(Platform.OS === 'android')}
        />
      );
    }

    if (!ldata.tapToToggleCalibration) {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("ProblemWithLocalization", "Tap_to_toggle_is_not_conf")()}
          explanation={Languages.label("ProblemWithLocalization","You_can_enable_this_in_th")(Platform.OS === 'android')}
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
              header={ Languages.label("ProblemWithLocalization", "Tap_to_toggle_is_configur")()}
              explanation={Languages.label("ProblemWithLocalization","If_its_not_working_as_you")(Platform.OS === 'android')}
            />
          );
        }
        else {
          if (Permissions.inSphere(sphereId).editCrownstone) {
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={ Languages.label("ProblemWithLocalization", "Tap_to_toggle_is_disabled_")()}
                explanation={ Languages.label("ProblemWithLocalization", "You_can_enable_it_by_tapp")()}
              />
            );
          }
          else {
            return (
              <DiagSingleButtonGoBack
                visible={this.state.visible}
                header={ Languages.label("ProblemWithLocalization", "Tap_to_toggle_is_disabled_o")()}
                explanation={ Languages.label("ProblemWithLocalization", "You_will_have_to_ask_an_a")()}
              />
            );
          }
        }
      }
      else if (stone.config.type === STONE_TYPES.builtin) {
        return (
          <DiagSingleButton
            visible={this.state.visible}
            header={Languages.label("ProblemWithLocalization","We_dont_generally_recomme")()}
            explanation={ Languages.label("ProblemWithLocalization", "Press_the_button_to_conti")()}
            label={ Languages.label("ProblemWithLocalization", "Continue")()}
            onPress={() => { this._changeContent(() => { this.setState({ stoneTypeWarningRead: true }); }); }}
          />
        );
      }
      else {
        return (
          <DiagSingleButtonGoBack
            visible={this.state.visible}
            header={Languages.label("ProblemWithLocalization","Tap_to_toggle_does_not_wo2")()}
            explanation={Languages.label("ProblemWithLocalization","I_cant_help_you_with_this")()}
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
          header={Languages.label("ProblemWithLocalization","We_have_recently_added_an2")()}
          explanation={ Languages.label("ProblemWithLocalization", "You_can_find_the_Activity")()}
        />
      );
    }
    else {
      return (
        <DiagSingleButtonGoBack
          visible={this.state.visible}
          header={ Languages.label("ProblemWithLocalization", "We_have_recently_added_an")()}
          explanation={ Languages.label("ProblemWithLocalization", "You_can_find_it_in_the_st")()}
        />
      );
    }
    // activity log.
  }

  _handleMultiUser() {
    return (
      <DiagSingleButtonGoBack
        visible={this.state.visible}
        header={ Languages.label("ProblemWithLocalization", "This_is_currently_unavoid")()}
        explanation={ Languages.label("ProblemWithLocalization", "We_are_working_on_new_beh")()}
      />
    );
  }

  _handleWhenDark() {
    return (
      <DiagSingleButtonGoBack
        visible={this.state.visible}
        header={ Languages.label("ProblemWithLocalization", "Only_turn_on_when_dark_wi")()}
        explanation={Languages.label("ProblemWithLocalization","It_will_not_turn_on_at_a_")()}
      />
    );
  }

  _getResults() {
    if (this.state.userInputProblemType === null) {
      return (
        <DiagOptions
          visible={this.state.visible}
          header={Languages.label("ProblemWithLocalization","Whats_wrong_with_the_Loca")()}
          subExplanation={ Languages.label("ProblemWithLocalization", "Scroll_down_to_see_all_op")()}
          labels={[
            Languages.label("ProblemWithLocalization","It_does_not_do_room_level")(),
            Languages.label("ProblemWithLocalization","Room_level_localization_is")(),
            Languages.label("ProblemWithLocalization","Near_far_does_not_work_")(),
            Languages.label("ProblemWithLocalization","Tap_to_toggle_does_not_wo")(),
            Languages.label("ProblemWithLocalization","Things_turn_off_while_Im_")(),
            Languages.label("ProblemWithLocalization","If_I_leave_the_room_but_s")(),
            Languages.label("ProblemWithLocalization","Only_on_when_dark_does_no")(),
            Languages.label("ProblemWithLocalization","Other___")(),
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
          header={ Languages.label("ProblemWithLocalization", "Perhaps_the_Help_menu_can")()}
          explanation={Languages.label("ProblemWithLocalization","Alternatively_you_can_sen")()}
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