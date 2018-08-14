import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
import {LOG} from "../logging/Log";
import {eventBus} from "./EventBus";
import {Permissions} from "../backgroundProcesses/PermissionManager";
import {
  enoughCrownstonesForIndoorLocalization,
  enoughCrownstonesInLocationsForIndoorLocalization,
  requireMoreFingerprints
} from "./DataUtil";
const Actions = require('react-native-router-flux').Actions;

export const SphereUtil = {

  getActiveSphere: function(state) {
    let sphereIds = Object.keys(state.spheres);
    let amountOfSpheres = sphereIds.length;

    if (amountOfSpheres === 0) {  return { sphereId: null, sphere: null }; }

    let activeSphereId = state.app.activeSphere;
    if (!activeSphereId) { activeSphereId = sphereIds[0]; }
    let activeSphere = state.spheres[activeSphereId];

    return { sphereId: activeSphereId, sphere: activeSphere }
  },

  finalizeLocalizationData: function(state) {
    let { sphereId, sphere } = SphereUtil.getActiveSphere(state);

    if (sphereId === null) { return { showItem: false, action: () => {} } }

    let sphereIsPresent = sphere.state.present;

    // are there enough in total?
    let enoughCrownstonesForLocalization = enoughCrownstonesForIndoorLocalization(state, sphereId);

    // do we need more fingerprints?
    let requiresFingerprints = requireMoreFingerprints(state, sphereId);

    let noRooms = (sphereId ? Object.keys(sphere.locations).length : 0) == 0;

    let spherePermissions = Permissions.inSphere(sphereId);

    let showFinalizeIndoorNavigationButton = (
      state.app.indoorLocalizationEnabled &&
      spherePermissions.doLocalizationTutorial &&
      sphereIsPresent === true && // only show this if you're there.
      enoughCrownstonesForLocalization === true && // Have 4 or more crownstones
      (noRooms === true || requiresFingerprints === true)  // Need more fingerprints.
    );

    let showFinalizeIndoorNavigationCallback = () => {
      if (!sphereIsPresent) {
        Alert.alert(
          "You'll have to be in the Sphere to continue.",
          "If you're in range of any of the Crownstones in the sphere, the background will turn blue and you can start teaching your house to find you!",
          [{text: 'OK'}]
        );
      }
      else if (noRooms) {
        Alert.alert(
          "Let's create some rooms!",
          "Tap the icon on the bottom-right to add a room!",
          [{text: 'OK'}]
        );
      }
      else if (enoughCrownstonesInLocationsForIndoorLocalization(state, sphereId)) {
        eventBus.emit("showLocalizationSetupStep2", sphereId);
      }
      else {
        Actions.roomOverview({
          sphereId: sphereId,
          locationId: null,
          title: 'First things first :)',
          hideRight: true,
          usedForIndoorLocalizationSetup: true,
          overlayText: 'Place your Crownstones in rooms!',
          explanation: "Tap a Crownstone to see it's details, then tap 'Not in room' in the top-left corner!"
        });
      }
    };

    return {
      showItem: showFinalizeIndoorNavigationButton,
      action: showFinalizeIndoorNavigationCallback
    }

  },

  newMailAvailable: function(state) {
    let { sphereId, sphere } = SphereUtil.getActiveSphere(state);
    if (sphereId && sphere) {
      return sphere.state.newMessageFound
    }
    return false;
  }

}