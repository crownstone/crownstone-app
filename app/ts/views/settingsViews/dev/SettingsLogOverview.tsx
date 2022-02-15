import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView} from "react-native";

import { BackgroundNoNotification } from '../../components/BackgroundNoNotification'
import { ListEditableItems } from '../../components/ListEditableItems'
import { background, colors } from "../../styles";
import { getAllLogData} from "../../../logging/LogUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import {core} from "../../../Core";
import Share from "react-native-share";
import {LOGw} from "../../../logging/Log";
import {FileUtil} from "../../../util/FileUtil";


export class SettingsLogOverview extends LiveComponent<any, { logInformation: any[], logsLoaded: boolean, selectedUrls: string[] }> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Log management", done: true });
  }

  mounted = false;

  constructor(props) {
    super(props);

    this.state = {
      logInformation: [],
      logsLoaded: false,
      selectedUrls: []
    };

    this.getLogs();
  }

  async getLogs() {
    if (this.mounted) { this.setState({logsLoaded: false}); }
    else              {
      // @ts-ignore
      this.state.logsLoaded = false;
    }
    let results = await getAllLogData();

    if (this.mounted) { this.setState({logInformation: results, logsLoaded: true});; }
    else {
      // @ts-ignore
      this.state.logsLoaded     = true;
      // @ts-ignore
      this.state.logInformation = results;
    }
  }

  navigationButtonPressed({ buttonId }) {
    switch (buttonId) {
      case 'done':
        core.eventBus.emit("showPopup", {
          tite: "What would you like to do?",
          buttons: [
            {text: "Share", testID:"Share", callback: async () => {
                try {
                  let result = await Share.open({ urls: this.state.selectedUrls.map((path) => { return `file://${path}`; }) });
                }
                catch (err) {
                  LOGw.info("Something went wrong while sharing data:",err)
                }
              }},
            {text: "Delete", testID:"Delete", callback: () => {
                Alert.alert(`Are you sure you want to delete these files?`, "This cannot be undone.", [{text:"Cancel"},{text:"Yes", style:'destructive', onPress: async () => {
                    for (let fileURL of this.state.selectedUrls) {
                      await FileUtil.safeDeleteFile(fileURL);
                    }
                    await this.getLogs();
                  }}])
              }},
          ]})
        break;
    }
  }

  componentDidMount() {
    this.mounted = true;
  }

  _getItems() {
    let items = [];
    // sizes of log files (app only, in MBs)
      // press --> pop up, share, delete
    items.push({ type:'explanation', label: "SELECT LOG FILES" });
    if (this.state.logsLoaded === false) {
      items.push({ type:'info', label: "Loading..." });
    }
    else if (this.state.logInformation.length === 0) {
      items.push({ type:'button', label: "No logs yet...", callback:() => { this.getLogs() }});
    }
    else {
      for (let file of this.state.logInformation) {
        let name = file.filename.replace(".log","");
        let index = this.state.selectedUrls.indexOf(file.path);
        items.push({
          label: `${name} - ${Math.round(file.size/1024/1024)}MB`,
          type: 'button',
          buttonBackground: index === -1 ? colors.white.hex : colors.green.rgba(0.75),
          style: {color: colors.iosBlue.hex},
          callback:() => {
            let newUrls = [...this.state.selectedUrls]
            if (index === -1) {
              newUrls.push(file.path);
            }
            else {
              newUrls.splice(index,1)
            }
            this.setState({selectedUrls: newUrls});
          }
        });
      }
    }



    items.push({ type:'spacer' });
    items.push({ type:'spacer' });

    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={background.menu} >
        <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "position" : "height"}>
          <ScrollView keyboardShouldPersistTaps="always">
            <ListEditableItems items={this._getItems()} separatorIndent={true} />
          </ScrollView>
        </KeyboardAvoidingView>
      </BackgroundNoNotification>
    );
  }
}
