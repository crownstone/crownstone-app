import * as React from 'react';
import { Platform, Vibration, Text, View } from "react-native";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Bluenet } from "../../../native/libInterface/Bluenet";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import KeepAwake from 'react-native-keep-awake';
import {FINGERPRINT_SIZE_THRESHOLD, FingerprintUtil} from "../../../util/FingerprintUtil";
import {core} from "../../../Core";
import { FingerprintCollector } from "../../../localization/fingerprints/FingerprintCollector";


export const MIN_DATA_COUNT = 120;

export class RoomTraining_training extends LiveComponent<{ sphereId: sphereId, locationId: locationId, type: FingerprintType, componentId: string, minRequiredSamples?: number}, any> {
  static options(props) {
    let location = Get.location(props.sphereId, props.locationId);
    return TopBarUtil.getOptions({title: `Locating the ${location.config.name}`, cancel: true});
  }

  trainingData : FingerprintCollector;
  minRequiredSamples : number = MIN_DATA_COUNT;

  constructor(props) {
    super(props);

    if (this.props.minRequiredSamples) {
      this.minRequiredSamples = this.props.minRequiredSamples;
    }

    this.state = {
      showMoveAround: false,
      distance: 0,
      dataCount:0
    };

    this.trainingData = new FingerprintCollector(this.props.sphereId, this.props.locationId, this.props.type);

    this.trainingData.tick = (amountOfPoints) => {
      this.setState({dataCount: amountOfPoints});

      if (amountOfPoints === this.minRequiredSamples) {
        if (Platform.OS === 'android') {
          Vibration.vibrate([0,400]);
        }
        else {
          Vibration.vibrate([0]);
        }
        return;
      }

      if (Platform.OS === "android") {
        let pattern = [0,50,10,30]
        Vibration.vibrate(pattern);
      }
      else {
        Bluenet.vibrate("success");
      }

    }

  }

  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      this.trainingData.stop();
      NavigationUtil.back();
    }
  }

  componentDidMount() {
    this.trainingData.start();
  }

  componentWillUnmount() {
    this.trainingData.stop();
  }

  render() {
    return (
      <Background>
        <View style={{height: topBarHeight}} />
        <KeepAwake />
        <View style={{height:30}}/>
        <Text style={styles.header}>{"Listening..."}</Text>
        <Text style={styles.boldExplanation}>{"Move around the room to collect the measurements!"}</Text>

        <View style={{flex:1}}/>
        <View style={{height:0.35*screenHeight, width:screenWidth, ...styles.centered, backgroundColor:colors.green.rgba(0.2)}}><Text>animation</Text></View>
        <View style={{flex:1}}/>

        { this.state.dataCount < this.minRequiredSamples  && <Text style={styles.explanation}>{"Once I have collected enough information, I'll let you know!"}</Text>}
        { this.state.dataCount < this.minRequiredSamples  && <Text style={styles.header}>{`(${this.state.dataCount} / ${this.minRequiredSamples})`}</Text>}

        { this.state.dataCount >= this.minRequiredSamples && <Text style={styles.explanation}>{"You can collect more if you want. The more the better!"}</Text>}
        { this.state.dataCount >= this.minRequiredSamples && <Text style={{...styles.header, color: colors.green.hex}}>{`Collected ${this.state.dataCount} points so far!`}</Text>}

        <View style={{flex:1}}/>

        { this.state.dataCount >= this.minRequiredSamples && <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center',}}>
          <Button
            backgroundColor={colors.green.hex}
            label={ "Finish!"}
            callback={() => {
              this.trainingData.stop();

              // if we train the in-hand type of fingerprint, we can delete the other types.
              // the in-hand fingerprints are a sort of baseline, whereas the in-pocket type is additional.
              if (this.props.type === 'IN_HAND') {
                checkToRemoveBadFingerprints(this.props.sphereId, this.props.locationId);
              }

              if (this.state.dataCount >= this.minRequiredSamples) {
                this.trainingData.store();
              }
              NavigationUtil.navigate('RoomTraining_conclusion', this.props);
            }}
          />
        </View>}
      </Background>
    );
  }
}

function checkToRemoveBadFingerprints(sphereId, locationId) {
  let location = Get.location(sphereId, locationId);
  let actions = [];
  for (let fingerprintId in location.fingerprints.raw) {
    if (!FingerprintUtil.isFingerprintGoodEnough(sphereId, locationId, fingerprintId)) {
      actions.push({type:"REMOVE_FINGERPRINT_V2", sphereId, locationId, fingerprintId});
    }
  }

  if (actions.length > 0) {
    core.store.batchDispatch(actions);
  }

}
