
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
import {availableModalHeight, colors, screenWidth, styles} from "../../styles";
import { Get } from "../../../util/GetUtil";
import { ScaledImage } from "../../components/ScaledImage";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { Button } from "../../components/Button";
import {OnScreenNotifications} from "../../../notifications/OnScreenNotifications";
import {SafeAreaView} from "react-native-safe-area-context";
import {LiveComponent} from "../../LiveComponent";
import {TransformUtil} from "../../../util/TransformUtil";



export class LocalizationTransform extends LiveComponent<
  {
    sphereId: sphereId,
    otherUserId: string,
    otherDeviceId: string,
    isHost: boolean,
    isModal?:boolean,
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
    return TopBarUtil.getOptions({title: "Optimize!", closeModal: props.isModal ?? undefined})
  }

  transformManager : TransformManager;
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

    if (props.isHost) {
      this.transformManager = new TransformManager(this.props.sphereId, state.user.userId, DeviceInfo.getDeviceId(), this.props.otherUserId, this.props.otherDeviceId);
    }
    else {
      this.transformManager = new TransformManager(this.props.sphereId, this.props.otherUserId, this.props.otherDeviceId, state.user.userId, DeviceInfo.getDeviceId(), props.sessionId);
    }

    this.transformManager.stateUpdate = (sessionState, errorMessage) => { this.setState({sessionState: sessionState, errorMessage}); };

    this.transformManager.collectionUpdate = (collection: Record<string, number[]>, dataCount: number) => {
      this.setState({currentCollection: collection, currentCollectionDataCount: dataCount});
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
    if (this.props.isHost === false) {
      OnScreenNotifications.removeNotification(this.props.sessionId);
    }
    this.transformManager.destroy();
  }


  renderContent() {
    switch (this.state.sessionState) {
      case "UNINITIALIZED":
      case "AWAITING_SESSION_REGISTRATION":
        return <Initializing title={"Starting..."} />;
      case "AWAITING_SESSION_START":
        return <Initializing title={"Connecting..."} />;
      case "AWAITING_INVITATION_ACCEPTANCE":
        return <Initializing title={"Waiting for the other device to accept the request..."} />;
      case "SESSION_WAITING_FOR_COLLECTION_INITIALIZATION":
      case "COLLECTION_COMPLETED":
        switch (this.state.collectionRecommendation) {
          case "CLOSER":
            return (
              <PreparingMeasurement
                isHost={this.props.isHost}
                title={"Next measurement"}
                explanation={"Great! Now repeat this in a different spot, a bit close to where your Crownstones are!"}
                stats={this.state.collectionStats}
                callback={() => {
                  this.transformManager.requestCollectionSession();
                }}
              />
            );
          case "DIFFERENT":
            return (
              <PreparingMeasurement
                isHost={this.props.isHost}
                title={"Next measurement"}
                explanation={"Great! Now repeat this in a different spot!"}
                stats={this.state.collectionStats}
                callback={() => {
                  this.transformManager.requestCollectionSession();
                }}
              />
            );
          case "FURTHER_AWAY":
            return (
              <PreparingMeasurement
                isHost={this.props.isHost}
                title={"Next measurement"}
                explanation={"Great! Now repeat this in a different spot, a bit further away from where your Crownstones are!"}
                stats={this.state.collectionStats}
                callback={() => {
                  this.transformManager.requestCollectionSession();
                }}
              />
            );
          case "UNINITIALIZED":
            return (
              <PreparingMeasurement
                title={"Preparing measurement"}
                explanation={"Place both devices side by side on a flat surface, 10 cm apart from eachother."}
                isHost={this.props.isHost}
                stats={null}
                callback={() => {
                this.transformManager.requestCollectionSession();
              }}
              />
            );
        }
      case "SESSION_WAITING_FOR_COLLECTION_START":
        return (
          <WaitingForMeasurement
            title={"Preparing measurement"}
            explanation={"Place both devices side by side on a flat surface, 10 cm apart from eachother."}
            phase={"Waiting to start..." }
          />
        );
      case "COLLECTION_STARTED":
      case "WAITING_ON_OTHER_USER":
      case "WAITING_TO_FINISH_COLLECTION":
        return (
          <Measurement
            title={"Measuring..."}
            explanation={ "Please wait for the measurement to finish."}
            phase={"This should take around 20 seconds..." }
            data={this.state.currentCollection}
          />
        );
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
      default:
      // case "FAILED":
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
                if (this.props.isHost) {
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
        <SafeAreaView style={{flex:1, justifyContent:'center', alignItems:'center', paddingTop:15}}>
          {this.renderContent()}
        </SafeAreaView>
      </SettingsBackground>
    );
  }

}


function Initializing({title}) {
  return (
    <React.Fragment>
      <Text style={styles.header}>{title}</Text>
      <View style={{flex:1}} />
      <ActivityIndicator size="large" color={colors.csBlue.hex} />
      <View style={{flex:2}} />
    </React.Fragment>
  )
}

function PreparingMeasurement({isHost, title, explanation, callback, stats}) {
  return (
    <React.Fragment>
      <Text style={styles.header}>{title}</Text>
      <Text style={styles.boldExplanation}>{explanation}</Text>
        {isHost ?
          <Text style={styles.boldExplanation}>{"Press Next when you're both ready!"}</Text> :
          <Text style={styles.boldExplanation}>{"Waiting for other device..."}</Text>
        }
      <View style={{height: 30}}/>
      <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={778} sourceHeight={524} targetWidth={0.8*screenWidth}/>
      {/*{ stats !== null  && <View style={{height: 30}}/> }*/}
      {/*{ stats !== null  && <CollectionStats stats={stats} isHost={isHost} /> }*/}
      <View style={{flex: 1}}/>
      {isHost ?
        <Button
          backgroundColor={colors.blue.rgba(0.75)}
          icon={'ios-play'}
          label={"Next"}
          callback={callback}
        /> :
        <ActivityIndicator size="large" color={colors.csBlue.hex}/>
      }
      <View style={{height: 30}}/>
    </React.Fragment>
  )
}

function WaitingForMeasurement({title, explanation, phase}) {
  return (
    <React.Fragment>
      <Text style={styles.header}>{ title }</Text>
      <Text style={styles.boldExplanation}>{ explanation }</Text>
      <Text style={styles.boldExplanation}>{ phase }</Text>
      <View style={{height:30}} />
      <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={778} sourceHeight={524} targetWidth={0.8*screenWidth}/>
      <View style={{flex:1}} />
      <ActivityIndicator size="large" color={colors.csBlue.hex} />
      <View style={{height:30}} />
    </React.Fragment>
  )
}

function Measurement({title, explanation, phase, data}) {
  return (
    <React.Fragment>
      <Text style={styles.header}>{ title }</Text>
      <Text style={styles.boldExplanation}>{ explanation }</Text>
      <Text style={styles.boldExplanation}>{ phase }</Text>
      <View style={{height:30}} />
      <ScaledImage source={require("../../../../assets/images/phone_transform.png")} sourceWidth={778} sourceHeight={524} targetWidth={0.8*screenWidth}/>
      <DataVisualization data={data} />
      <ActivityIndicator size="large" color={colors.csBlue.hex} />
      <View style={{height:30}} />
    </React.Fragment>
  )
}


function DataVisualization(props : {data: Record<string, rssi[]>}) {
  let amountOfCrownstones = Object.keys(props.data).length;

  let vector = [];
  for (let ibeaconId in props.data) {
    for (let rssi of props.data[ibeaconId]) {
      vector.push([rssi, ibeaconId]);
    }
  }
  let buckets = [-10,-20,-30,-40,-50,-60,-70,-80,-90,-100];
  let bucketedData = TransformUtil.fillBuckets(buckets, vector);
  // all buckets smaller than -60 will be combined in the -50 bucket
  let collection = [];
  for (let bucketEntry of bucketedData) {
    if (bucketEntry.x > -60) {
      collection = collection.concat(bucketEntry.data);
    }
  }

  // insert the collection data in the -50 bucket
  bucketedData[buckets.indexOf(-50)].data = collection;
  bucketedData = bucketedData.slice(buckets.indexOf(-50));

  // similarly, all buckets larger than -80 will be combined in the -90 bucket
  collection = [];
  for (let bucketEntry of bucketedData) {
    if (bucketEntry.x < -80) {
      collection = collection.concat(bucketEntry.data);
    }
  }

  bucketedData[4].data = collection;
  bucketedData.pop();

  let totalCount = Math.max(40,vector.length);

  return (
    <View style={{flex:1, width:screenWidth, justifyContent:'center', alignItems:'center', padding:15}}>
      <Text>{"Amount of Crownstones: " + amountOfCrownstones}</Text>
      <View style={{flexDirection:'row', flex:1}}>
        <Bar count={bucketedData[0].data.length} totalCount={totalCount} label={"very close"}/>
        <Bar count={bucketedData[1].data.length} totalCount={totalCount} label={"close"}/>
        <Bar count={bucketedData[2].data.length} totalCount={totalCount} label={"mid"}/>
        <Bar count={bucketedData[3].data.length} totalCount={totalCount} label={"far"}/>
        <Bar count={bucketedData[4].data.length} totalCount={totalCount} label={"very far"}/>
      </View>
    </View>
  )
}

function Bar({count, totalCount, label}) {
  let ratio = count / totalCount;
  return (
    <View style={{flex:1, paddingHorizontal:3}}>
      { 1-ratio > 0 && <View style={{flex:1-ratio, backgroundColor:'transparent'}} /> }
      { ratio   > 0 && <View style={{flex:ratio,   backgroundColor:colors.csBlue.rgba(0.5), alignItems:'center', justifyContent:'flex-start', overflow:'hidden', borderRadius: 3}} /> }
      <Text style={{fontSize:10, color: colors.black.rgba(0.2), alignSelf:'center'}}>{label}</Text>
    </View>
  );
}

function CollectionStats(props: {stats: {A: TransformStats, B: TransformStats}, isHost: boolean}) {
  let youPointer = props.stats.B;
  let otherPointer = props.stats.A;
  if (props.isHost) {
    youPointer = props.stats.A;
    otherPointer = props.stats.B;
  }

  return (
    <React.Fragment>
      <Text style={styles.explanation}>{ `You've collected: close:${getPercentageString(youPointer.close,TRANSFORM_MIN_SAMPLE_THRESHOLD)} mid: ${getPercentageString(youPointer.mid,TRANSFORM_MIN_SAMPLE_THRESHOLD)} far:${getPercentageString(youPointer.far,TRANSFORM_MIN_SAMPLE_THRESHOLD)}` }</Text>
      <Text style={styles.explanation}>{ `Other  collected: close:${getPercentageString(otherPointer.close,TRANSFORM_MIN_SAMPLE_THRESHOLD)} mid: ${getPercentageString(otherPointer.mid,TRANSFORM_MIN_SAMPLE_THRESHOLD)} far:${getPercentageString(otherPointer.far,TRANSFORM_MIN_SAMPLE_THRESHOLD)}` }</Text>
    </React.Fragment>
  );
}

function getPercentageString(value, total) {
  let percentage = Math.min(value/total, 1);
  return Math.round(percentage*100) + "%";
}