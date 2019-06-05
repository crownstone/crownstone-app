import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text, View
} from "react-native";
import { AnimatedBackground }       from '../components/animated/AnimatedBackground'
import { Icon }                     from '../components/Icon'
import { Sphere }                   from './Sphere'
import { LOG }                      from '../../logging/Log'
import {
  availableScreenHeight,
  colors,
  overviewStyles} from "../styles";
import { DfuStateHandler }          from "../../native/firmware/DfuStateHandler";
import { Permissions}               from "../../backgroundProcesses/PermissionManager";
import { FinalizeLocalizationIcon } from "../components/FinalizeLocalizationIcon";
import { SphereChangeButton }       from "./buttons/SphereChangeButton";
import { AddItemButton }            from "./buttons/AddItemButton";
import { SphereUtil }               from "../../util/SphereUtil";
import {SphereLevel}                from "./SphereLevel";
import {ZoomInstructionOverlay}     from "./ZoomInstructionOverlay";
import {Util} from "../../util/Util";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { getStonesAndAppliancesInLocation } from "../../util/DataUtil";
import { PlaceFloatingCrownstonesInRoom } from "../roomViews/PlaceFloatingCrownstonesInRoom";
import { xUtil } from "../../util/StandAloneUtil";
import { AutoArrangeButton } from "./buttons/AutoArrangeButton";
import { RoomAdd } from "../roomViews/RoomAdd";
import { CLOUD } from "../../cloud/cloudAPI";
import { AddCrownstoneButtonDescription } from "./buttons/AddCrownstoneButtonDescription";
import { Navigation } from "react-native-navigation";
import { TopBarUtil } from "../../util/TopBarUtil";
import FastImage from "react-native-fast-image";


const ZOOM_LEVELS = {
  sphere: 'sphere',
  room: 'room'
};

export class SphereOverview extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(core.store.getState(), props, {}, null);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeSetupEvents : any;
  unsubscribeStoreEvents : any;
  viewId;

  constructor(props) {
    super(props);

    this.state = { zoomLevel: ZOOM_LEVELS.room, zoomInstructionsVisible: false, arrangingRooms: false };
    this.viewId = xUtil.getUUID();
    this._setActiveSphere();
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'edit') { NAVBAR_PARAMS_CACHE.edit() }
  }

  componentDidMount() {
    FastImage.preload([{uri:core.background.light},{uri:core.background.detailsDark}])

    // watch for setup stones
    this.unsubscribeSetupEvents = [];
    this.unsubscribeSetupEvents.push(core.eventBus.on("noSetupStonesVisible", () => { this.forceUpdate(); }));

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeSphere) {
        core.store.dispatch({type:"CLEAR_ACTIVE_SPHERE"});
        this._updateNavBar();
        this.setState({zoomLevel: ZOOM_LEVELS.sphere});
        return;
      }


      if (change.changeSpheres) {
        this._setActiveSphere(true);
      }
      else if (change.updateActiveSphere) {
        this._setActiveSphere(false);
      }


      if (
        change.changeMessageState   ||
        change.changeAppSettings    ||
        change.changeSphereState    ||
        change.changeSphereConfig   ||
        change.stoneLocationUpdated ||
        change.updateSphereUser     ||
        change.updateStoneConfig    ||
        change.updateActiveSphere   ||
        change.updateLocationConfig ||
        change.changeFingerprint    ||
        change.changeSpheres        ||
        change.changeStones         ||
        change.changeLocations
      ) {
        this.forceUpdate();
        this._updateNavBar();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
    NAVBAR_PARAMS_CACHE = null;
  }


  _setActiveSphere(updateStore = false) {
    // set the active sphere if needed and setup the object variables.
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;

    let sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name - state.spheres[a].config.name});
    // handle the case where we deleted a sphere that was active.
    if (state.spheres[activeSphere] === undefined) {
      activeSphere = null;
    }
    if (activeSphere === null && sphereIds.length > 0) {
      if (sphereIds.length === 1) {
        core.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: sphereIds[0]}});
      }
      else if (updateStore) {
        let presentSphereId = Util.data.getPresentSphereId(state);
        if (!presentSphereId) {
          core.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: null}});
        }
        else {
          core.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: presentSphereId}});
        }
      }
    }

    this._updateNavBar();
  }


  _updateNavBar() {
    getTopBarProps(core.store.getState(), this.props, this.state, this.viewId);
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }


  _getSphereSelectButton(state, amountOfSpheres, viewingRemotely, activeSphereId) {
    if (this.state.zoomLevel !== ZOOM_LEVELS.sphere) {
      if (amountOfSpheres > 1) {
        return <SphereChangeButton viewingRemotely={viewingRemotely} visible={this.state.arrangingRooms === false} sphereId={activeSphereId} onPress={() => {
          let newState = {zoomLevel: ZOOM_LEVELS.sphere};

          if (state.app.hasZoomedOutForSphereOverview === false) {
            this._getInstructionScreen();
          }

          this.setState(newState, () => { this._updateNavBar(); })
        }}/>
      }
    }
  }


  _getAddButtonDescription(activeSphereId, noCrownstonesYet: boolean) {
    if (this.state.zoomLevel === ZOOM_LEVELS.room) {
      return <AddCrownstoneButtonDescription visible={
        noCrownstonesYet && Permissions.inSphere(activeSphereId).seeSetupCrownstone && this.state.arrangingRooms === false
      } />;
    }
  }


  _getContent(state, amountOfSpheres, activeSphereId) {
    let zoomOutCallback = () => {
      if (!activeSphereId) { return; }
      if (this.state.arrangingRooms === true) { return; }

      if (amountOfSpheres > 1) {
        if (this.state.zoomLevel === ZOOM_LEVELS.room) {
          // tell the app the user has done this and we don't need to tell him any more.
          if (state.app.hasZoomedOutForSphereOverview === false) {
            core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: { hasZoomedOutForSphereOverview: true }});
          }
          this.setState({zoomLevel: ZOOM_LEVELS.sphere}, () => { this._updateNavBar(); });
        }
        else { // this is for convenience, it's not accurate but it'll do
          this.setState({zoomLevel: ZOOM_LEVELS.room}, () => { this._updateNavBar(); });
        }
      }
    };

    let zoomInCallback = () => {
      if (!activeSphereId) { return; }

      if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
        this.setState({zoomLevel: ZOOM_LEVELS.room}, () => { this._updateNavBar(); });
      }
    };

    let setRearrangeRooms = (value) => {
      this.setState({arrangingRooms: value}, () => { this._updateNavBar(); });

    };

    if (this.state.zoomLevel !== ZOOM_LEVELS.sphere && activeSphereId) {
      return (
        <Sphere
          viewId={this.viewId}
          sphereId={activeSphereId}
          multipleSpheres={amountOfSpheres > 1}
          zoomOutCallback={zoomOutCallback}
          setRearrangeRooms={setRearrangeRooms}
          arrangingRooms={this.state.arrangingRooms}
        />
      )
    }
    else {
      return (
        <SphereLevel
          selectSphere={(sphereId) => {
            core.store.dispatch({type:"SET_ACTIVE_SPHERE", data: { activeSphere:sphereId }});

            // request latest location data.
            CLOUD.syncUsers();
            this.setState({zoomLevel:ZOOM_LEVELS.room}, () => {  this._updateNavBar(); });
          }}
          zoomInCallback={zoomInCallback}
          zoomOutCallback={zoomOutCallback}
        />
      );
    }
  }

  _getInstructionScreen() {
    core.eventBus.emit("showCustomOverlay", { content: <ZoomInstructionOverlay /> });
  }

  render() {
    LOG.info("RENDERING_OVERVIEW");
    const state = core.store.getState();

    let amountOfSpheres = Object.keys(state.spheres).length;
    let activeSphereId = state.app.activeSphere;
    let background = core.background.main;

    if (amountOfSpheres > 0) {
      if (!activeSphereId) {
        return (
          <AnimatedBackground image={require("../../images/backgrounds/sphereBackground.png")}>
            { this._getContent(state, amountOfSpheres, activeSphereId) }
          </AnimatedBackground>
        );
      }

      let activeSphere = state.spheres[activeSphereId];
      let sphereIsPresent = activeSphere.state.present;

      let noStones = (activeSphereId ? Object.keys(activeSphere.stones).length    : 0) == 0;
      let noRooms  = (activeSphereId ? Object.keys(activeSphere.locations).length : 0) == 0;

      let viewingRemotely = true;
      if (sphereIsPresent || DfuStateHandler.areDfuStonesAvailable() || (noStones === true && noRooms === true)) {
        viewingRemotely = false;
        background = core.background.main;
      }
      else {
        background = core.background.mainRemoteNotConnected;
      }

      if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
        background = require("../../images/backgrounds/sphereBackground.png");
      }
      else {
        // handle the case where there are no rooms added:
        if (noRooms && Permissions.inSphere(activeSphereId).addRoom) {
          return <RoomAdd sphereId={activeSphereId} returnToRoute={ lang("Main")} height={availableScreenHeight} />
        }

        // retrofit: place all stones in a room.
        let floatingStones = getStonesAndAppliancesInLocation(state, activeSphereId, null);
        if (
          Object.keys(floatingStones).length > 0 &&
          Permissions.inSphere(activeSphereId).moveCrownstone
        ) {
          return <PlaceFloatingCrownstonesInRoom sphereId={activeSphereId} />;
        }

        if (this.state.arrangingRooms) {
          background = require('../../images/backgrounds/blueprintBackgroundGray.png')
        }
      }

      return (
        <AnimatedBackground image={background} hideNotification={this.state.zoomLevel === ZOOM_LEVELS.sphere}>
          { this._getAddButtonDescription(activeSphereId, noStones) }
          { this._getContent(state, amountOfSpheres, activeSphereId) }
          { this._getSphereSelectButton(state, amountOfSpheres, viewingRemotely, activeSphereId) }
          { this._getAddButtonDescription(activeSphereId, noStones) }
          <AddItemButton noCrownstones={noStones} inSphere={this.state.zoomLevel === ZOOM_LEVELS.room} arrangingRooms={this.state.arrangingRooms} sphereId={activeSphereId} viewingRemotely={true }/>
          <AutoArrangeButton arrangingRooms={this.state.arrangingRooms} viewId={this.viewId} />
        </AnimatedBackground>
      );
    }
    else {
      return (
        <AnimatedBackground image={background} hasTopBar={false}>
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="c1-sphere" size={150} color={colors.csBlue.hex}/>
            <Text style={overviewStyles.mainText}>{ lang("No_Spheres_available_") }</Text>
            <Text style={overviewStyles.subText}>{ lang("Press_Edit_in_the_upper_r") }</Text>
          </View>
        </AnimatedBackground>
      );
    }
  }
}

function getTopBarProps(state, props, viewState, viewId) {
  let { sphereId, sphere } = SphereUtil.getActiveSphere(state);
  LOG.info("UPDATING SPHERE OVERVIEW NAV BAR", viewState.zoomLevel === ZOOM_LEVELS.sphere , (sphereId === null && Object.keys(state.spheres).length > 0));
  if (viewState.arrangingRooms === true) {
    NAVBAR_PARAMS_CACHE = {
      title: lang("Move_rooms_around"),
      left:  {id: 'cancel', component:'topbarCancelButton', props: {onPress:() => { core.eventBus.emit("reset_positions" + viewId); }}},
      right: {id: 'save',   component:'topbarButton',       props: {onPress:() => { core.eventBus.emit("save_positions" + viewId);  }, text:lang("Save")}}
    }
  }
  else if (viewState.zoomLevel === ZOOM_LEVELS.sphere || (sphereId === null && Object.keys(state.spheres).length > 0)) {
    NAVBAR_PARAMS_CACHE = {
      title: lang("Sphere_Overview"),
      left: null,
      right: null,
    }
  }
  else {
    if (sphereId === null) {
      NAVBAR_PARAMS_CACHE = {
        title: lang("Hello_there_"),
        edit: () => { NavigationUtil.launchModal( "SphereEdit", {sphereId:sphereId})},
      }
    }
    else {
      let finalizeLocalization = SphereUtil.finalizeLocalizationData(state);

      NAVBAR_PARAMS_CACHE = {
        title: sphere.config.name,
        left: finalizeLocalization.showItem ?
          {id: 'localization', component:'topbarLeftButton', props: {item: <FinalizeLocalizationIcon />, onPress:finalizeLocalization.action}} :
          null,
        edit: () => { NavigationUtil.launchModal( "SphereEdit", {sphereId:sphereId})},
      }
    }
  }
  return NAVBAR_PARAMS_CACHE;
}


let NAVBAR_PARAMS_CACHE = null;

