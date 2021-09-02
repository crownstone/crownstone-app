import * as React from 'react';
import { LiveComponent } from "../../LiveComponent";
import { background, colors, deviceStyles } from "../../styles";
import { BackgroundNoNotification } from "../../components/BackgroundNoNotification";
import { IconButton } from "../../components/IconButton";
import { Text, View } from "react-native";
import { ListEditableItems } from "../../components/ListEditableItems";
import { DebugIcon } from "../../components/DebugIcon";
import { DataUtil } from "../../../util/DataUtil";
import { HubRequestHandler } from "../../../cloud/localHub/HubRequest";
import { HUB_API } from "../../../cloud/localHub/HubApi";


export class SettingsDevHub extends LiveComponent<{ sphereId: string, stoneId: string }, any> {

  constructor(props) {
    super(props);

    this.state = {
      obtainedSettings: false
    };



  }

  render() {
    let hub = DataUtil.getHubByStoneId(this.props.sphereId, this.props.stoneId);
    if (!hub) {
      return (
        <BackgroundNoNotification image={background.menu} >
          <View style={{flex:0.25}} />
          <Text style={deviceStyles.header}>No hub instance available...</Text>
          <View style={{flex:0.25}} />
          <DebugIcon sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
        </BackgroundNoNotification>
      );
    }

    let devOptions = [];
    devOptions.push({
      label: "Enable dev controller",
      type: 'button',
      style: { color: colors.iosBlue.hex },
      icon: <IconButton name="ios-cog" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.csOrange.hex }}/>,
      callback: async () => {
        console.log(await HUB_API.enableDeveloperController(hub))
      }
    });
    devOptions.push({
      label: "Enable log controller",
      type: 'button',
      style: { color: colors.iosBlue.hex },
      icon: <IconButton name="ios-copy" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.green.hex }}/>,
      callback: () => {
      }
    });
    devOptions.push({
      label: "Get active options...",
      type: 'button',
      style: { color: colors.iosBlue.hex },
      icon: <IconButton name="md-cloud-download" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.iosBlue.hex }}/>,
      callback: () => {
      }
    });
    devOptions.push({type:'explanation', label:"AVAILABLE OPTIONS"})
    if (this.state.obtainedSettings === false) {
      devOptions.push({
        label: "Get active options first...",
        type: 'info',
        icon: <IconButton name="md-hand" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.green.hex }}/>,
        callback: (newValue) => {

        }
      });
    }
    else {
      devOptions.push({
        label: "Act on switch events",
        value: true,
        disabled: true,
        type: 'switch',
        icon: <IconButton name="md-power" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
        callback: (newValue) => {
        }
      });
    }


    return (
      <BackgroundNoNotification image={background.menu} >
        <View style={{flex:0.25}} />
        <Text style={deviceStyles.header}>Hub developer options</Text>
        <View style={{flex:0.1}} />
        <ListEditableItems items={devOptions} separatorIndent={true}/>
        <View style={{flex:0.1}} />
        <View style={{flex:0.25}} />
        <DebugIcon sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
      </BackgroundNoNotification>
    );
  }
}

