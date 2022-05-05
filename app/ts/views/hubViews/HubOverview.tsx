import {LiveComponent} from "../LiveComponent";

import {Languages} from "../../Languages"
import * as React from 'react';

import {Background} from '../components/Background'
import {SphereDeleted} from "../static/SphereDeleted";
import {core} from "../../Core";
import {TopBarUtil} from "../../util/TopBarUtil";
import {availableScreenHeight, background, colors, deviceStyles, screenWidth, styles} from "../styles";
import {ActivityIndicator, Alert, Text, TextStyle, TouchableOpacity, View} from "react-native";
import {Icon} from "../components/Icon";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import {xUtil} from "../../util/StandAloneUtil";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {AnimatedCircle} from "../components/animated/AnimatedCircle";
import {Util} from "../../util/Util";
import {MINIMUM_REQUIRED_FIRMWARE_VERSION} from "../../ExternalConfig";
import {AlternatingContent} from "../components/animated/AlternatingContent";
import {HubHelper} from "../../native/setup/HubHelper";
import {DataUtil} from "../../util/DataUtil";
import {Button} from "../components/Button";
import {Get} from "../../util/GetUtil";
import {HubReplyError} from "./HubEnums";
import {LOGe, LOGi, LOGw} from "../../logging/Log";
import {Scheduler} from "../../logic/Scheduler";
import {CLOUD} from "../../cloud/cloudAPI";
// import { WebRtcClient } from "../../logic/WebRtcClient";
import {DebugIcon} from "../components/DebugIcon";
import {HubTransferNext} from "../../cloud/sections/newSync/transferrers/HubTransferNext";
import { Navigation } from "react-native-navigation";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HubOverview", key)(a,b,c,d,e);
}


export class HubOverview extends LiveComponent<any, { fixing: boolean }> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;


  constructor(props) {
    super(props);

    this.state = {fixing: false}
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'deviceEdit') {
      let stone = Get.stone(this.props.sphereId, this.props.stoneId);
      if (this.props.stoneId && stone) {
        NavigationUtil.launchModal("DeviceEdit", { sphereId: this.props.sphereId, stoneId: this.props.stoneId });
      }
      else if (this.props.hubId) {
        NavigationUtil.launchModal("HubEdit", { sphereId: this.props.sphereId, hubId: this.props.hubId });
      }
    }
  }

  componentDidMount() {
    let state = core.store.getState();

    if (state.app.hasSeenDeviceSettings === false) {
      core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenDeviceSettings: true } })
    }

    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let state = core.store.getState();
      if (
        (state.spheres[this.props.sphereId] === undefined) ||
        (change.removeSphere         && change.removeSphere.sphereIds[this.props.sphereId]) ||
        (change.removeStone          && change.removeStone.stoneIds[this.props.stoneId])
      ) {
        return this.forceUpdate();
      }

      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      if (
        !change.removeStone &&
        (
          change.updateHubConfig ||
          change.changeHubs ||
          change.changeAppSettings ||
          change.stoneLocationUpdated    && change.stoneLocationUpdated.stoneIds[this.props.stoneId]    ||
          change.changeStoneAvailability && change.changeStoneAvailability.stoneIds[this.props.stoneId] ||
          change.updateStoneConfig       && change.updateStoneConfig.stoneIds[this.props.stoneId]
        )
      ) {
        if (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId]) {
          this._updateNavBar();
        }
        this.forceUpdate();
        return
      }
    });
  }

  _updateNavBar() {
    getTopBarProps(this.props);
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  _getStoneIcon(stone, updateAvailable) {
    let iconColor = colors.white.rgba(1);
    let size = 0.25*availableScreenHeight;
    let stateColor = colors.green.hex;
    let icon = stone?.config?.icon || 'c1-router';

    if (updateAvailable) {
      return (
        <TouchableOpacity
          style={{width: screenWidth, height:size, alignItems:'center', justifyContent:'center'}}
          onPress={() => {
            NavigationUtil.launchModal( "DfuIntroduction", {sphereId: this.props.sphereId});
          }}
        >
          <AlternatingContent
            style={{width:screenWidth, height:size, justifyContent:'center', alignItems:'center'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={"c1-update-arrow"} />,
              <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={icon} />,
            ]}
          />
        </TouchableOpacity>
      );
    }


    return (
      <View style={{width: screenWidth, height:size, alignItems:'center', justifyContent:'center'}}>
        <DeviceIcon size={size} color={stateColor} iconColor={iconColor} icon={icon} />
      </View>
    )
  }



  getStateEntries(stone: StoneData | null, hub: HubData | null, hubs: HubData[]) {
    let entries = [];
    let textStyle : TextStyle = {textAlign:'center', fontSize:16, fontWeight:'bold'};
    let hubState = hub?.state;
    let helper = new HubHelper();

    if (this.state.fixing) {
      return <View key={"Fixing"} style={{...styles.centered, flex:1, padding:15}}>
        <Text style={textStyle}>{ lang("Fixing_issue___") }</Text>
        <View style={{flex:0.25}}/>
        <ActivityIndicator size={'large'} />
        <View style={{flex:1}}/>
      </View>
    }


    if (!stone) {
      return (
        <View key={"StoneMissingFix"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("This_hub_has_no_Crownston") }</Text>
          <View style={{flex:1}}/>
        </View>
      );
    }

    // this means the hub itself has no identifier in the app to work off from. We should fix this.
    if (!hub) {
      return (
        <View key={"HubReferenceFix"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("The_hub_reference_in_the_") }</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ lang("Fix_now__")}
            icon={"ios-build"}
            iconSize={14}
            callback={() => {
              this.setState({fixing: true});
              helper.createLocalHubInstance(this.props.sphereId, this.props.stoneId)
                .then((hubId) => {
                  core.store.dispatch({type:"UPDATE_HUB_CONFIG", sphereId: this.props.sphereId, hubId: hubId, data: {locationId: stone.config.locationId}});
                  this.setState({fixing:false})
                })
                .catch(async (err) => {
                  if (err?.code === 3 && err?.type === HubReplyError.IN_SETUP_MODE) {
                    await this.createHub();
                    await Scheduler.delay(5000);
                    this.setState({ fixing: false });
                  }
                  else {
                    throw err;
                  }
                  this.setState({fixing:false})
                })
                .catch((err) => {
                  Alert.alert(
                    lang("_Something_went_wrong_____P_header"),
                    lang("_Something_went_wrong_____P_body"),
                    [{text:lang("_Something_went_wrong_____P_left")}]);
                  this.setState({fixing:false})
                })
            }}
          />
        </View>
      );
    }


    // if encryption is not enforced by both parties and the connection is not alive...
    if (hubState.uartAlive === false && this.props.stoneId) {
      return (
        <View key={"HubUartFailed"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("The_hub_is_not_responding") }</Text>
          <View style={{flex:1}}/>
        </View>
      );
    }

    // this means the dongle is set up, but the hub itself is not setup.
    if (hubState.hubHasBeenSetup === false) {
      return (
        <View key={"HubSetupFix"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("The_hub_itself_is_not_ini") }</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ lang("Initialize_hub_")}
            icon={"ios-build"}
            iconSize={14}
            callback={async () => {
              this.setState({ fixing: true });
              await this.createHub();
              this.setState({ fixing: false });
            }}
          />
        </View>
      );
    }

    if (hubs.length > 1) {
      return (
        <View key={"HubMultiple"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("There_are_multiple_hubs_b") }</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ lang("Fix_it_")}
            icon={"ios-build"}
            iconSize={14}
            callback={async () => {
              this.setState({fixing:true});
              await this.fixMultipleHubs();
              this.setState({fixing:false});
            }}
          />
        </View>
      );
    }


    if (hubState.uartAliveEncrypted === false && hubState.uartEncryptionRequiredByCrownstone === true && hubState.uartEncryptionRequiredByHub === true) {
      return (
        <View key={"HubUartEncryptionFailed"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("This_hub_does_not_belong_") }</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ lang("Factory_reset_hub__")}
            icon={"ios-build"}
            iconSize={14}
            callback={async () => {
              this.setState({fixing: true});
              try {
                await helper.factoryResetHubOnly(this.props.sphereId, this.props.stoneId);
                await helper.setup(this.props.sphereId, this.props.stoneId);
                await this.fixMultipleHubs();
                await Scheduler.delay(3000);
              }
              catch(e) {
                LOGw.info("Failed to reset hub", e)
                Alert.alert(
lang("_Something_went_wrong_____Pl_header"),
lang("_Something_went_wrong_____Pl_body"),
[{text:lang("_Something_went_wrong_____Pl_left")}])
              }
              this.setState({fixing:false})
            }}
          />
        </View>
      );
    }


    if (hubState.uartAlive === true && hubState.uartAliveEncrypted === false && hubState.uartEncryptionRequiredByCrownstone === false && hubState.uartEncryptionRequiredByHub === true) {
      return (
        <View key={"HubUartEncryptionDisabled"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("Encryption_is_not_enabled") }</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ "Enable encryption. "}
            icon={"ios-build"}
            iconSize={14}
            callback={ async () => {
              this.setState({fixing: true});
              try {
                await helper.setUartKey(this.props.sphereId, this.props.stoneId);
              }
              catch(e) {
                Alert.alert(
lang("_Something_went_wrong_____Ple_header"),
lang("_Something_went_wrong_____Ple_body"),
[{text:lang("_Something_went_wrong_____Ple_left")}])
              }
              this.setState({fixing:false})
            }}
          />
        </View>
      );
    }


    if (!hub.config.cloudId) {
      return (
        <View key={"HubCloudMissing"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("This_hub_does_not_exist_i") }</Text>
          <View style={{flex:1}}/>
          <Button
            backgroundColor={colors.blue.rgba(0.5)}
            label={ lang("Fix_it_")}
            icon={"ios-build"}
            iconSize={14}
            callback={async () => {
              this.setState({fixing:true});
              try {
                let requestCloudId = await helper.getCloudIdFromHub(this.props.sphereId, this.props.stoneId);
                let existingHub = DataUtil.getHubByCloudId(this.props.sphereId, requestCloudId);

                if (existingHub) {
                  // we actually have the requested hub in our local database. Delete the one without cloudId, and bind the other to this Crownstone.
                  core.store.batchDispatch([
                    {type:"REMOVE_HUB", sphereId: this.props.sphereId, hubId: hub.id},
                    {type:"UPDATE_HUB_CONFIG", sphereId: this.props.sphereId, hubId: hub.id, data: {linkedStoneId: this.props.stoneId, locationId: stone.config.locationId}},
                  ]);
                  return;
                }

                // we dont have it locally, look in the cloud.
                try {
                  let hubCloudData = await CLOUD.getHub(requestCloudId);
                  // we have it in the cloud, store locally
                  core.store.batchDispatch([
                    {type:"REMOVE_HUB", sphereId: this.props.sphereId, hubId: hub.id},
                    {type:"ADD_HUB", sphereId: this.props.sphereId, hubId: xUtil.getUUID(), data: HubTransferNext.mapCloudToLocal(hubCloudData, this.props.stoneId, stone.config.locationId)},
                  ]);
                }
                catch (err) {
                  if (err?.status === 404) {
                    // this item does not exist  in the cloud.. Factory reset required.
                    core.store.dispatch({ type: "REMOVE_HUB", sphereId: this.props.sphereId, hubId: hub.id });
                    await helper.factoryResetHubOnly(this.props.sphereId, this.props.stoneId);
                    await helper.setup(this.props.sphereId, this.props.stoneId);
                  }
                  else {
                    throw err;
                  }
                }
                this.setState({fixing:false});
              }
              catch(err) {
                Alert.alert(
                  lang("_Something_went_wrong_____Plea_header"),
                  lang("_Something_went_wrong_____Plea_body"),
                  [{text:lang("_Something_went_wrong_____Plea_left")}]);
                this.setState({fixing:false});
              }
            }}
          />
        </View>
      );
    }

    // if the last time we synced is later than what we have stored as last seen on cloud, and it is more than 30 mins ago.
    if (CLOUD.lastSyncTimestamp > hub.config.lastSeenOnCloud && Date.now() - hub.config.lastSeenOnCloud > 1800*1000) {
      return (
        <View key={"HubDidNotReport"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("The_hub_did_not_report") }</Text>
          <View style={{flex:1}}/>
        </View>
      );
    }

    if (hubState.hubHasInternet === false) {
      return (
        <View key={"HubNoInternet"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("The_hub_is_not_connected_") }</Text>
          <View style={{flex:1}}/>
        </View>
      );
    }

    if (hubState.hubHasError) {
      return (
        <View key={"Hub Reports Error"} style={{...styles.centered, flex:1, padding:15}}>
          <Text style={textStyle}>{ lang("The_hub_is_reporting_an_e") }</Text>
          <View style={{flex:1}}/>
        </View>
      );
    }

    if (hubState.uartAlive && hubState.uartAliveEncrypted) {
      if (hub.config.ipAddress) {
        return (
          <View key={"HubIPAddress"} style={{...styles.centered, flex:1, padding:15}}>
            <Text style={textStyle}>{ lang("Everything_is_looking_goo") }</Text>
            <Text style={{...textStyle, fontSize: 20}}>{hub.config.ipAddress}</Text>
            <View style={{flex:1}}/>
          </View>
        )
      }
      else {
        return (
          <View key={"HubOK"} style={{...styles.centered, flex:1, padding:15}}>
            <Text style={textStyle}>{ lang("Everything_is_looking_good") }</Text>
            <View style={{flex:1}}/>
          </View>
        )
      }
    }

    return entries;
  }

  async createHub(source = "ROOT") {
    let helper = new HubHelper();
    let stone = Get.stone(this.props.sphereId, this.props.stoneId);
    try {
      LOGi.info("Setting up hub...")
      let hubId;
      try {
        hubId = await helper.setup(this.props.sphereId, this.props.stoneId)
      }
      catch(err) {
        // if this hub is not in setup mode anymore, attempt to initalize it.
        if (err?.errorType === HubReplyError.NOT_IN_SETUP_MODE) {
          hubId = await helper.setUartKey(this.props.sphereId, this.props.stoneId);
        }
        else {
          throw err;
        }
      }
      core.store.dispatch({
        type: "UPDATE_HUB_CONFIG",
        sphereId: this.props.sphereId,
        hubId: hubId,
        data: { locationId: stone.config.locationId }
      });

      await this.fixMultipleHubs(source);
      await Scheduler.delay(3000);
    }
    catch(err) {
      LOGe.info("Problem settings up new hub", err?.message);
      Alert.alert(
        lang("_Something_went_wrong_____header"),
        lang("_Something_went_wrong_____body"),
        [{text:lang("_Something_went_wrong_____left")}]);
    }
  }

  async fixMultipleHubs(source = "ROOT") {
    const hubs = DataUtil.getAllHubsWithStoneId(this.props.sphereId, this.props.stoneId);
    let helper = new HubHelper();
    if (hubs.length > 1) {
      try {
        let requestCloudId = await helper.getCloudIdFromHub(this.props.sphereId, this.props.stoneId);
        let foundMatch = false
        for (let item of hubs) {
          if (requestCloudId && item?.config?.cloudId !== requestCloudId || foundMatch) {
            if (item?.config?.cloudId) {
              try { await CLOUD.deleteHub(item.config.cloudId); } catch (e) { }
            }
            core.store.dispatch({type:"REMOVE_HUB", sphereId: this.props.sphereId, hubId: item.id});
          }
          else {
            foundMatch = true;
          }
        }
      }
      catch(err) {
        if (source === "ROOT" && err?.type === HubReplyError.IN_SETUP_MODE) {
          await this.createHub('fixMultipleHubs')
          return
        }


        Alert.alert(
lang("_Something_went_wrong_____Pleas_header"),
lang("_Something_went_wrong_____Pleas_body"),
[{text:lang("_Something_went_wrong_____Pleas_left")}]);
      }
    }
  }


  render() {
    const state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) {
      return <SphereDeleted/>
    }
    const stone = sphere.stones[this.props.stoneId];
    const hubs = DataUtil.getAllHubsWithStoneId(this.props.sphereId, this.props.stoneId);
    let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);
    if (!hub) {
      let directHub = DataUtil.getHubById(this.props.sphereId, this.props.hubId);
      if (directHub) {
        hub = directHub;
      }
    }

    let updateAvailable = stone &&
      stone.config.firmwareVersion &&
      ((Util.canUpdate(stone) === true) ||
        xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false);


    return (
      <Background image={background.main}>
        <View style={{flex:0.5}} />

        { this._getStoneIcon(stone, updateAvailable) }
        <View style={{width:screenWidth, padding:30, ...styles.centered}}>
          <Text style={deviceStyles.subHeader}>{ lang("Hub_information_") }</Text>
        </View>

        {this.getStateEntries(stone, hub, hubs)}

        <View style={{flex:0.25}} />
        <DebugIcon sphereId={this.props.sphereId} stoneId={this.props.stoneId} customView={'SettingsDevHub'} />
      </Background>
    )
  }
}

export function DeviceIcon({ size, color, iconColor, icon}) {
  let borderWidth = size*0.04;
  let innerSize = size-1.5*borderWidth;
  return (
    <AnimatedCircle size={size} color={color} style={{alignItems:'center', justifyContent:'center'}}>
      <AnimatedCircle size={innerSize} color={color} style={{borderRadius:0.5*innerSize, borderWidth: borderWidth, borderColor: iconColor, alignItems:'center', justifyContent:'center'}}>
        <Icon size={innerSize*0.63} name={icon} color={iconColor} />
      </AnimatedCircle>
    </AnimatedCircle>
  );
}

function getTopBarProps(props) {
  const state = core.store.getState();
  const hub = state.spheres[props.sphereId].hubs[props.hubId];
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  let spherePermissions = Permissions.inSphere(props.sphereId);

  NAVBAR_PARAMS_CACHE = {
    title: stone?.config?.name ?? hub?.config?.name,
  }

  if (spherePermissions.editCrownstone) {
    NAVBAR_PARAMS_CACHE["nav"] = {
      id: 'deviceEdit',
      text:  lang("Edit"),
    }
  }

  return NAVBAR_PARAMS_CACHE;
}


/**
 * this will store the switchstate if it is not already done. Used for dimmers which use the "TRANSIENT" action.
 */
export function safeStoreUpdate(sphereId, stoneId, storedSwitchState) {
  const state = core.store.getState();
  const sphere = state.spheres[sphereId];
  if (!sphere) { return storedSwitchState; }

  const stone = sphere.stones[stoneId];
  if (!stone) { return storedSwitchState; }

  if (stone.state.state !== storedSwitchState) {
    let data = {state: stone.state.state};
    if (stone.state.state === 0) {
      data['currentUsage'] = 0;
    }
    core.store.dispatch({
      type: 'UPDATE_STONE_SWITCH_STATE',
      sphereId: sphereId,
      stoneId: stoneId,
      data: data
    });

    return stone.state.state;
  }

  return storedSwitchState;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;
