import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import { RefreshControl, ScrollView, Text, TextStyle, View } from "react-native";
import { ListEditableItems } from '../../components/ListEditableItems'
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";

import { FileUtil } from "../../../util/FileUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { background, colors, screenWidth } from "../../styles";
import { CLOUD } from "../../../cloud/cloudAPI";
import { BackgroundNoNotification } from "../../components/BackgroundNoNotification";
import { Localization_LOG_PREFIX, LocalizationMonitor } from "../../../backgroundProcesses/LocalizationMonitor";
import { string } from "prop-types";

const RNFS = require('react-native-fs');

export class SettingsLocalizationMonitor extends LiveComponent<any, {content: string[], gaps: number[], updating: boolean}> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Localization", clear:true});
  }

  locationData = [];
  constructor(props) {
    super(props);

    this.extractLocalizationMonitor();

    this.locationData = [];

    this.state = { content:[], gaps:[], updating:false }
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'clear') {
      LocalizationMonitor.clear()
        .then(() => {
          this.extractLocalizationMonitor();
        })
    }
  }


  extractLocalizationMonitor() {
    let storagePath = FileUtil.getPath();
    let filesToOpen = [];
    let openedFiles = [];
    this.locationData = [];

    let checkToOpen = () => {
      if (filesToOpen.length == openedFiles.length) {
        this._process()
      }
    }

    let state = core.store.getState();
    let spheres = state.spheres;
    RNFS.readdir(storagePath)
      .then((files) => {
        for (let i = 0; i < files.length; i++) {
          if (files[i].substr(0, Localization_LOG_PREFIX.length) === Localization_LOG_PREFIX) {
            filesToOpen.push(files[i]);
          }
        }

        if (filesToOpen.length === 0) {
          return this._process();
        }
        for (let i = 0; i < filesToOpen.length; i++) {
          RNFS.readFile(storagePath + "/" + filesToOpen[i])
            .then((data) => {
              openedFiles.push(filesToOpen[i])
              let lines = data.split("\n");
              lines.pop()
              for (let j = 0; j < lines.length; j++) {
                let ids = lines[j].split(";");

                let result = '\n'
                let sphere = spheres[ids[0]];
                if (sphere === undefined) {
                  result += 'Removed sphere\n\n';
                }
                else {
                  result += sphere.config.name + ' - '
                  if (sphere.locations[ids[1]] === undefined) {
                    if (ids[1].substr(0,4) === "str:") {
                      result += ids[1].substr(4) + '\n\n'
                    }
                    else {
                      result += 'Removed location\n\n'
                    }
                  }
                  else {
                    result += sphere.locations[ids[1]].config.name + '\n\n';
                  }
                }

                this.locationData.push({t: Number(ids[2]), data: result});
              }
              checkToOpen();
            })
            .catch((err) => { openedFiles.push(filesToOpen[i]); checkToOpen();})
        }
      }).catch(() => {})
  }


  _process() {
    let content = [];
    let gaps = [];
    let now = Date.now();

    if (this.locationData.length > 0) {
      this.locationData.sort((a,b) => { return a.t - b.t });
      let timeStart = this.locationData[0].t;
      let stringPart = getTimeString(this.locationData[0].t) + this.locationData[0].data;
      content.push(stringPart);
      for (let i = 1; i < this.locationData.length; i++) {
        stringPart = getTimeString(this.locationData[i].t) + this.locationData[i].data;
        let dt = this.locationData[i].t - this.locationData[i - 1].t;
        gaps.push(dt);
        content.push(stringPart);
      }

      let dt = now - this.locationData[this.locationData.length - 1].t
      gaps.push(dt);
    }

    this.setState({content:content, gaps: gaps, updating: false})
  }

  _getContent() {
    let items = []
    let contentStyle : TextStyle = { fontSize: 15, width:screenWidth-60, height:50 }
    let gapStyle     : TextStyle = { fontSize: 15, width:screenWidth-60, height:30, textAlign:'right', fontWeight:'bold', color: colors.blue.hex}

    if (this.state.content.length > 0) {
      items.push(<Text key={'content' + 0} style={contentStyle}>{this.state.content[0]}</Text>)
      if (this.state.content.length === 1) {
        return items;
      }
      for (let i = 1; i < this.state.content.length; i++) {
        items.push(<Text key={'gap' + i} style={gapStyle}>{xUtil.getDurationFormat(this.state.gaps[i - 1])}</Text>)
        items.push(<Text key={'content' + i} style={contentStyle}>{this.state.content[i]}</Text>)
      }
      items.push(<Text key={'gap_end'} style={gapStyle}>{xUtil.getDurationFormat(this.state.gaps[this.state.gaps.length-1])}</Text>)

      items.reverse();
    }

    if (items.length === 0) {
      items.push(<Text style={contentStyle} key={"noData"}>{ "No data yet" }</Text>);
    }
    return items;
  }


  render() {
    return (
      <BackgroundNoNotification image={background.menu} hideNotifications={true}>
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{flexGrow:1}}>
          <RefreshControl
            refreshing={this.state.updating}
            onRefresh={() => { this.setState({updating: true}); this.extractLocalizationMonitor()}}
            title={ "Updating..." }
            titleColor={colors.darkGray.hex}
            colors={[colors.csBlue.hex]}
            tintColor={colors.csBlue.hex}
          />
          <View style={{flex:1, padding:30}}>
            { this._getContent() }
          </View>
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}

const getTimeString = function(timestamp) {
  let time = new Date(timestamp);
  let month = time.getMonth() + 1
  let day = time.getDate()
  let hour = time.getHours()
  let minutes = time.getMinutes()

  return xUtil.pad(month) + "/" + xUtil.pad(day) + " " + xUtil.pad(hour) + ":" + xUtil.pad(minutes);
}