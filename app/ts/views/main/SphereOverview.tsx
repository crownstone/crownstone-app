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
  availableScreenHeight, background,
  colors,
  overviewStyles, styles
} from "../styles";
import { Permissions}               from "../../backgroundProcesses/PermissionManager";
import { SphereChangeButton }       from "./buttons/SphereChangeButton";
import { AddItemButton }            from "./buttons/AddItemButton";
import { SphereUtil }               from "../../util/SphereUtil";
import {SphereLevel}                from "./SphereLevel";
import {ZoomInstructionOverlay, ZoomInstructionsFooter} from "./ZoomInstructionOverlay";
import { core }                     from "../../Core";
import { NavigationUtil }           from "../../util/navigation/NavigationUtil";
import { PlaceFloatingCrownstonesInRoom } from "../roomViews/PlaceFloatingCrownstonesInRoom";
import { xUtil }                    from "../../util/StandAloneUtil";
import { AutoArrangeButton }        from "./buttons/AutoArrangeButton";
import { CLOUD }                    from "../../cloud/cloudAPI";
import { AddCrownstoneButtonDescription } from "./buttons/AddCrownstoneButtonDescription";
import { TopBarUtil }               from "../../util/TopBarUtil";
import { DataUtil }                 from "../../util/DataUtil";
import { RoomAddCore }              from "../roomViews/RoomAddCore";
import { Background }               from "../components/Background";
import { SmartHomeStateButton }     from "./buttons/SmartHomeStateButton";
import { ActiveSphereManager }      from "../../backgroundProcesses/ActiveSphereManager";
import { BackButtonHandler }        from "../../backgroundProcesses/BackButtonHandler";
import { DebugToolsButton }         from "./buttons/DebugToolsButton";
import { LocalizationButton }       from "./buttons/LocalizationButton";
import { SafeAreaView }             from "react-native-safe-area-context";
import { Navigation }               from "react-native-navigation";
import { SideBarView } from "../components/animated/SideBarView";
import { SphereOverviewSideBar } from "../sidebars/SphereOverviewSideBar";


const ZOOM_LEVELS = {
  sphere: 'sphere',
  room: 'room'
};

export const SPHERE_ID_STORE = {
  activeSphereId: null
}


export class SphereOverview extends LiveComponent<any, any> {
  static options(props) {
    return {topBar:{visible:false}}
    // getTopBarProps(core.store.getState(), props, {});
    // return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeEvents : any;
  unsubscribeSetupEvents : any;
  unsubscribeStoreEvents : any;
  viewId;

  constructor(props) {
    super(props);

    this.state = { zoomLevel: ZOOM_LEVELS.room, zoomInstructionsVisible: false, arrangingRooms: false };
    this.viewId = xUtil.getUUID();
    ActiveSphereManager.updateActiveSphere();

  }

  // navigationButtonPressed({ buttonId }) {
  //   if (buttonId === 'edit') {
  //     let { sphereId, sphere } = SphereUtil.getActiveSphere(core.store.getState());
  //     NavigationUtil.launchModal( "SphereEdit", { sphereId: sphereId })
  //   }
  //   if (buttonId === 'save')   { core.eventBus.emit("save_positions" + this.viewId);  }
  //   if (buttonId === 'cancel') { core.eventBus.emit("reset_positions" + this.viewId); }
  //   if (buttonId === 'localization') { SphereUtil.finalizeLocalizationData(core.store.getState()).action() }
  // }

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];
    this.unsubscribeEvents = [];
    this.unsubscribeSetupEvents.push(core.eventBus.on("noSetupStonesVisible", () => { this.forceUpdate(); }));

    this.unsubscribeEvents.push(core.eventBus.on("onScreenNotificationsUpdated", () => { this.forceUpdate(); }));
    this.unsubscribeEvents.push(core.eventBus.on("VIEW_SPHERES", this._zoomOut));

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeSphere) {
        ActiveSphereManager.clearActiveSphere();
        this._updateNavBar();
        this.setState({zoomLevel: ZOOM_LEVELS.sphere});
        return;
      }


      if (
        change.changeUserDeveloperStatus     ||
        change.changeAppSettings             ||
        change.changeSphereState             ||
        change.changeSphereConfig            ||
        change.hubLocationUpdated            ||
        change.stoneLocationUpdated          ||
        change.updateStoneCoreConfig         ||
        change.changeSphereSmartHomeState    ||
        change.updateSphereUser              ||
        change.changeStones                  ||
        change.changeHubs                    ||
        change.updateActiveSphere            ||
        change.updateLocationConfig          ||
        change.changeFingerprint             ||
        change.changeSpheres                 ||
        change.changeLocations
      ) {
        this.forceUpdate();
        this._updateNavBar();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
    NAVBAR_PARAMS_CACHE = null;
  }



  _updateNavBar() {
    getTopBarProps(core.store.getState(), this.props, this.state);
    // Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE, {clearEmptyButtons:true}))
  }


  // _getSphereSelectButton(state, amountOfSpheres, activeSphereId) {
  //   if (this.state.zoomLevel !== ZOOM_LEVELS.sphere) {
  //     if (amountOfSpheres > 1) {
  //       return <SphereChangeButton visible={this.state.arrangingRooms === false} sphereId={activeSphereId} onPress={() => {
  //         let newState = {zoomLevel: ZOOM_LEVELS.sphere};
  //
  //         if (state.app.hasZoomedOutForSphereOverview === false) {
  //           this._getInstructionScreen();
  //         }
  //
  //         this.setState(newState, () => { this._updateNavBar(); })
  //       }}/>
  //     }
  //   }
  // }
  //
  //
  // _getAddButtonDescription(activeSphereId, noCrownstonesYet: boolean) {
  //   if (this.state.zoomLevel === ZOOM_LEVELS.room) {
  //     return <AddCrownstoneButtonDescription visible={
  //       noCrownstonesYet && Permissions.inSphere(activeSphereId).seeSetupCrownstone && this.state.arrangingRooms === false
  //     } />;
  //   }
  // }

  _zoomIn = () => {
    const state = core.store.getState();
    let activeSphereId = state.app.activeSphere;

    if (!activeSphereId) { return; }

    NavigationUtil.setTabBarOptions(colors.blue.hex, colors.csBlue.hex);
    if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
      this.setState({zoomLevel: ZOOM_LEVELS.room}, () => { this._updateNavBar(); });
    }
  }

  _zoomOut = () => {
    const state = core.store.getState();
    let activeSphereId = state.app.activeSphere;
    let amountOfSpheres = Object.keys(state.spheres).length;

    if (!activeSphereId) { return; }
    if (this.state.arrangingRooms === true) { return; }

    if (amountOfSpheres > 1) {
      if (this.state.zoomLevel === ZOOM_LEVELS.room) {
        // tell the app the user has done this and we don't need to tell him any more.
        if (state.app.hasZoomedOutForSphereOverview === false) {
          core.store.dispatch({type: "UPDATE_APP_SETTINGS", data: { hasZoomedOutForSphereOverview: true }});
        }
        NavigationUtil.setTabBarOptions(colors.csOrange.hex, colors.white.hex);
        this.setState({zoomLevel: ZOOM_LEVELS.sphere}, () => { this._updateNavBar(); });
      }
      else { // this is for convenience, it's not accurate but it'll do
        this._zoomIn()
      }
    }
  }


  _getContent(activeSphereId) {
    let setRearrangeRooms = (value) => {
      if (value === true) {
        BackButtonHandler.override(this.props.componentId, () => {
          core.eventBus.emit("reset_positions" + this.viewId);
        });
        NavigationUtil.setTabBarOptions(colors.csOrange.hex, colors.white.hex);

      }
      else {
        BackButtonHandler.clearOverride(this.props.componentId);
        NavigationUtil.setTabBarOptions(colors.blue.hex, colors.csBlue.hex);
      }
      this.setState({arrangingRooms: value}, () => { this._updateNavBar(); });
    };

    if (this.state.zoomLevel !== ZOOM_LEVELS.sphere && activeSphereId) {
      return (
        <Sphere
          viewId={this.viewId}
          sphereId={activeSphereId}
          zoomOutCallback={this._zoomOut}
          setRearrangeRooms={setRearrangeRooms}
          arrangingRooms={this.state.arrangingRooms}
        />
      )
    }
    else {
      return (
        <SphereLevel
          selectSphere={(sphereId) => {
            ActiveSphereManager.setActiveSphere(sphereId);

            // request latest location data.
            CLOUD.syncUsers();
            this._zoomIn();
          }}
          zoomInCallback={this._zoomIn}
          zoomOutCallback={this._zoomOut}
        />
      );
    }
  }

  _getInstructionScreen() {
    core.eventBus.emit("showCustomOverlay", { content: <ZoomInstructionOverlay />, footer: <ZoomInstructionsFooter /> });
  }

  getContent() {
    const state = core.store.getState();
    let amountOfSpheres = Object.keys(state.spheres).length;
    let activeSphereId = state.app.activeSphere;
    let backgroundOverride = background.main;

    LOG.info("RENDERING_OVERVIEW", activeSphereId);
    if (amountOfSpheres > 0) {
      if (!activeSphereId) {
        return (
          <AnimatedBackground image={require("../../../assets/images/backgrounds/sphereBackground.jpg")}>
            { this._getContent(activeSphereId) }
          </AnimatedBackground>
        );
      }

      let activeSphere = state.spheres[activeSphereId];
      SPHERE_ID_STORE.activeSphereId = activeSphereId;
      let noStones = (activeSphereId ? Object.keys(activeSphere.stones).length    : 0) == 0;
      let noRooms  = (activeSphereId ? Object.keys(activeSphere.locations).length : 0) == 0;

      backgroundOverride = background.main;

      if (this.state.zoomLevel === ZOOM_LEVELS.sphere) {
        SPHERE_ID_STORE.activeSphereId = null;
        backgroundOverride = require("../../../assets/images/backgrounds/darkBackground3.jpg");
      }
      else {
        // handle the case where there are no rooms added:
        if (noRooms && Permissions.inSphere(activeSphereId).addRoom) {
          return (
            <Background hideNotifications={true} image={background.main} testID={"SphereOverview_addRoom"}>
              <RoomAddCore sphereId={activeSphereId} returnToRoute={ lang("Main") } height={availableScreenHeight} />
            </Background>
          )
        }

        // retrofit: place all stones in a room.
        let floatingStones = DataUtil.getStonesInLocation(state, activeSphereId, null);
        let floatingHubs   = DataUtil.getHubsInLocation(state, activeSphereId, null);
        if (
          (Object.keys(floatingHubs).length > 0 || Object.keys(floatingStones).length > 0) &&
          Permissions.inSphere(activeSphereId).moveCrownstone
        ) {
          return <PlaceFloatingCrownstonesInRoom sphereId={activeSphereId} />;
        }

        if (this.state.arrangingRooms) {
          backgroundOverride = require('../../../assets/images/backgrounds/darkBackground3.jpg')
          // backgroundOverride = require('../../../assets/images/backgrounds/arranging.jpg')
        }
      }

      SPHERE_ID_STORE.activeSphereId = activeSphereId;

      return (
        <AnimatedBackground
          image={backgroundOverride}
          lightStatusbar={this.state.zoomLevel === ZOOM_LEVELS.sphere || this.state.arrangingRooms}
          hideNotifications={this.state.zoomLevel === ZOOM_LEVELS.sphere}
          hideOrangeLine
          hasTopBar={false}
          testID={"SphereOverview"}
        >
          <SafeAreaView style={{flexGrow:1}}>
            <View style={{flex:1}}>
              {/*{ this._getAddButtonDescription(activeSphereId, noStones) }*/}
              { this._getContent(activeSphereId) }
              {/*{ this._getSphereSelectButton(state, amountOfSpheres,  activeSphereId) }*/}
              {/*{ this._getAddButtonDescription(activeSphereId, noStones) }*/}
              {/*<AddItemButton     noCrownstones={noStones} inSphere={this.state.zoomLevel === ZOOM_LEVELS.room} arrangingRooms={this.state.arrangingRooms} sphereId={activeSphereId} />*/}
              <AutoArrangeButton arrangingRooms={this.state.arrangingRooms} viewId={this.viewId} />
              {/*<LocalizationButton*/}
              {/*  sphereId={activeSphereId}*/}
              {/*  visible={!this.state.arrangingRooms && this.state.zoomLevel === ZOOM_LEVELS.room && noStones === false }*/}
              {/*/>*/}
              {/*{ activeSphere.state.smartHomeEnabled === false &&  <SmartHomeStateButton sphereId={activeSphereId} visible={true} /> }*/}
              {/*<DebugToolsButton inSphere={this.state.zoomLevel === ZOOM_LEVELS.room} arrangingRooms={this.state.arrangingRooms} sphereId={activeSphereId} />*/}
            </View>
          </SafeAreaView>
        </AnimatedBackground>
      );
    }
    else {
      return (
        <AnimatedBackground image={backgroundOverride} testID={"SphereOverview_noSphere"}>
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="c1-sphere" size={150} color={colors.csBlue.hex}/>
            <Text style={overviewStyles.mainText}>{ lang("No_Spheres_available_") }</Text>
            <Text style={overviewStyles.subText}>{ lang("Press_Edit_in_the_upper_r") }</Text>
          </View>
        </AnimatedBackground>
      );
    }
  }


  render() {
    return (
      <SideBarView
        content={this.getContent()}
        sideMenu={<SphereOverviewSideBar />}
      />
    )
  }
}

function getTopBarProps(state, props, viewState) {
  let { sphereId, sphere } = SphereUtil.getActiveSphere(state);
  LOG.info("UPDATING SPHERE OVERVIEW NAV BAR", viewState.zoomLevel === ZOOM_LEVELS.sphere , (sphereId === null && Object.keys(state.spheres).length > 0));
  if (viewState.arrangingRooms === true) {
    NAVBAR_PARAMS_CACHE = {
      title: lang("Move_rooms_around"),
      cancel: true,
      save:   true,
    }
  }
  else if (viewState.zoomLevel === ZOOM_LEVELS.sphere || (sphereId === null && Object.keys(state.spheres).length > 0)) {
    NAVBAR_PARAMS_CACHE = {
      title: lang("Sphere_Overview"),
      disableBack: true,
    }
  }
  else {
    if (sphereId === null) {
      NAVBAR_PARAMS_CACHE = {
        title: lang("Hello_there_"),
        edit: true
      }
    }
    else {
      NAVBAR_PARAMS_CACHE = {
        title: sphere.config.name,
        edit: true,
      }
    }
  }

  return NAVBAR_PARAMS_CACHE;
}


let NAVBAR_PARAMS_CACHE : topbarOptions = null;

