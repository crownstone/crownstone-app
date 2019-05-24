import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsMeshDebug", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView} from 'react-native';

import { Background }          from '../../components/Background'
import { ListEditableItems }   from '../../components/ListEditableItems'
import { colors,  }  from '../../styles'
import { Util }                from "../../../util/Util";
import { IconCircle }          from "../../components/IconCircle";
import { MeshUtil }            from "../../../util/MeshUtil";
import { BatchCommandHandler } from "../../../logic/BatchCommandHandler";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class SettingsMeshDebug extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Mesh_Debug")});
  }

  unsubscribe : any;
  refreshAmountRequired = 0;
  refreshCount = 0;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.stoneRssiUpdated || change.changeSpheres || change.updateActiveSphere || change.changeStoneState) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _pushCrownstoneItem(items, sphereId, element, stone, stoneId, subtext = '', locationColor = colors.gray.hex) {
    let backgroundColor = colors.menuBackground.hex;
    if (stone && stone.state.state > 0 && StoneAvailabilityTracker.isDisabled(stoneId) === false) {
      backgroundColor = colors.green.hex
    }
    else if (StoneAvailabilityTracker.isDisabled(stoneId)) {
      backgroundColor = colors.gray.hex;
    }
    items.push({
      mediumIcon: <IconCircle
        icon={element ? element.config.icon : 'ios-analytics'}
        size={52}
        backgroundColor={backgroundColor}
        color={colors.white.hex}
        style={{position:'relative', top:2}} />,
      label: lang("Any",element,element.config.name),
      subtext: subtext,
      subtextStyle: {color:locationColor},
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate( "SettingsStoneBleDebug",{sphereId: sphereId, stoneId: stoneId})
      },
    });
  }

  _setChannel(channel) {
    this.refreshAmountRequired = 0;
    this.refreshCount = 0;

    const store = core.store;
    let state = store.getState();
    let sphereId = Util.data.getReferenceId(state);
    if (!sphereId) { return [{label: lang("You_have_to_be_in_a_sphere"), type: 'largeExplanation'}]; }

    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
        this.refreshAmountRequired += 1;
      }
    });


    core.eventBus.emit('showProgress', {progress: 0, progressText: lang("Setting_Mesh_Channels__St", channel)});

    let evaluateRefreshProgress = () => {
      this.refreshCount += 1;
      if (this.refreshCount >= this.refreshAmountRequired) {
        Alert.alert(
          lang("_All_done___This_went_ver_header"),
          lang("_All_done___This_went_ver_body"),
          [{text:lang("_All_done___This_went_ver_left")}]
        );
        core.eventBus.emit('updateProgress', { progress: 1, progressText: lang("Done") });
        setTimeout(() => { core.eventBus.emit("hideProgress");}, 500);

        MeshUtil.clearMeshNetworkIds(store, sphereId);
      }
      else {
        core.eventBus.emit('updateProgress', {progress: this.refreshCount / this.refreshAmountRequired, progressText: lang("Setting_Mesh_Channels_n_n",channel,this.refreshCount,this.refreshAmountRequired)});
      }
    };

    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
        BatchCommandHandler.loadPriority(stone, stoneId, sphereId, {
          commandName: 'setMeshChannel',
          channel: channel
        }, {}, 2, 'mesh_channelSet' + stoneId)
          .then(() => {
            evaluateRefreshProgress()
          })
          .catch(() => {
            Alert.alert(
              lang("_Missed_one__I_could_not__header"),
              lang("_Missed_one__I_could_not__body",stone.config.name),
              [{text:lang("_Missed_one__I_could_not__left")}]);
            evaluateRefreshProgress()
          })
      }
    });
    BatchCommandHandler.executePriority()
  }

  _getItems() {
    let items = [];

    const store = core.store;
    let state = store.getState();
    let sphereId = Util.data.getReferenceId(state);
    if (!sphereId) { return [{label: lang("You_have_to_be_in_a_sphere"), type: 'largeExplanation'}]; }
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    items.push({
      type:'explanation',
      label: lang("VISIBLE_STONES"),
    });

    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      let location = Util.data.getLocationFromStone(sphere, stone);
      let locationColor = colors.gray.hex;
      let locationTitle =  lang("Floating___");
      if (location) {
        locationTitle = location.config.name;
        locationColor = colors.iosBlue.hex;
      }
      let element = Util.data.getElement(store, sphereId, stoneId, stone);
      if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
        this._pushCrownstoneItem(items, sphereId, element, stone, stoneId, locationTitle, locationColor);
      }
    });

    items.push({
      type:'explanation',
      label: lang("ACTIONS"),
    });

    items.push({
      type:'button',
      label: lang("Set_to_Channel___", 37),
      callback: () => { this._setChannel(37); }
    });

    items.push({
      type:'button',
      label: lang("Set_to_Channel___", 38),
      callback: () => { this._setChannel(38); }
    });

    items.push({
      type: 'button',
      label: lang("Set_to_Channel___", 39),
      callback: () => { this._setChannel(39); }
    });

    return items;
  }

  render() {
    return (
      <Background image={core.background.menu} >
                <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
