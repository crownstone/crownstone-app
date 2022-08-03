import * as React from 'react';
import {Platform, Vibration, Text, View, TextStyle, ActivityIndicator} from "react-native";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import KeepAwake from 'react-native-keep-awake';
import {Bluenet} from "../../../native/libInterface/Bluenet";
import {BlurView} from "@react-native-community/blur";
import {Button} from "../../components/Button";
import {SlideInViewLayoutAnimation} from "../../components/animated/SlideInViewLayoutAnimation";
import {core} from "../../../Core";
import { FingerprintCollectorLive } from "../../../localization/fingerprints/FingerprintCollectorLive";



export class LocalizationFindAndFix extends LiveComponent<{ sphereId: sphereId, locationId: locationId, componentId: string }, any> {
  static options(props) {
    let location = Get.location(props.sphereId, props.locationId);
    return TopBarUtil.getOptions({title: `Exploring the ${location.config.name}`, cancel: true});
  }

  collector           : FingerprintCollectorLive;
  distanceMap         : Record<locationId, number> = {};
  sortedDistanceArray : locationId[] = [];
  subscription = [];


  constructor(props) {
    super(props);
    this.state = {
      collectedPoints: 0,
      fixing: false,
    };

    this.collector = new FingerprintCollectorLive(this.props.sphereId, this.props.locationId, 'FIND_AND_FIX');
    this.collector.handleResult = (result) => {
      this.distanceMap = result;
      this.sortedDistanceArray = Object.keys(this.distanceMap);
      this.sortedDistanceArray.sort((a, b) => {
        return this.distanceMap[a] - this.distanceMap[b];
      });


      if (this.sortedDistanceArray.length > 0 && this.sortedDistanceArray[0] !== this.props.locationId) {
        this.collector.collectDatapoint();
        // we will remove the datapoint that caused the error as long as that can be done safely.
        // the deleteLocation function will check if we will allow this.
        this.collector.deleteLastBestDatapoint();

        this.setState({collectedPoints: this.state.collectedPoints + 1, fixing: true});
        if (Platform.OS === 'android') {
          Vibration.vibrate([0,400]);
        }
        else {
          Vibration.vibrate([0]);
        }
      }
      else {
        if (this.state.fixing) {
          this.setState({fixing: false});
        }

        if (Platform.OS === "android") {
          let pattern = [0, 50, 10, 30]
          Vibration.vibrate(pattern);
        }
        else {
          Bluenet.vibrate("success");
        }
      }
      this.forceUpdate();
    }
  }


  navigationButtonPressed({buttonId}) {
    if (buttonId === 'cancel') {
      this.collector.stop();
      NavigationUtil.dismissModal();
    }
  }


  componentDidMount()    {
    this.collector.start();
    this.subscription.push(core.eventBus.on("AppStateChange", (appState) => {
      if (appState !== "active") {
        this.collector.stop();
      }
      else if (appState === "active") {
        this.collector.start();
      }
    }))
  }


  componentWillUnmount() {
    this.collector.stop();
    for (let unsubscribe of this.subscription) {
      unsubscribe();
    }
    this.subscription = [];
  }


  render() {
    let location = Get.location(this.props.sphereId, this.props.locationId);
    return (
      <Background>
        <View style={{height: topBarHeight}} />
        <KeepAwake />
        <Text style={styles.header}>{"Move around to find mistakes in the localization..."}</Text>
        <Text style={styles.boldExplanation}>{"Any mistake will be fixed and applied immediately!"}</Text>
        <Text style={{...styles.boldExplanation, fontStyle:"italic"}}>{`Stay in the ${location.config.name} during this process!`}</Text>

        <SlideInViewLayoutAnimation visible={this.sortedDistanceArray.length > 0}>
          <ResultList distanceMap={this.distanceMap} sortedDistanceArray={this.sortedDistanceArray} sphereId={this.props.sphereId} />
        </SlideInViewLayoutAnimation>
        <SlideInViewLayoutAnimation visible={this.sortedDistanceArray.length === 0}>
          <ActivityIndicator size="large" style={{paddingTop:20}}/>
        </SlideInViewLayoutAnimation>

        <View style={{flex:1}}/>
        <SlideInViewLayoutAnimation visible={this.state.collectedPoints > 0}>
          <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center'}}>
            {this.state.fixing && (
                <View>
                  <ActivityIndicator size={'small'} />
                  <Text style={{...styles.boldExplanation, color: colors.black.rgba(0.6), fontStyle:'italic'}}>{`Fixing...`}</Text>
                </View>
              )
            }
            {!this.state.fixing && this.state.collectedPoints === 1 &&  <Text style={{...styles.boldExplanation, color: colors.black.rgba(0.6), fontStyle:'italic'}}>{`Fixed ${this.state.collectedPoints} mistake so far!`}</Text>}
            {!this.state.fixing && this.state.collectedPoints > 1   &&  <Text style={{...styles.boldExplanation, color: colors.black.rgba(0.6), fontStyle:'italic'}}>{`Fixed ${this.state.collectedPoints} mistakes so far!`}</Text>}
            <Button
              backgroundColor={colors.csBlue.hex}
              label={ 'Finalize and save' }
              callback={() => {
                this.collector.stop();
                this.collector.store();
                NavigationUtil.dismissModal();
              }}
            />
          </View>
        </SlideInViewLayoutAnimation>
        <SlideInViewLayoutAnimation visible={this.state.collectedPoints === 0}>
          <View style={{paddingVertical:30, alignItems:'center', justifyContent:'center'}}>
            <Text style={{...styles.boldExplanation, color: colors.black.rgba(0.6), fontStyle:'italic'}}>{`Find a mistake first!`}</Text>
          </View>
        </SlideInViewLayoutAnimation>
      </Background>
    );
  }
}


function ResultList(props: {distanceMap: Record<locationId, number>, sortedDistanceArray: locationId[], sphereId: sphereId}) {
  let amountOfLocations = Object.keys(props.distanceMap).length;

  let amountOfLocationShown = Math.min(4, amountOfLocations);
  let locationIds = props.sortedDistanceArray.slice(0,amountOfLocationShown)

  let locations = locationIds.map((locationId, index) => {
    let location = Get.location(props.sphereId, locationId);
    return (
      <LocationItem key={locationId} location={location} distance={props.distanceMap[locationId]} index={index} amountOfLocationShown={amountOfLocationShown} />
    );
  })

  return (
    <View style={{flexDirection:'column', alignItems:'center'}}>
      {locations}
    </View>
  );
}


let weight = [
  'bold',
  'normal',
  '200',
  '100'
];

function LocationItem(props: {location: LocationData, distance: number, index: number, amountOfLocationShown: number}) {
  let amountOfItems = props.amountOfLocationShown;
  let factor = (amountOfItems-props.index)/amountOfItems;

  let fontStyle = {fontSize: 10*factor + 10, fontWeight: weight[props.index]} as TextStyle;
  return (
    <View style={{width: screenWidth, alignItems:'center'}}>
      <BlurView blurType={'light'} style={{
        flexDirection:'row',
        height: 30*factor + 30,
        width: screenWidth*0.75,
        paddingHorizontal:15, borderRadius: 10, marginBottom:10, alignItems:'center',
        backgroundColor: colors.green.blend(colors.blue, 1-factor).hex,
        opacity: 0.8*factor+0.2
      }}>
        <Text style={fontStyle}>{`#${props.index+1} ${props.location.config.name}`}</Text>
      </BlurView>
    </View>
  )
}
