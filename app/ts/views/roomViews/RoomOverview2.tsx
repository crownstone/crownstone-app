//
// import { Languages } from "../../Languages"
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("RoomOverview", key)(a,b,c,d,e);
// }
// import * as React from 'react';
// import { Alert, ScrollView, View} from "react-native";
//
// import {
//   enoughCrownstonesInLocationsForIndoorLocalization
// } from "../../util/DataUtil";
// import {
//   styles,
//   colors,
//   screenWidth
// } from "../styles";
// import { DfuDeviceEntry }         from '../components/deviceEntries/DfuDeviceEntry';
// import { RoomExplanation }        from '../components/RoomExplanation';
// import { Permissions }            from "../../backgroundProcesses/PermissionManager";
// import { SphereDeleted }          from "../static/SphereDeleted";
// import { RoomDeleted }            from "../static/RoomDeleted";
// import { LiveComponent }          from "../LiveComponent";
// import { core } from "../../Core";
// import { NavigationUtil } from "../../util/navigation/NavigationUtil";
// import { TopBarUtil } from "../../util/TopBarUtil";
// import { xUtil } from "../../util/StandAloneUtil";
// import { Background } from "../components/Background";
// import { SetupDeviceEntry } from "../components/deviceEntries/SetupDeviceEntry";
// import { STONE_TYPES } from "../../Enums";
// import { HubEntry } from "../components/deviceEntries/HubEntry";
// import { FadeInView } from "../components/animated/FadeInView";
// import { RoomUtil } from "../../util/RoomUtil";
// import { DeviceEntry2 } from "../components/deviceEntries/DeviceEntry2";
//
//
//
// export class RoomOverview2 extends LiveComponent<any, { switchView: boolean, scrollEnabled: boolean }> {
//   static options(props) {
//     getTopBarProps(core.store.getState(), props, true);
//     return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
//   }
//
//   unsubscribeStoreEvents : any;
//   unsubscribeSetupEvents : any;
//   viewingRemotely : boolean;
//   viewingRemotelyInitial : boolean;
//   justFinishedSetup : any;
//   pictureTaken : any = null;
//   nearestStoneIdInSphere : any;
//   nearestStoneIdInRoom : any;
//
//   constructor(props) {
//     super(props);
//
//     this.unsubscribeSetupEvents = [];
//
//     this.viewingRemotely = true;
//     this.justFinishedSetup = "";
//
//     this.nearestStoneIdInSphere = undefined;
//     this.nearestStoneIdInRoom = undefined;
//
//     let state = core.store.getState();
//     const sphere = state.spheres[this.props.sphereId];
//     if (sphere) {
//       this.viewingRemotely = sphere.state.present === false;
//     }
//
//     this.state = {
//       switchView: false,
//       scrollEnabled: true
//     };
//
//     this.viewingRemotelyInitial = this.viewingRemotely;
//
//     this._updateNavBar();
//   }
//
//   navigationButtonPressed({ buttonId }) {
//     if (buttonId === 'edit')  { NavigationUtil.launchModal( "RoomEdit",{ sphereId: this.props.sphereId, locationId: this.props.locationId }); }
//     if (buttonId === 'train') {
//       if (core.store.getState().app.indoorLocalizationEnabled === false) {
//         Alert.alert(
// lang("_Indoor_localization_is_c_header"),
// lang("_Indoor_localization_is_c_body"),
// [{text: lang("_Indoor_localization_is_c_left") }]);
//         return
//       }
//
//       if (this.viewingRemotely === true) {
//         Alert.alert(
//           lang("_Youre_not_in_the_Sphere__header"),
//           lang("_Youre_not_in_the_Sphere__body"),
//           [{ text: lang("_Youre_not_in_the_Sphere__left") }])
//         return
//       }
//
//       const store = core.store;
//       const state = store.getState();
//       const room  = state.spheres[this.props.sphereId].locations[this.props.locationId];
//       if (room && room.config.fingerprintRaw) {
//         Alert.alert(
//           lang("_Retrain_Room__Only_do_th_header"),
//           lang("_Retrain_Room__Only_do_th_body"),
//           [{text: lang("_Retrain_Room__Only_do_th_left"), style: 'cancel'},
//             {
//               text: lang("_Retrain_Room__Only_do_th_right"), onPress: () => { NavigationUtil.launchModal( "RoomTraining_roomSize",{sphereId: this.props.sphereId, locationId: this.props.locationId}); }}
//           ])
//       }
//     }
//   }
//
//
//   componentDidMount() {
//     this.unsubscribeSetupEvents.push(core.eventBus.on("dfuStoneChange",   (handle) => { this.forceUpdate(); }));
//     this.unsubscribeSetupEvents.push(core.eventBus.on("setupStoneChange", (handle) => { this.forceUpdate(); }));
//     this.unsubscribeSetupEvents.push(core.eventBus.on("setupComplete",    (handle) => {
//       this.forceUpdate();
//     }));
//
//     this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
//       let change = data.change;
//
//       if (change.removeLocation && change.removeLocation.locationIds[this.props.locationId] ||
//           change.removeSphere   && change.removeSphere.sphereIds[this.props.sphereId]) {
//           return this.forceUpdate()
//       }
//       if (
//         (change.updateStoneConfig)      ||
//         (change.updateActiveSphere)     ||
//         (change.changeFingerprint)      ||
//         (change.userPositionUpdate      && change.userPositionUpdate.locationIds[this.props.locationId])   ||
//         (change.updateLocationConfig    && change.updateLocationConfig.locationIds[this.props.locationId]) ||
//         (change.changeSphereUsers       && change.changeSphereUsers.sphereIds[this.props.sphereId])        ||
//         (change.changeStoneAvailability && change.changeStoneAvailability.sphereIds[this.props.sphereId])  ||
//         (change.changeStoneRSSI         && change.changeStoneRSSI.sphereIds[this.props.sphereId])          ||
//         (change.stoneUsageUpdated       && change.stoneUsageUpdated.sphereIds[this.props.sphereId])        ||
//         (change.changeSphereState       && change.changeSphereState.sphereIds[this.props.sphereId])        ||
//         (change.stoneLocationUpdated    && change.stoneLocationUpdated.sphereIds[this.props.sphereId])     ||
//         (change.changeHubs)      ||
//         (change.changeStones)
//       ) {
//         this.forceUpdate();
//         this._updateNavBar();
//         return;
//       }
//     });
//   }
//
//   componentWillUnmount() {
//     this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
//     this.unsubscribeStoreEvents();
//
//     // we keep open a connection for a few seconds to await a second command
//     NAVBAR_PARAMS_CACHE = null;
//   }
//
//   _renderer(item, index, id) {
//     if (item.type === 'dfuStone') {
//       return (
//         <View key={id + '_dfu_entry'}>
//         <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
//           <DfuDeviceEntry
//             key={id + '_dfu_element'}
//             sphereId={this.props.sphereId}
//             handle={item.advertisement && item.advertisement.handle}
//             name={item.data && item.data.name}
//             stoneId={item.data && item.data.id}
//           />
//         </View>
//       </View>
//       )
//     }
//     else if (item.type === 'setupStone') {
//       return (
//         <View key={id + '_setup_entry'}>
//           <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
//             <SetupDeviceEntry
//               key={id + '_setup_element'}
//               sphereId={this.props.sphereId}
//               handle={item.handle}
//               item={item}
//               restore={true}
//               callback={() => {
//                 if (item.deviceType === STONE_TYPES.hub) {
//                   NavigationUtil.launchModal(
//                     "SetupHub",
//                     {
//                       sphereId: this.props.sphereId,
//                       setupItem: item,
//                       restoration: true
//                     });
//                 }
//                 else {
//                   NavigationUtil.launchModal(
//                     "SetupCrownstone",
//                     {
//                       sphereId: this.props.sphereId,
//                       setupItem: item,
//                       restoration: true
//                   });
//                 }
//               }}
//             />
//           </View>
//         </View>
//       )
//     }
//     else if (item.type === 'stone' && item.data.config.type === STONE_TYPES.hub) {
//       return (
//         <View key={id + '_entry'}>
//           <HubEntry
//             sphereId={this.props.sphereId}
//             stoneId={id}
//             viewingRemotely={this.viewingRemotely}
//             setSwitchView={(value) => { this.setState({switchView: value })}}
//             switchView={this.state.switchView}
//             nearestInSphere={id === this.nearestStoneIdInSphere}
//             nearestInRoom={id === this.nearestStoneIdInRoom}
//             toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
//           />
//         </View>
//       );
//     }
//     else if (item.type === 'stone') {
//       return (
//         <View key={id + '_entry'}>
//           <DeviceEntry2
//             sphereId={this.props.sphereId}
//             stoneId={id}
//             viewingRemotely={this.viewingRemotely}
//             setSwitchView={(value) => { this.setState({switchView: value })}}
//             switchView={this.state.switchView}
//             nearestInSphere={id === this.nearestStoneIdInSphere}
//             nearestInRoom={id === this.nearestStoneIdInRoom}
//             toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
//           />
//         </View>
//       );
//     }
//     else if (item.type === 'hub') {
//       return (
//         <View key={id + '_entry'}>
//           <HubEntry
//             sphereId={this.props.sphereId}
//             hubId={id}
//             viewingRemotely={this.viewingRemotely}
//             setSwitchView={(value) => { this.setState({switchView: value })}}
//             switchView={this.state.switchView}
//             toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
//           />
//         </View>
//       );
//     }
//   }
//
//
//
//   _updateNavBar() {
//     getTopBarProps(core.store.getState(), this.props, this.viewingRemotely);
//     Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
//   }
//
//
//   render() {
//     const store = core.store;
//     const state = store.getState();
//     const sphere = state.spheres[this.props.sphereId];
//     if (!sphere) { return <SphereDeleted/> }
//     let location = sphere.locations[this.props.locationId];
//     if (!location) {
//       return <RoomDeleted/>
//     }
//
//     let backgroundImage = null;
//     if (location.config.picture) {
//       backgroundImage = { uri: xUtil.preparePictureURI(location.config.picture) };
//     }
//
//     let {itemArray, ids} = RoomUtil.getItemsInLocation(this.props.sphereId, this.props.locationId);
//
//     let items = [];
//     for (let i = 0; i < itemArray.length; i++) {
//       items.push(this._renderer(itemArray[i],i,ids[i]));
//     }
//
//     return (
//       <Background image={backgroundImage} hideNotifications={true}>
//         <ScrollView scrollEnabled={this.state.scrollEnabled}>
//           <View style={{width:screenWidth}}>
//             <RoomExplanation
//               state={state}
//               explanation={ this.props.explanation }
//               sphereId={    this.props.sphereId }
//               locationId={  this.props.locationId }
//             />
//             { items }
//             <View style={{height:80}} />
//           </View>
//         </ScrollView>
//         <FadeInView
//           visible={this.state.switchView}
//           style={{position:'absolute', bottom:0, width:screenWidth, height:60, alignItems:'center', justifyContent:'center'}}
//           height={80}
//           pointerEvents={'none'}
//         >
//         </FadeInView>
//       </Background>
//     );
//   }
// }
//
//
//
// function getTopBarProps(state, props, viewingRemotely) {
//   let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(props.sphereId);
//   let sphere = state.spheres[props.sphereId];
//   if (!sphere) { return }
//   let location = sphere.locations[props.locationId];
//   if (!location) { return }
//
//   let title = location.config.name;
//
//   NAVBAR_PARAMS_CACHE = { title: title }
//
//   let spherePermissions = Permissions.inSphere(props.sphereId);
//
//   if (spherePermissions.editRoom === true) {
//     NAVBAR_PARAMS_CACHE["edit"] = true;
//   }
//   else if (spherePermissions.editRoom === false && enoughCrownstonesInLocations === true) {
//     NAVBAR_PARAMS_CACHE["nav"] = {id:'train',text:'Train'};
//   }
//
//   return NAVBAR_PARAMS_CACHE;
// }
//
// let NAVBAR_PARAMS_CACHE : topbarOptions = null;
//
//
//
