import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEdit", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


import {styles, colors, } from '../styles'
import { BleUtil } from '../../util/BleUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {LOG, LOGe} from '../../logging/Log'
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import { INTENTS } from "../../native/libInterface/Constants";

import {SphereDeleted} from "../static/SphereDeleted";
import {StoneDeleted} from "../static/StoneDeleted";
import { STONE_TYPES } from "../../Enums";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { TopBarUtil } from "../../util/TopBarUtil";
import { OverlayUtil } from "../overlays/OverlayUtil";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";
import { SortingManager } from "../../logic/SortingManager";
import { DataUtil } from "../../util/DataUtil";


export class DeviceEdit extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Edit_Crownstone"), cancelModal: true, save: true});
  }

  deleting : boolean = false;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    const store = core.store;
    const state = store.getState();
    const stone = state.spheres?.[this.props.sphereId]?.stones?.[this.props.stoneId];
    if (stone) {
      this.state = {
        stoneName: stone.config.name,
        description: stone.config.description,
        stoneIcon: stone.config.icon,
        locationId: stone.config.locationId,

        refreshingStoneVersions: false
      };
    }

  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'save') {  this._updateCrownstone(); }
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();

      // in case the sphere is deleted
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }

      if (
        change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId]
      ) {
        if (this.deleting === false) {
          this.forceUpdate();
        }
      }
    });
  }


  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  constructStoneOptions(stone, state) {
    let items = [];
    let locations = state.spheres[this.props.sphereId].locations;
    let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.hubId);

    items.push({label: hub ? "HUB SETTINGS" : lang("CROWNSTONE"), type: 'explanation', below: false});

    items.push({
      label: lang("Name"),
      type: 'textEdit',
      placeholder:lang("Pick_a_name"),
      value: this.state.stoneName,
      callback: (newText) => {
        this.setState({stoneName: newText})
      }
    });
    items.push({
      label: lang("Description"),
      type: 'textEdit',
      placeholder:lang("Optional"),
      value: this.state.description,
      callback: (newText) => {
        this.setState({description: newText})
      }
    });

    // icon picker
    items.push({
      label: lang("Icon"),
      type: 'icon',
      value: this.state.stoneIcon,
      callback: () => {
        NavigationUtil.navigate( "DeviceIconSelection",{
          icon: this.state.stoneIcon,
          callback: (newIcon) => {
            this.setState({stoneIcon: newIcon})
          }
        })
      }
    });


    let location = locations[this.state.locationId];
    let locationLabel = lang("Not_in_a_room");
    if (location !== undefined) {
      locationLabel = location.config.name;
    }
    locationLabel += lang("__tap_to_change_")

    items.push({label: hub ? "HUB IS IN ROOM" : lang("CROWNSTONE_IS_IN_ROOM"), type: 'explanation', below: false});
    items.push({
      label: locationLabel,
      mediumIcon:  <IconButton name="md-cube" size={25} buttonSize={38}  color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />,
      type:  'button',
      style: {color: colors.blue.hex},
      callback: () => {
        OverlayUtil.callRoomSelectionOverlay(this.props.sphereId, (roomId) => {
          this.setState({locationId: roomId})
        })
      }
    });

    if (Permissions.inSphere(this.props.sphereId).removeCrownstone) {
      items.push({label: lang("DANGER"), type: 'explanation', below: false});
      items.push({
        label: lang("Remove_from_Sphere"),
        mediumIcon: <IconButton name="ios-trash" size={26} buttonSize={38}  color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: () => {
          if (hub) {
            Alert.alert(
              "Are you sure you want to delete this hub?",
              "This cannot be undone!",
              [{text: "Delete", onPress: async () => {
                Alert.alert("TODO")
                // TODO: delete hub via rest/ble.
                // TODO: rest is not implemented yet.
            }, style: 'destructive'},{text:lang("Cancel"),style: 'cancel'}])
          }
          else {
            core.eventBus.emit('hideLoading');
            Alert.alert(
              lang("_Are_you_sure___Removing__header"),
              lang("_Are_you_sure___Removing__body"),
              [{text: lang("_Are_you_sure___Removing__left"), style: 'cancel'}, {
                text: lang("_Are_you_sure___Removing__right"), style:'destructive', onPress: () => {
                  if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
                    Alert.alert(lang("Cant_see_this_one_"),
                      lang("This_Crownstone_has_not_b"),
                      [{text:lang("Delete_anyway"), onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
                        {text:lang("Cancel"),style: 'cancel', onPress: () => {}}]
                    )
                  }
                  else {
                    core.eventBus.emit('showLoading', lang("Looking_for_the_Crownston"));
                    this._removeCrownstone(stone).catch((err) => {});
                  }
                }}]
            )
          }
        }
      });
      items.push({label: lang("Removing_this_Crownstone_"),  type:'explanation', below:true});
    }

    return items;
  }


  _removeCrownstone(stone) {
    return new Promise((resolve, reject) => {
      BleUtil.detectCrownstone(stone.config.handle)
        .then((isInSetupMode) => {
          // if this crownstone is broadcasting but in setup mode, we only remove it from the cloud.
          if (isInSetupMode === true) {
            this._removeCloudOnly();
          }
          this._removeCloudReset(stone);
        })
        .catch((err) => {
          core.eventBus.emit('hideLoading');
          Alert.alert(
            lang("_Cant_see_this_one___We_c_header"),
            lang("_Cant_see_this_one___We_c_body"),
            [{text:lang("_Cant_see_this_one___We_c_left"), onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
              {text:lang("_Cant_see_this_one___We_c_right"), style: "cancel", onPress: () => {}}])})
    })
  }


  _removeCloudOnly() {
    core.eventBus.emit('showLoading', lang("Removing_the_Crownstone_fr"));
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .catch((err) => {
        return new Promise((resolve, reject) => {
          if (err && err.status === 404) {
            resolve();
          }
          else {
            LOGe.info("COULD NOT DELETE IN CLOUD", err);
            reject();
          }
        })
      })
      .then(() => {
        this._removeCrownstoneFromRedux(false);
      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err);
        core.eventBus.emit('hideLoading');
        Alert.alert(
          lang("_Encountered_Cloud_Issue__header"),
          lang("_Encountered_Cloud_Issue__body"),
          [{text:lang("_Encountered_Cloud_Issue__left")}])
      })
  }


  _removeCloudReset(stone) {
    core.eventBus.emit('showLoading', lang("Removing_the_Crownstone_f"));
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .catch((err) => {
        return new Promise((resolve, reject) => {
          if (err && err.status === 404) {
            resolve();
          }
          else {
            LOGe.info("COULD NOT DELETE IN CLOUD", err);
            reject();
          }
        })
      })
      .then(() => {
        core.eventBus.emit('showLoading', lang("Factory_resetting_the_Cro"));
        BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName:"commandFactoryReset"}, {}, 5, "Factory reset from deviceEdit.")
          .then(() => {
            this._removeCrownstoneFromRedux(true);
          })
          .catch((err) => {
            LOGe.info("ERROR:",err);
            core.eventBus.emit('hideLoading');
            Alert.alert(
              lang("_Encountered_a_problem____header"),
              lang("_Encountered_a_problem____body"),
              [{text:lang("_Encountered_a_problem____left"), onPress: () => {
                  NavigationUtil.dismissModalAndBack();
                }}]
            )
          });

        BatchCommandHandler.executePriority();

      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err);
        core.eventBus.emit('hideLoading');
        Alert.alert(
          lang("_Encountered_Cloud_Issue___header"),
          lang("_Encountered_Cloud_Issue___body"),
          [{text:lang("_Encountered_Cloud_Issue___left"), onPress: () => {
            }
          }])
      })
  }


  _removeCrownstoneFromRedux(factoryReset = false) {
    // deleting makes sure we will not draw this page again if we delete it's source from the database.
    this.deleting = true;

    let labelText =  lang("I_have_removed_this_Crown");
    if (factoryReset === false) {
      labelText =  lang("I_have_removed_this_Crowns")}

    core.eventBus.emit('hideLoading');
    Alert.alert(
      lang("_Success__arguments___OKn_header"),
      lang("_Success__arguments___OKn_body",labelText),
      [{text:lang("_Success__arguments___OKn_left"), onPress: () => {
          NavigationUtil.dismissModalAndBack();
          SortingManager.removeFromLists(this.props.stoneId);
          core.store.dispatch({type: "REMOVE_STONE", sphereId: this.props.sphereId, stoneId: this.props.stoneId});
        }}]
    )
  }


  _updateCrownstone() {
    const store = core.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.hubId);
    // collect promises to handle changes in switchcraft and dim state
    core.eventBus.emit("hideLoading");

    let actions = [];
    if (
      stone.config.name           !== this.state.stoneName      ||
      stone.config.description    !== this.state.description    ||
      stone.config.icon           !== this.state.stoneIcon      ||
      stone.config.locationId     !== this.state.locationId
    ) {
      actions.push({
        type:'UPDATE_STONE_CONFIG',
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: {
          name:        this.state.stoneName,
          description: this.state.description,
          icon:        this.state.stoneIcon,
          locationId:  this.state.locationId,
        }});
    }

    if (hub && (stone.config.name !== this.state.stoneName || stone.config.locationId !== this.state.locationId)) {
      actions.push({
        type:'UPDATE_HUB_CONFIG',
        sphereId: this.props.sphereId,
        hubId: hub.id,
        data: {
          name:        this.state.stoneName,
          locationId:  this.state.locationId,
        }});
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }

    NavigationUtil.dismissModal();
  }


  _getVersionInformation(stone) {
    let unknownString = lang("Not_checked_");

    if (this.state.refreshingStoneVersions) {
      return (
        <View style={{paddingTop:15, paddingBottom:30}}>
          <Text style={[styles.version,{paddingBottom:4}]}>{ lang("Checking_versions____") }</Text>
          <ActivityIndicator animating={true} size='small' color={colors.darkGray2.hex} />
        </View>
      );
    }
    else {
      return (
        <TouchableOpacity style={{paddingTop:15, paddingBottom:30}} onPress={() => {
          if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
            return Alert.alert(
              lang("_Cant_see_this_stone___I__header"),
              lang("_Cant_see_this_stone___I__body"),
              [{text:lang("_Cant_see_this_stone___I__left")}]);
          }

          this.setState({refreshingStoneVersions: true});
          let promises = [];
          promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getFirmwareVersion'},{},2, 'from checkFirmware')
            .then((firmwareVersion : {data: string}) => {
              core.store.dispatch({
                type: "UPDATE_STONE_CONFIG",
                stoneId: this.props.stoneId,
                sphereId: this.props.sphereId,
                data: {
                  firmwareVersion: firmwareVersion.data,
                }
              })
            })
            .catch((err) => {
              Alert.alert(
                lang("_Whoops___I_could_not_get_header"),
                lang("_Whoops___I_could_not_get_body"),
                [{text:lang("_Whoops___I_could_not_get_left")}]);
              throw err;
            }));
          promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getHardwareVersion'},{},2, 'from checkFirmware')
            .then((hardwareVersion : {data: string}) => {
              core.store.dispatch({
                type: "UPDATE_STONE_CONFIG",
                stoneId: this.props.stoneId,
                sphereId: this.props.sphereId,
                data: {
                  hardwareVersion: hardwareVersion.data,
                }
              })
            })
            .catch((err) => {
              Alert.alert(
                lang("_Whoops___I_could_not_get__header"),
                lang("_Whoops___I_could_not_get__body"),
                [{text:lang("_Whoops___I_could_not_get__left")}]);
              throw err;
            }))
          promises.push(BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, {commandName: 'getBootloaderVersion'},{},2, 'from checkFirmware')
            .then((bootloaderVersion : {data: string}) => {
              let version = bootloaderVersion.data;
              if (version) {
                core.store.dispatch({
                  type: "UPDATE_STONE_CONFIG",
                  stoneId: this.props.stoneId,
                  sphereId: this.props.sphereId,
                  data: {
                    bootloaderVersion: version,
                  }
                })
              }
            })
            .catch((err) => {
              Alert.alert(
                lang("_Whoops___I_could_not_get__header"),
                lang("_Whoops___I_could_not_get__body"),
                [{text:lang("_Whoops___I_could_not_get__left")}]);
              throw err;
            }))
          BatchCommandHandler.executePriority();


          Promise.all(promises)
            .then(() => {
              this.setState({refreshingStoneVersions: false});
            })
            .catch((err) => {
              this.setState({refreshingStoneVersions: false});
            });
        }}>
          <Text style={styles.version}>{ lang("address__",stone.config.macAddress, lang("unknown")) }</Text>
          <Text style={styles.version}>{ lang("hardware_id__",stone.config.hardwareVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("bootloader__",stone.config.bootloaderVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("firmware__",stone.config.firmwareVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("crownstone_id__",stone.config.crownstoneId, lang("unknown")) }</Text>
        </TouchableOpacity>
      );
    }
  }

  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return <SphereDeleted /> }
    const stone = sphere.stones[this.props.stoneId];
    if (!stone) { return <StoneDeleted /> }

    let options = this.constructStoneOptions(stone, state);

    let backgroundImage = core.background.menu;

    return (
      <BackgroundNoNotification hasNavBar={false} image={backgroundImage}>
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
          {this._getVersionInformation(stone)}
        </ScrollView>
      </BackgroundNoNotification>
    )
  }
}
