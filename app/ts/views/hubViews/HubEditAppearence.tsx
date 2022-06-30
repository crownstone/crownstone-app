import {LiveComponent} from "../LiveComponent";

import {Languages} from "../../Languages"
import * as React from 'react';
import {ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View} from 'react-native';


import {background, colors, styles} from "../styles";
import {IconButton} from '../components/IconButton'
import {ListEditableItems} from '../components/ListEditableItems'

import {SphereDeleted} from "../static/SphereDeleted";
import {StoneDeleted} from "../static/StoneDeleted";
import {core} from "../../Core";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import {StoneAvailabilityTracker} from "../../native/advertisements/StoneAvailabilityTracker";
import {TopBarUtil} from "../../util/TopBarUtil";
import {DataUtil} from "../../util/DataUtil";
import { from, tell } from "../../logic/constellation/Tellers";
import {SettingsBackground} from "../components/SettingsBackground";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEditAppearence", key)(a,b,c,d,e);
}


export class DeviceEditAppearence extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Settings"), cancelBack: true, save: true});
  }

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

      if (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId]) {
        this.forceUpdate();
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

    return items;
  }



  _updateCrownstone() {
    const store = core.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);
    // collect promises to handle changes in switchcraft and dim state
    core.eventBus.emit("hideLoading");
    let actions = [];
    if (
      stone.config.name           !== this.state.stoneName      ||
      stone.config.description    !== this.state.description    ||
      stone.config.icon           !== this.state.stoneIcon
    ) {
      actions.push({
        type:'UPDATE_STONE_CONFIG',
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: {
          name:        this.state.stoneName,
          description: this.state.description,
          icon:        this.state.stoneIcon,
        }});
    }

    if (hub && (stone.config.name !== this.state.stoneName)) {
      actions.push({
        type:'UPDATE_HUB_CONFIG',
        sphereId: this.props.sphereId,
        hubId: hub.id,
        data: {
          name:        this.state.stoneName,
        }});
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }

    NavigationUtil.back();
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
            from(stone).getFirmwareVersion()
              .then((r) => { firmwareVersion = r }).catch((err) => { error = err; }),
            from(stone).getHardwareVersion()
              .then((r) => { hardwareVersion = r }).catch((err) => { error = err; }),
            from(stone).getBootloaderVersion()
              .then((r) => { bootloaderVersion = r }).catch((err) => { error = err; }),
            from(stone).getUICR()
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
            DataUtil.isDeveloper() && <Text style={styles.version}>{ lang("uicr",JSON.stringify(stone.config.uicr, null, 2), unknownString) }</Text>
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

    return (
      <SettingsBackground>
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
          {this._getVersionInformation(stone)}
        </ScrollView>
      </SettingsBackground>
    )
  }
}
