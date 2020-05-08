import { LiveComponent } from "../../LiveComponent";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { FileUtil } from "../../../util/FileUtil";
import { DfuHelper } from "../../../native/firmware/DfuHelper";
import { FocusManager } from "../../../backgroundProcesses/dev/FocusManager";
import { core } from "../../../core";
import { ActivityIndicator, Alert, View, Text, ScrollView } from "react-native";
import { colors, screenWidth } from "../../styles";
import React from "react";
import { AnimatedBackground } from "../../components/animated/AnimatedBackground";
import { ListEditableItems } from "../../components/ListEditableItems";

const RNFS = require('react-native-fs');


export class DEV_DFU extends LiveComponent<{
  item: crownstoneAdvertisement,
  handle: string,
  name: string,
  mode:string,
  componentId: string
}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: props.name})
  }

  rssiAverage = null;
  scanning = false;
  unsubscribe = [];

  constructor(props) {
    super(props);

    this.state = { activeFirmware: null, availableFirmwares: [], dfuActive: false, dfuProgress:0 };
    this.getZips();
  }

  getZips() {
    let localPath = FileUtil.getPath()
    RNFS.readDir(localPath)
      .then((data) => {
        let zippies = [];
        data.forEach((d) => {
          let name = d.name;
          if (name.substr(name.length-4) === '.zip') {
            zippies.push(name);
          }
        })
        this.setState({availableFirmwares: zippies});
      })
  }


  _dfuCrownstone() {
    let state = core.store.getState();
    this.setState({dfuActive: true, dfuProgress:0})

    let helper = new DfuHelper(
      FocusManager.crownstoneState.referenceId || state.devApp.sphereUsedForSetup,
      200,
      { config: { handle: this.props.handle }})
    return helper.updateBootloader(
      {setupMode: FocusManager.crownstoneMode === 'setup', dfuMode: FocusManager.crownstoneMode === 'dfu' },
      FileUtil.getPath(this.state.activeFirmware),
      (progress) => { this.setState({dfuProgress: progress}) }
      )
      .then(() => {
        this.setState({dfuActive: false, dfuProgress:0})
        Alert.alert("SUCCESS")
      })
      .catch((err) => {
        this.setState({dfuActive: false, dfuProgress:0})
        Alert.alert("FAILED", err)
      })
  }

  _getItems(explanationColor) {
    let items = [];

    if (this.state.mode === 'unverified') {
      items.push({label:"Disabled for unverified Crownstone.", type: 'info'});
    }
    else {
      items.push({label:"AVAILABLE DFU ZIPS", type: 'explanation', color: explanationColor});
      let hasFirmwares = false;
      this.state.availableFirmwares.forEach((fw) => {
        let textColor = colors.blue.hex;
        let buttonBackground = colors.white.rgba(0.9)
        hasFirmwares = true;
        if (this.state.activeFirmware === fw) {
          textColor = colors.black.hex;
          buttonBackground = colors.green.rgba(0.9)
        }
        items.push({
          label: fw,
          type: 'button',
          buttonBackground: buttonBackground,
          style: {color: textColor},
          callback: () => {
            this.setState({activeFirmware: fw})
          }
        });
      })

      if (!hasFirmwares) {
        items.push({label:"No firmwares on phone.", type: 'info'});
      }

      items.push({type: 'spacer'});
      items.push({
        label: "Check for Zips",
        type: 'button',
        style: {color:colors.blue.hex},
        callback: () => {
          this.getZips()
        }
      });
      items.push({label:"Zips can be put on phone via iTunes.", type: 'explanation', color: explanationColor, below:true});


      if (this.state.activeFirmware !== null) {
        items.push({
          label: this.state.dfuActive ? "DFUing up Crownstone..." : "Perform DFU",
          type: 'button',
          style: { color: colors.blue.hex },
          progress: this.state.dfuProgress,
          callback: () => {
            this._dfuCrownstone();
          }
        })
      }
      else {
        items.push({
          label: "Perform DFU",
          type: 'button',
          style: {color:colors.lightGray.hex},
          callback: () => {
            Alert.alert("Select a firmware", "Can't DFU without FW", [{text:'OK'}])
          }
        });
      }

      if (this.state.dfuActive) {
        items.push({
          __item: <View style={{flexDirection:'row', width: screenWidth, height: 50, backgroundColor: colors.white.hex, alignItems:'center', justifyContent:'center'}}>
            <ActivityIndicator color={colors.csBlueDark.hex} size={"large"} /><Text style={{fontSize:16, color:colors.csBlueDark.hex, fontWeight:'bold'}}>Firmware is updating...</Text>
            <View style={{position:'absolute', bottom:0, height:5, width: this.state.dfuProgress * screenWidth, backgroundColor: colors.green.hex}} />
          </View>

        });
      }
    }




    items.push({type: 'spacer'});
    items.push({type: 'spacer'});
    items.push({type: 'spacer'});


    return items;
  }

  render() {
    let backgroundImage = core.background.light;
    let explanationColor = colors.black.rgba(0.9);

    switch (FocusManager.crownstoneMode ) {
      case "setup":
        explanationColor = colors.white.hex;
        backgroundImage = require('../../../images/backgrounds/blueBackground2.png');
        break;
      case "verified":
        backgroundImage = core.background.light;
        break;
      case "unverified":
        backgroundImage = core.background.menu;
        break;
      case "dfu":
        backgroundImage = require('../../../images/backgrounds/upgradeBackground.png');
        break;
    }

    return (
      <AnimatedBackground image={backgroundImage} hideNotifications={true}>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(explanationColor)} separatorIndent={true} />
        </ScrollView>
      </AnimatedBackground>
    )
  }
}