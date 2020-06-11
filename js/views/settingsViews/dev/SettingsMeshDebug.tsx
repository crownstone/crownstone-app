import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  Alert,
  ScrollView} from 'react-native';

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
import { BackgroundNoNotification } from "../../components/BackgroundNoNotification";


export class SettingsMeshDebug extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Mesh Debug"});
  }

  unsubscribe : any;
  refreshAmountRequired = 0;
  refreshCount = 0;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeSpheres || change.updateActiveSphere || change.changeStoneAvailability) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _pushCrownstoneItem(items, sphereId, stone, stoneId, subtext = '', locationColor = colors.gray.hex) {
    let backgroundColor = colors.menuBackground.hex;
    if (stone && stone.state.state > 0 && StoneAvailabilityTracker.isDisabled(stoneId) === false) {
      backgroundColor = colors.green.hex
    }
    else if (StoneAvailabilityTracker.isDisabled(stoneId)) {
      backgroundColor = colors.gray.hex;
    }
    items.push({
      mediumIcon: <IconCircle
        icon={stone ? stone.config.icon : 'ios-analytics'}
        size={52}
        backgroundColor={backgroundColor}
        color={colors.white.hex}
        style={{position:'relative', top:2}} />,
      label: stone ? stone.config.name : "Any",
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
    if (!sphereId) { return [{label: "You have to be in a sphere in order to debug Mesh", type: 'largeExplanation'}]; }

    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
        this.refreshAmountRequired += 1;
      }
    });


    core.eventBus.emit('showProgress', {progress: 0, progressText: "Setting mesh channels:" + channel});

    let evaluateRefreshProgress = () => {
      this.refreshCount += 1;
      if (this.refreshCount >= this.refreshAmountRequired) {
        Alert.alert(
          "All done!",
          "This went very well!",
          [{text:"Nice."}]
        );
        core.eventBus.emit('updateProgress', { progress: 1, progressText: "Done" });
        setTimeout(() => { core.eventBus.emit("hideProgress");}, 500);

        MeshUtil.clearMeshNetworkIds(store, sphereId);
      }
      else {
        core.eventBus.emit('updateProgress', {progress: this.refreshCount / this.refreshAmountRequired, progressText: "Setting mesh channels:" +  channel + " " + this.refreshCount +"/"+ this.refreshAmountRequired});
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
              "Missed one",
               "I could not find:" + stone.config.name,
              [{text:"OK"}]);
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
    if (!sphereId) { return [{label: "You have to be in a sphere in order to debug Mesh", type: 'largeExplanation'}]; }
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    items.push({
      type:'explanation',
      label: "VISIBLE STONES",
    });

    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      let location = Util.data.getLocationFromStone(sphere, stone);
      let locationColor = colors.gray.hex;
      let locationTitle =  "Floating...";
      if (location) {
        locationTitle = location.config.name;
        locationColor = colors.iosBlue.hex;
      }
      if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
        this._pushCrownstoneItem(items, sphereId, stone, stoneId, locationTitle, locationColor);
      }
    });

    items.push({
      type:'explanation',
      label: "ACTIONS",
    });

    items.push({
      type:'button',
      label: "Set to channel 37",
      callback: () => { this._setChannel(37); }
    });

    items.push({
      type:'button',
      label: "Set to channel 38",
      callback: () => { this._setChannel(38); }
    });

    items.push({
      type: 'button',
      label: "Set to channel 39",
      callback: () => { this._setChannel(39); }
    });

    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={core.background.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}
