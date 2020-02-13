
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuBatch", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  ScrollView, Text, Vibration,
  View
} from "react-native";
import { colors, screenWidth, styles} from "../styles";
import { core } from "../../core";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Background } from "../components/Background";
import { FadeIn } from "../components/animated/FadeInView";
import KeepAwake from 'react-native-keep-awake';
import { DfuDeviceUpdaterEntry } from "../components/deviceEntries/DfuDeviceUpdaterEntry";
import { NavigationUtil } from "../../util/NavigationUtil";
import { BatchDFUCrownstonesBanner } from "../components/animated/BatchDFUCrownstonesBanner";
import { TopBarUtil } from "../../util/TopBarUtil";


export class DfuBatch extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Updating_"), disableBack: true});
  }

  failedUpdate = {};
  finishedUpdate = {};

  constructor(props) {
    super(props);

    this.state = {
      icon1Visible:  Math.random() < 0.5,
      icon2Visible:  Math.random() < 0.5,
      icon3Visible:  Math.random() < 0.5,
      headerColor:  0,
      updatingCrownstoneIndex: 0
    };
  }

  _renderer(item, index, stoneId) {
    return (
      <View key={stoneId + '_DFU_entry'}>
        <FadeIn style={{width: screenWidth, backgroundColor: "transparent"}}>
          <DfuDeviceUpdaterEntry
            sphereId={this.props.sphereId}
            stoneId={stoneId}
            handle={item.handle}
            item={item}
            isUpdating={this.state.updatingCrownstoneIndex === index}
            failed={ (attemptCount, cloudIssue = false) => {
              this._getNext(stoneId, index, false, attemptCount, cloudIssue);
            }}
            success={(attemptCount) => {
              this._getNext(stoneId, index, true, attemptCount);
            }}
          />
        </FadeIn>
      </View>
    );
  }

  _getNext(stoneId, index, success, attemptCount, cloudIssue = false) {
    if (success) {
      this.finishedUpdate[index] = {stoneId : stoneId, state: true};;
      this.failedUpdate[index] = false;
      if (this.state.updatingCrownstoneIndex + 1 === this.props.stoneIdsToUpdate.length) {
        // DONE, do the retries
        this._doRetries()
      }
      else {
        // next one!
        this.setState({updatingCrownstoneIndex: this.state.updatingCrownstoneIndex+1})
      }
    }
    else {
      this.finishedUpdate[index] = {stoneId : stoneId, state: false};
      this.failedUpdate[index] = {stoneId : stoneId, attempts: attemptCount};
      if (this.state.updatingCrownstoneIndex + 1 === this.props.stoneIdsToUpdate.length) {
        // do the retries! If it failed by the cloud issue, we can tell the wrap up screen here.
        this._doRetries(cloudIssue)
      }
      else {
        // next one!
        this.setState({updatingCrownstoneIndex: this.state.updatingCrownstoneIndex+1})
      }
    }
  }

  _doRetries(cloudIssue = false) {
    let indexToRetry = null;
    let maxRetries = 2;
    if (Platform.OS === 'android') {
      maxRetries = 4;
    }
    let amountOfCrownstones = this.props.stoneIdsToUpdate.length
    for (let i = 0; i < this.props.stoneIdsToUpdate.length; i++) {
      let index = (i + this.state.updatingCrownstoneIndex+1) % amountOfCrownstones;
      if (this.finishedUpdate[index] && this.finishedUpdate[index].state === false &&
          this.failedUpdate[index]   && this.failedUpdate[index].attempts < maxRetries ||
          !this.finishedUpdate[index]) {
        indexToRetry = index;
        break;
      }
    }

    if (indexToRetry === null) {
      // Finish. Notify user about failed updates and what to do next.
      this.setState({updatingCrownstoneIndex: this.state.updatingCrownstoneIndex+1})
      let amountOfSuccessfulUpdates = 0;
      Object.keys(this.finishedUpdate).forEach((taskId) => {
        if (this.finishedUpdate[taskId].state === true) {
          amountOfSuccessfulUpdates++;
        }
      })

      Vibration.vibrate(400, false);
      NavigationUtil.navigate("DfuFinished", {
        sphereId:     this.props.sphereId,
        successCount: amountOfSuccessfulUpdates,
        cloudIssue:   cloudIssue
      });
    }
    else {
      if (this.state.updatingCrownstoneIndex === indexToRetry) {
        // ugly, but if we retry the same one, it wont do anything cuz theres no change...
        this.setState({updatingCrownstoneIndex: 1e8}, () => { this.setState({updatingCrownstoneIndex: indexToRetry})})
      }
      else {
        // do a retry
        this.setState({updatingCrownstoneIndex: indexToRetry})
      }

    }
  }

  _getStoneList() {
    let stoneArray = [];
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return { stoneArray, ids: [] }};
    let stones = sphere.stones;

    this.props.stoneIdsToUpdate.forEach((stoneId) => {
      if (stones[stoneId]) {
        stoneArray.push(stones[stoneId]);
      }
    });

    return { stoneArray, ids: this.props.stoneIdsToUpdate };
  }


  render() {
    const { stoneArray, ids } = this._getStoneList();

    let borderStyle = { borderColor: colors.black.rgba(0.2), borderBottomWidth: 1 };
    return (
      <Background hasNavBar={false} image={core.background.light} hideNotifications={true}>
        <KeepAwake />
        <View style={{...styles.centered, width: screenWidth, height: 110, ...borderStyle, overflow:'hidden'}}>
          <BatchDFUCrownstonesBanner componentId={this.props.componentId} height={110} />
          <View style={{...styles.centered, flex:1, height: 110}}>
            <View style={{flex:1}} />
            <Text style={{color: colors.black.hex, fontSize:20, fontWeight: "bold", width:screenWidth - 30, textAlign:'center'}}>{ lang("Updating_your_Crownstones_") }</Text>
            <View style={{flex:0.25}} />
            <Text style={{color: colors.black.hex, fontSize:15, width:screenWidth - 30, textAlign:'center'}}>{ "Some Crownstones may turn on while updating." }</Text>
            <View style={{flex:1}} />
          </View>
        </View>
        <View style={{...styles.centered, width:screenWidth, height:95, backgroundColor: colors.white.rgba(0.3), ...borderStyle}}>
          <Text style={{color: colors.black.hex, fontSize:14, fontWeight: "bold", width:screenWidth - 30, textAlign:'center'}}>{ lang("This_can_take_a_while_so_j") }</Text>
        </View>
        <ScrollView style={{position:'relative', top:-1}}>
          <SeparatedItemList
            items={stoneArray}
            ids={ids}
            separatorIndent={false}
            renderer={this._renderer.bind(this)}
          />
        </ScrollView>
      </Background>
    );
  }
}

