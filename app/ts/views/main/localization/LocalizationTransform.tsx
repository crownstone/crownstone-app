
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationAdvancedSettings", key)(a,b,c,d,e);
}
import * as React from 'react';

import { TopBarUtil } from "../../../util/TopBarUtil";
import {TRANSFORM_MIN_SAMPLE_THRESHOLD, TransformManager} from "../../../localization/TransformManager";
import DeviceInfo from "react-native-device-info";
import { core } from "../../../Core";
import {ActivityIndicator, Alert, Settings, Text, View} from "react-native";
import { SettingsBackground } from "../../components/SettingsBackground";
import { colors, screenWidth, styles } from "../../styles";
import { Get } from "../../../util/GetUtil";
import { SphereDeleted } from "../../static/SphereDeleted";
import { ScaledImage } from "../../components/ScaledImage";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { Button } from "../../components/Button";
import {OnScreenNotifications} from "../../../notifications/OnScreenNotifications";



export class LocalizationTransform extends React.Component<
  {
    sphereId: sphereId,
    otherUserId: string,
    otherDeviceId: string,
    deviceString: string,
    host: boolean,
    sessionId?:string
  },
  {
    sessionState: TransformSessionState,
    errorMessage: string,
    collectionRecommendation: CollectionState,
    collectionsDone: number,
    collectionStats: { A: TransformStats, B: TransformStats },
    currentCollection: Record<string, rssi[]>,
    currentCollectionDataCount: number,
  }> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Optimize!"})
  }

  transformManager;
  user : Partial<UserData> = {};

  constructor(props) {
    super(props);
    this.state = {
      sessionState: "UNINITIALIZED",
      errorMessage: '',
      collectionRecommendation: "UNINITIALIZED",
      collectionStats: {A:{close:0, mid:0, far:0, total:0}, B:{close:0, mid:0, far:0, total:0}},
      collectionsDone: 0,
      currentCollection: {},
      currentCollectionDataCount: 0
    }

    let state = core.store.getState();

    let sphere = Get.sphere(props.sphereId);
    if (props.userId === state.user.userId) {
      // this is you but with a different device.
      this.user = state.user;
    }
    else {
      this.user = sphere.users[props.userId];
    }

    if (props.host) {
      this.transformManager = new TransformManager(this.props.sphereId, state.user.userId, DeviceInfo.getDeviceId(), this.props.otherUserId, this.props.otherDeviceId);
    }
    else {
      this.transformManager = new TransformManager(this.props.sphereId, this.props.otherUserId, this.props.otherDeviceId, state.user.userId, DeviceInfo.getDeviceId(), props.sessionId);
    }

    this.transformManager.stateUpdate = (sessionState, errorMessage) => { this.setState({sessionState: sessionState, errorMessage}); };

    this.transformManager.collectionUpdate = (collectionCount : number, collectedData: Record<string, rssi[]>) => {
      this.setState({currentCollection: collectedData, currentCollectionDataCount: collectionCount});
    }
    this.transformManager.collectionFinished = (recommendation, collectionsFinished, stats) => {
      this.setState({collectionRecommendation: recommendation, collectionsDone: collectionsFinished, collectionStats: stats});
    }
  }

  componentDidMount() {
    // start the transform session
    this.transformManager.start();
  }

  componentWillUnmount() {
    if (this.props.host === false) {
      OnScreenNotifications.removeNotification(this.props.sessionId);
    }
    this.transformManager.destroy();
  }

  renderContent() {
    switch (this.state.sessionState) {
      case "UNINITIALIZED":
      case "AWAITING_SESSION_REGISTRATION":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "Starting..." }</Text>
            <View style={{flex:1}} />
            <ActivityIndicator size="large" color={colors.csBlue.hex} />
            <View style={{flex:2}} />
          </React.Fragment>
        );
      case "AWAITING_SESSION_START":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "Connecting..." }</Text>
            <View style={{flex:1}} />
            <ActivityIndicator size="large" color={colors.csBlue.hex} />
            <View style={{flex:2}} />
          </React.Fragment>
        );
      case "AWAITING_INVITATION_ACCEPTANCE":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "Waiting for the other device to accept the request..." }</Text>
            <View style={{flex:1}} />
            <ActivityIndicator size="large" color={colors.csBlue.hex} />
            <View style={{flex:2}} />
          </React.Fragment>
        );
      case "SESSION_WAITING_FOR_COLLECTION_INITIALIZATION":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "Preparing measurement" }</Text>
            <Text style={styles.boldExplanation}>{ "Place both devices side by side on a flat surface, 10 cm apart from eachother." }</Text>
            { this.props.host ? <Text style={styles.boldExplanation}>{ "Press Next when you're both ready!" }</Text> : <Text style={styles.boldExplanation}>{ "Waiting for other device..." }</Text> }
            <View style={{height:30}} />
            <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={1110} sourceHeight={662} targetWidth={0.8*screenWidth} />
            <View style={{flex:1}} />
            { this.props.host ?
              <Button
                backgroundColor={colors.blue.rgba(0.75)}
                icon={'ios-play'}
                label={ "Next"}
                callback={() => { this.transformManager.requestCollectionSession(); }}
              /> :
              <ActivityIndicator size="large" color={colors.csBlue.hex} />
            }
            <View style={{height:30}} />
          </React.Fragment>
        );
      case "SESSION_WAITING_FOR_COLLECTION_START":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "Preparing measurement" }</Text>
            <Text style={styles.boldExplanation}>{ "Place both devices side by side on a flat surface, 10 cm apart from eachother." }</Text>
            <Text style={styles.boldExplanation}>{ "Waiting to start..." }</Text>
            <View style={{height:30}} />
            <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={1110} sourceHeight={662} targetWidth={0.8*screenWidth} />
            <View style={{flex:1}} />
            <ActivityIndicator size="large" color={colors.csBlue.hex} />
            <View style={{height:30}} />
          </React.Fragment>
        );
      case "COLLECTION_STARTED":
      case "WAITING_ON_OTHER_USER":
      case "WAITING_TO_FINISH_COLLECTION":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "Measuring..." }</Text>
            <Text style={styles.boldExplanation}>{ "Please wait for the measurement to finish." }</Text>
            <Text style={styles.explanation}>{ "This should take around 20 seconds..." }</Text>
            <View style={{height:30}} />
            <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={1110} sourceHeight={662} targetWidth={0.8*screenWidth} />
            <View style={{flex:1}} />
            <ActivityIndicator size="large" color={colors.csBlue.hex} />
            <View style={{height:30}} />
          </React.Fragment>
        );
      case "COLLECTION_COMPLETED":
        switch (this.state.collectionRecommendation) {
          case "CLOSER":
            <React.Fragment>
              <Text style={styles.header}>{ "Next measurement" }</Text>
              <Text style={styles.boldExplanation}>{ "Great! Now repeat this in a different spot, a bit close to where your Crownstones are!" }</Text>
              <CollectionStats stats={this.state.collectionStats} />
              { this.props.host ? <Text style={styles.boldExplanation}>{ "Press Next when you're both ready!" }</Text> : <Text style={styles.boldExplanation}>{ "Waiting for other device..." }</Text> }
              <View style={{height:30}} />
              <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={1110} sourceHeight={662} targetWidth={0.8*screenWidth} />
              <View style={{flex:1}} />
              { this.props.host ?
                <Button
                  backgroundColor={colors.blue.rgba(0.75)}
                  icon={'ios-play'}
                  label={ "Next"}
                  callback={() => { this.transformManager.requestCollectionSession(); }}
                /> :
                <ActivityIndicator size="large" color={colors.csBlue.hex} />
              }
              <View style={{height:30}} />
            </React.Fragment>
          case "DIFFERENT":
            <React.Fragment>
              <Text style={styles.header}>{ "Next measurement" }</Text>
              <Text style={styles.boldExplanation}>{ "Great! Now repeat this in a different spot!" }</Text>
              <CollectionStats stats={this.state.collectionStats} />
              { this.props.host ? <Text style={styles.boldExplanation}>{ "Press Next when you're both ready!" }</Text> : <Text style={styles.boldExplanation}>{ "Waiting for other device..." }</Text> }
              <View style={{height:30}} />
              <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={1110} sourceHeight={662} targetWidth={0.8*screenWidth} />
              <View style={{flex:1}} />
              { this.props.host ?
                <Button
                  backgroundColor={colors.blue.rgba(0.75)}
                  icon={'ios-play'}
                  label={ "Next"}
                  callback={() => { this.transformManager.requestCollectionSession(); }}
                /> :
                <ActivityIndicator size="large" color={colors.csBlue.hex} />
              }
              <View style={{height:30}} />
            </React.Fragment>
          case "FURTHER_AWAY":
            <React.Fragment>
              <Text style={styles.header}>{ "Next measurement" }</Text>
              <Text style={styles.boldExplanation}>{ "Great! Now repeat this in a different spot, a bit further away from where your Crownstones are!" }</Text>
              <CollectionStats stats={this.state.collectionStats} />
              { this.props.host ? <Text style={styles.boldExplanation}>{ "Press Next when you're both ready!" }</Text> : <Text style={styles.boldExplanation}>{ "Waiting for other device..." }</Text> }
              <View style={{height:30}} />
              <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={1110} sourceHeight={662} targetWidth={0.8*screenWidth} />
              <View style={{flex:1}} />
              { this.props.host ?
                <Button
                  backgroundColor={colors.blue.rgba(0.75)}
                  icon={'ios-play'}
                  label={ "Next"}
                  callback={() => { this.transformManager.requestCollectionSession(); }}
                /> :
                <ActivityIndicator size="large" color={colors.csBlue.hex} />
              }
              <View style={{height:30}} />
            </React.Fragment>
        }
      case "FINISHED":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "All done!" }</Text>
            <Text style={styles.boldExplanation}>{ "All datasets collected by the other device will now be optimized for your phone!" }</Text>
            <ScaledImage source={require("../../../../assets/images/map_finished.png")} sourceWidth={1193} sourceHeight={909} targetWidth={screenWidth*0.8} />
            <View style={{flex:1}} />
            <Button
              backgroundColor={colors.blue.rgba(0.75)}
              icon={'ios-play'}
              label={ "Finish!"}
              callback={() => { NavigationUtil.dismissModal(); }}
            />
            <View style={{height:30}} />
          </React.Fragment>
        );
      case "FAILED":
        return (
          <React.Fragment>
            <Text style={styles.header}>{ "Something went wrong..." }</Text>
            <Text style={styles.boldExplanation}>{ "Press the button below to try again, or try again later." }</Text>
            <Text style={styles.explanation}>{ "Error was: " + this.state.errorMessage }</Text>
            <View style={{flex:1}} />
            <Button
              backgroundColor={colors.blue.rgba(0.75)}
              icon={'ios-play'}
              label={ "Retry.."}
              callback={() => {
                if (this.props.host) {
                  this.transformManager.destroy();
                  this.setState({
                    sessionState: "UNINITIALIZED",
                    errorMessage: '',
                    collectionRecommendation: "UNINITIALIZED",
                    collectionsDone: 0,
                    currentCollection: {},
                    currentCollectionDataCount: 0
                  })
                  this.transformManager.init();
                  this.transformManager.start();
                }
                else {
                  Alert.alert("Wait for the host to retry!", "The host needs to press the button to retry.", [{text: "OK"}]);
                  NavigationUtil.dismissModal();
                }
              }}
            />
            <View style={{height:30}} />
          </React.Fragment>
        );

    }

  }
  render() {
    return (
      <SettingsBackground>
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          {this.renderContent()}
        </View>
      </SettingsBackground>
    );
  }

}

function CollectionStats(props: {stats: {A: TransformStats, B: TransformStats}}) {
  return (
    <React.Fragment>
      <Text style={styles.explanation}>{ `Host  collected: close:${props.stats.A.close}/${TRANSFORM_MIN_SAMPLE_THRESHOLD} mid: ${props.stats.A.mid}/${TRANSFORM_MIN_SAMPLE_THRESHOLD} far:${props.stats.A.far}/${TRANSFORM_MIN_SAMPLE_THRESHOLD}` }</Text>
      <Text style={styles.explanation}>{ `Other collected: close:${props.stats.B.close}/${TRANSFORM_MIN_SAMPLE_THRESHOLD} mid: ${props.stats.B.mid}/${TRANSFORM_MIN_SAMPLE_THRESHOLD} far:${props.stats.B.far}/${TRANSFORM_MIN_SAMPLE_THRESHOLD}` }</Text>
    </React.Fragment>
  )
}