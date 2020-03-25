import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import { RefreshControl, ScrollView, Text, TextStyle, View } from "react-native";
import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";

import { FileUtil } from "../../../util/FileUtil";
import { UPTIME_LOG_PREFIX, UptimeMonitor } from "../../../backgroundProcesses/UptimeMonitor";
import { xUtil } from "../../../util/StandAloneUtil";
import { colors, screenWidth } from "../../styles";
import { CLOUD } from "../../../cloud/cloudAPI";

const RNFS = require('react-native-fs');

export class SettingsUptime extends LiveComponent<any, {content: string[], gaps: number[], updating: boolean}> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Uptime", clear:true});
  }

  timeArray = [];
  constructor(props) {
    super(props);

    this.extractUptime();

    this.timeArray = [];

    this.state = { content:[], gaps:[], updating:false }
  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'clear') {
      UptimeMonitor.clear()
        .then(() => {
          this.extractUptime();
        })
    }
  }


  extractUptime() {
    let storagePath = FileUtil.getPath();
    let filesToOpen = [];
    let openedFiles = [];
    this.timeArray = [];

    let checkToOpen = () => {
      if (filesToOpen.length == openedFiles.length) {
        this._process()
      }
    }
    RNFS.readdir(storagePath)
      .then((files) => {
        for (let i = 0; i < files.length; i++) {
          if (files[i].substr(0, UPTIME_LOG_PREFIX.length) === UPTIME_LOG_PREFIX) {
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
              let split = data.split("\n");
              split.pop()
              for (let i = 0; i < split.length; i++) { this.timeArray.push(Number(split[i])); }
              checkToOpen();
            })
            .catch((err) => { openedFiles.push(filesToOpen[i]); checkToOpen();})
        }
      }).catch(() => {})
  }


  _process() {
    let content = [];
    let gaps = [];
    if (this.timeArray.length > 0) {
      this.timeArray.sort();
      const getString = function(timestamp) {
        let time = new Date(timestamp);
        let month = time.getMonth() + 1
        let day = time.getDate()
        let hour = time.getHours()
        let minutes = time.getMinutes()

        return month + "/" + xUtil.pad(day) + " " + xUtil.pad(hour) + ":" + xUtil.pad(minutes);
      }

      let timeStart = this.timeArray[0];
      let stringPart = getString(this.timeArray[0]);
      for (let i = 1; i < this.timeArray.length; i++) {
        let dt = this.timeArray[i] - this.timeArray[i - 1];
        if (dt > 2 * 60 * 1000) {
          stringPart += " --- " + getString((this.timeArray[i - 1])) + " (" + calcGap(this.timeArray[i-1] - timeStart) + ")";
          content.push(stringPart);
          gaps.push(dt);
          stringPart = getString(this.timeArray[i]);
          timeStart = this.timeArray[i];
        }
      }

      let now = new Date().valueOf();
      let dt = now - this.timeArray[this.timeArray.length - 1]
      if (dt > 2 * 60 * 1000) {
        stringPart += " --- " + getString((this.timeArray[this.timeArray.length - 1]));
        content.push(stringPart);
        gaps.push(dt);
      }
      else {
        stringPart += " --- now"  + " (" + calcGap(now - timeStart) + ")";;
      }
      content.push(stringPart);
    }

    this.setState({content:content, gaps: gaps, updating: false})
  }

  _getContent() {
    let items = []
    let contentStyle : TextStyle = { fontSize: 15, width:screenWidth-60, height:30 }
    let gapStyle     : TextStyle = { fontSize: 15, width:screenWidth-60, height:30, textAlign:'right', fontWeight:'bold', color: colors.red.hex}

    if (this.state.content.length > 0) {
      items.push(<Text key={'content' + 0} style={contentStyle}>{this.state.content[0]}</Text>)
      if (this.state.content.length === 1) {
        return items;
      }
      for (let i = 1; i < this.state.content.length; i++) {
        items.push(<Text key={'gap' + i} style={gapStyle}>{calcGap(this.state.gaps[i - 1])}</Text>)
        items.push(<Text key={'content' + i} style={contentStyle}>{this.state.content[i]}</Text>)
      }

      items.reverse();
    }

    if (items.length === 0) {
      items.push(<Text style={contentStyle} key={"noData"}>No data yet...</Text>);
    }
    return items;
  }


  render() {
    return (
      <Background image={core.background.menu} hideNotifications={true}>
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{flexGrow:1}}>
          <RefreshControl
            refreshing={this.state.updating}
            onRefresh={() => { this.setState({updating: true}); this.extractUptime()}}
            title={ "Updating..." }
            titleColor={colors.darkGray.hex}
            colors={[colors.csBlue.hex]}
            tintColor={colors.csBlue.hex}
          />
          <View style={{flex:1, padding:30}}>
            { this._getContent() }
          </View>
        </ScrollView>
      </Background>
    );
  }
}

let calcGap = function(ms) {
  let days = Math.floor(ms / (24*3600*1000))
  let hours = Math.floor(ms / (3600*1000))%24;
  let minutes = Math.floor(ms / (60*1000))%60;
  let seconds = Math.floor(ms / (1000))% 60
  if (ms > 24*3600*1000) {
    return days + "d " + hours + "h " + minutes + "m " + seconds + 's';
  }
  else if (ms > 3600*1000) {
    // show hours
    return hours + "h " + minutes + "m " + seconds + 's';
  }
  else {
    return minutes + "m " + seconds + 's';
  }
}