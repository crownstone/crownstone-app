import {LiveComponent} from "../LiveComponent";

import {Languages} from "../../Languages"
import * as React from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';


import {background, colors, styles} from "../styles";
import {BleUtil} from '../../util/BleUtil'
import {CLOUD} from '../../cloud/cloudAPI'
import {IconButton} from '../components/IconButton'
import {ListEditableItems} from '../components/ListEditableItems'
import {LOG, LOGe} from '../../logging/Log'
import {Permissions} from "../../backgroundProcesses/PermissionManager";

import {SphereDeleted} from "../static/SphereDeleted";
import {StoneDeleted} from "../static/StoneDeleted";
import {core} from "../../Core";
import {NavigationUtil} from "../../util/NavigationUtil";
import {StoneAvailabilityTracker} from "../../native/advertisements/StoneAvailabilityTracker";
import {TopBarUtil} from "../../util/TopBarUtil";
import {OverlayUtil} from "../overlays/OverlayUtil";
import {BackgroundNoNotification} from "../components/BackgroundNoNotification";
import {SortingManager} from "../../logic/SortingManager";
import {DataUtil} from "../../util/DataUtil";
import {HubHelper} from "../../native/setup/HubHelper";
import {tell} from "../../logic/constellation/Tellers";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEdit", key)(a,b,c,d,e);
}


export class DeviceEdit extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Settings"), cancelModal: true, save: true});
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
    let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);

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
            if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
              Alert.alert(lang("Cant_see_this_one_"),
                lang("This_Crownstone_has_not_b"),
                [{text:lang("Delete_anyway"), onPress: () => {this._removeCloudOnly()}, style: 'destructive'},
                  {text:lang("Cancel"),style: 'cancel', onPress: () => {}}]
              )
            }
            else {
              Alert.alert(
                lang("Are_you_sure_you_want_to_"),
                lang("This_cannot_be_undone_"),
                [{text: "Delete", onPress: async () => {
                    core.eventBus.emit('showLoading', lang("Resetting_hub___"));
                    let helper = new HubHelper();
                    try {
                      await helper.factoryResetHub(this.props.sphereId, this.props.stoneId);
                      this._removeCrownstoneFromRedux();
                    }
                    catch(err) {
                      core.eventBus.emit('hideLoading');
                      if (err?.message === "HUB_REPLY_TIMEOUT") {
                        Alert.alert(lang("The_hub_is_not_responding"),
                          lang("If_this_hub_is_broken__yo"),
                          [{ text: lang("Delete_anyway"), onPress: () => {this._removeCrownstone(stone).catch((err) => {});} , style: 'destructive'},{text:lang("Cancel"),style: 'cancel'}]);
                      }
                      else {
                        Alert.alert(
lang("_Something_went_wrong_____header"),
lang("_Something_went_wrong_____body"),
[{text: lang("_Something_went_wrong_____left") }]);
                      }
                    }
                  }, style: 'destructive'},{text:lang("Cancel"),style: 'cancel'}])
            }
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
      if (hub) {
        items.push({label: lang("Removing_this_Hub_"),  type:'explanation', below:true});
      }
      else {
        items.push({label: lang("Removing_this_Crownstone_"),  type:'explanation', below:true});
      }
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


  _removeCloudOnly()  {
    core.eventBus.emit('showLoading', lang("Removing_the_Crownstone_fr"));
    let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);
    if (hub && hub.config.cloudId) {
      CLOUD.deleteHub(hub.config.cloudId)
        .catch((err) => {
          return new Promise<void>((resolve, reject) => {
            if (err && err?.status === 404) {
              resolve();
            }
          })
        })
    }
    CLOUD.forSphere(this.props.sphereId).deleteStone(this.props.stoneId)
      .catch((err) => {
        return new Promise<void>((resolve, reject) => {
          if (err && err?.status === 404) {
            resolve();
          }
          else {
            LOGe.info("COULD NOT DELETE IN CLOUD", err?.message);
            reject();
          }
        })
      })
      .then(() => {
        this._removeCrownstoneFromRedux(false);
      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err?.message);
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
        return new Promise<void>((resolve, reject) => {
          if (err && err?.status === 404) {
            resolve();
          }
          else {
            LOGe.info("COULD NOT DELETE IN CLOUD", err?.message);
            reject();
          }
        })
      })
      .then(() => {
        core.eventBus.emit('showLoading', lang("Factory_resetting_the_Cro"));
        tell(stone).commandFactoryReset()
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
      })
      .catch((err) => {
        LOG.info("error while asking the cloud to remove this crownstone", err?.message);
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
    let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);

    // deleting makes sure we will not draw this page again if we delete it's source from the database.
    this.deleting = true;

    let labelText =  lang("I_have_removed_this_Crown");
    if (hub) {
      labelText =  lang("I_have_removed_this_Hub");
    }
    else {
      if (factoryReset === false) {
        labelText =  lang("I_have_removed_this_Crowns")
      }
    }

    core.eventBus.emit('hideLoading');
    Alert.alert(
      lang("_Success__arguments___OKn_header"),
      lang("_Success__arguments___OKn_body",labelText),
      [{text:lang("_Success__arguments___OKn_left"), onPress: () => {
          NavigationUtil.dismissModalAndBack();
          SortingManager.removeFromLists(this.props.stoneId);
          core.store.dispatch({type: "REMOVE_STONE", sphereId: this.props.sphereId, stoneId: this.props.stoneId});
          if (hub) {
            SortingManager.removeFromLists(hub.id);
            core.store.dispatch({type: "REMOVE_HUB", sphereId: this.props.sphereId, hubId: hub.id});
          }
          core.eventBus.emit('hideLoading');
        }}]
    )
  }


  _updateCrownstone() {
    const store = core.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);
    // collect promises to handle changes in switchcraft and dim state
    core.eventBus.emit("hideLoading");
    console.log("_updateCrownstone", hub, this.state.locationId === stone.config.locationId)
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
        <TouchableOpacity style={{paddingTop:15, paddingBottom:30}} onPress={async () => {
          if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
            return Alert.alert(
              lang("_Cant_see_this_stone___I__header"),
              lang("_Cant_see_this_stone___I__body"),
              [{text:lang("_Cant_see_this_stone___I__left")}]);
          }

          this.setState({refreshingStoneVersions: true});
          let error = null;

          let firmwareVersion;
          let hardwareVersion;
          let bootloaderVersion;
          let uicr;

          let promises = [
            tell(stone).getFirmwareVersion()
              .then((r) => { firmwareVersion = r }).catch((err) => { error = err; }),
            tell(stone).getHardwareVersion()
              .then((r) => { hardwareVersion = r }).catch((err) => { error = err; }),
            tell(stone).getBootloaderVersion()
              .then((r) => { bootloaderVersion = r }).catch((err) => { error = err; }),
            tell(stone).getUICR()
              .then((r) => { uicr = r }).catch((err) => { error = err; }),
          ]

          await Promise.all(promises);

          let data : any = {};
          if (firmwareVersion)   { data.firmwareVersion   = firmwareVersion; }
          if (hardwareVersion)   { data.hardwareVersion   = hardwareVersion; }
          if (bootloaderVersion) { data.bootloaderVersion = bootloaderVersion; }
          if (uicr)              { data.uicr              = uicr; }

          core.store.dispatch({
            type: "UPDATE_STONE_CONFIG",
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId,
            data
          });

          if (error) {
            Alert.alert(
              lang("_Whoops___I_could_not_get_header"),
              lang("_Whoops___I_could_not_get_body"),
              [{text:lang("_Whoops___I_could_not_get_left")}]
            );
          }

          this.setState({refreshingStoneVersions: false});
        }}>
          <Text style={styles.version}>{ lang("address__",stone.config.macAddress, lang("unknown")) }</Text>
          <Text style={styles.version}>{ lang("hardware_id__",stone.config.hardwareVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("bootloader__",stone.config.bootloaderVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("firmware__",stone.config.firmwareVersion,unknownString) }</Text>
          <Text style={styles.version}>{ lang("crownstone_id__",stone.config.uid, lang("unknown")) }</Text>
          {
            core.store.getState().user.developer && <Text style={styles.version}>{ lang("uicr",JSON.stringify(stone.config.uicr, null, 2), unknownString) }</Text>
          }
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

    let backgroundImage = background.menu;

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
