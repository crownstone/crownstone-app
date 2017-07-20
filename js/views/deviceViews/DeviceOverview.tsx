import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../styles'
import { Background } from '../components/Background'
import * as Swiper from 'react-native-swiper';
import { Util } from "../../util/Util";
import { TopBar } from "../components/Topbar";
import { DeviceBehaviour } from "./elements/DeviceBehaviour";
import { DeviceSummary } from "./elements/DeviceSummary";
import { Permissions } from "../../backgroundProcesses/Permissions";
import { STONE_TYPES } from "../../router/store/reducers/stones";
import { DeviceError } from "./elements/DeviceError";
import { DeviceUpdate } from "./elements/DeviceUpdate";
import { GuidestoneSummary } from "./elements/GuidestoneSummary";
import { eventBus } from "../../util/EventBus";
import {DevicePowerCurve} from "./elements/DevicePowerCurve";
import {DeviceSchedule} from "./elements/DeviceSchedule";


Swiper.prototype.componentWillUpdate = (nextProps, nextState) => {
  eventBus.emit("setNewSwiperIndex", nextState.index);
};

export class DeviceOverview extends Component<any, any> {
  unsubscribeStoreEvents : any;
  unsubscribeSwiperEvents : any = [];
  touchEndTimeout: any;

  constructor() {
    super();

    this.state = {swiperIndex: 0, scrolling:false, swipeEnabled: true};
    this.unsubscribeSwiperEvents.push(eventBus.on("setNewSwiperIndex", (nextIndex) => {
      if (this.state.swiperIndex !== nextIndex) {
        this.setState({swiperIndex: nextIndex, scrolling: false});
      }
    }));
    this.unsubscribeSwiperEvents.push(eventBus.on("UIGestureControl", (panAvailable) => {
      if (panAvailable === true && this.state.swipeEnabled === false) {
        this.setState({swipeEnabled: true});
      }
      else  if (panAvailable === false && this.state.swipeEnabled === true) {
        this.setState({swipeEnabled: false});
      }
    }));
  }

  componentDidMount() {
    const { store } = this.props;
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = store.getState();
      if (
        (state.spheres[this.props.sphereId] === undefined) ||
        (change.removeStone && change.removeStone.stoneIds[this.props.stoneId])
         ) {
        Actions.pop();
        return;
      }


      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

      // investigate why this check is required:
      if (!stone || !stone.config) {
        Actions.pop();
        return;
      }

      let applianceId = stone.config.applianceId;
      if (
        change.changeAppSettings ||
        change.stoneLocationUpdated && change.stoneLocationUpdated.stoneIds[this.props.stoneId] ||
        change.changeStoneState && change.changeStoneState.stoneIds[this.props.stoneId] ||
        change.updateStoneSchedule && change.updateStoneSchedule.stoneIds[this.props.stoneId] ||
        change.powerUsageUpdated && change.powerUsageUpdated.stoneIds[this.props.stoneId] ||
        change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId] ||
        change.updateStoneBehaviour && change.updateStoneBehaviour.stoneIds[this.props.stoneId] ||
        applianceId && change.updateApplianceConfig && change.updateApplianceConfig.applianceIds[applianceId] ||
        applianceId && change.updateApplianceBehaviour && change.updateApplianceBehaviour.applianceIds[applianceId]
        ) {
          this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
    this.unsubscribeSwiperEvents.forEach((unsubscribe) => { unsubscribe(); });
    clearTimeout(this.touchEndTimeout);
  }


  render() {
    const state = this.props.store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const element = Util.data.getElement(state.spheres[this.props.sphereId], stone);
    let hasAppliance = stone.config.applianceId !== null;

    let index = 0;
    let summaryIndex = index++;
    let behaviourIndex = index++;
    let scheduleIndex = index++;
    let powerMonitorIndex = index++;

    let hasError = stone.errors.hasError || stone.errors.advertisementError;
    let canUpdate = Util.versions.canUpdate(stone, state);
    let hasBehaviour = stone.config.type !== STONE_TYPES.guidestone;
    let hasPowerMonitor = stone.config.type !== STONE_TYPES.guidestone;
    // let hasScheduler = stone.config.type !== STONE_TYPES.guidestone;
    let hasScheduler = stone.config.type !== STONE_TYPES.guidestone && Util.versions.isHigherOrEqual(stone.config.firmwareVersion, '1.5.0');
    let deviceType = stone.config.type;

    if (hasError)  { summaryIndex++; behaviourIndex++; }
    if (canUpdate) { summaryIndex++; behaviourIndex++; }

    let checkScrolling = (newState) => {
      if (this.state.scrolling !== newState) {
        this.setState({scrolling: newState});
      }
    };

    return (
      <Background image={this.props.backgrounds.detailsDark} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          rightItem={this.state.scrolling ? this._getScrollingElement() : undefined}
          right={() => {
            switch (this.state.swiperIndex) {
              case scheduleIndex:
                return Permissions.setSchedule ? 'Add' : undefined;
              case summaryIndex:
                return (hasAppliance ? Permissions.editAppliance : Permissions.editCrownstone) ? 'Edit' : undefined;
              case behaviourIndex:
                return (Permissions.changeBehaviour && state.app.indoorLocalizationEnabled) ? 'Change' : undefined;
            }
          }}
          rightAction={() => {
            switch (this.state.swiperIndex) {
              case scheduleIndex:
                if (Permissions.setSchedule) {
                  if (stone.config.disabled === true) {
                    Alert.alert(
                      "Can't see Crownstone",
                      "You cannot add a schedule without being near to the Crownstone.",
                      [{text:"OK"}]
                    );
                  }
                  else {
                    Actions.deviceScheduleEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId, scheduleId: null});
                  }
                }
                break;
              case summaryIndex:
                if (hasAppliance && Permissions.editAppliance || !hasAppliance && Permissions.editCrownstone) {
                  Actions.deviceEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId})
                }
                break;
              case behaviourIndex:
                if (Permissions.changeBehaviour && state.app.indoorLocalizationEnabled) {
                  Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId});
                }
                break;
            }
          }}
          title={element.config.name} />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <Swiper style={swiperStyles.wrapper} showsPagination={true} height={availableScreenHeight}
          dot={<View style={{backgroundColor: colors.white.rgba(0.35), width: 8, height: 8,borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.black.rgba(0.1)}} />}
          activeDot={<View style={{backgroundColor: colors.white.rgba(1), width: 9, height: 9, borderRadius: 4.5, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.csOrange.rgba(1)}} />}
          loop={false}
          scrollEnabled={this.state.swipeEnabled}
          bounces={true}
          onScrollBeginDrag={  () => { checkScrolling(true);  }}
          onTouchEnd={() => { this.touchEndTimeout = setTimeout(() => { checkScrolling(false); }, 400);  }}
        >
          { this._getContent(hasError, canUpdate, hasBehaviour, hasPowerMonitor, hasScheduler, deviceType) }
        </Swiper>
      </Background>
    )
  }

  _getScrollingElement() {
    // ios props
    return (
      <View style={{ flex:1, alignItems:'flex-end', justifyContent:'center', paddingTop: 0 }}>
        <ActivityIndicator animating={true} size='small' color={colors.iosBlue.hex} />
      </View>
    )
  }

  _getContent(hasError, canUpdate, hasBehaviour, hasPowerMonitor, hasScheduler, deviceType) {
    let content = [];

    let props = {store: this.props.store, sphereId: this.props.sphereId, stoneId: this.props.stoneId};

    if (hasError) {
      content.push(<DeviceError key={'errorSlide'} {...props} />);
    }
    if (canUpdate) {
      content.push(<DeviceUpdate key={'updateSlide'}  {...props} />);
    }

    if (deviceType === STONE_TYPES.guidestone) {
      content.push(<GuidestoneSummary key={'summarySlide'}  {...props} />);
    }
    else {
      content.push(<DeviceSummary key={'summarySlide'}  {...props} />);
    }

    if (hasBehaviour) {
      content.push(<DeviceBehaviour key={'behaviourSlide'} store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />);
    }

    if (hasScheduler) {
      content.push(<DeviceSchedule key={'scheduleSlide'} {...props} />);
    }

    if (hasPowerMonitor) {
      content.push(<DevicePowerCurve key={'powerSlide'} store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId}/>);
    }

    return content;
  }
}

let swiperStyles = StyleSheet.create({
  wrapper: {
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  }
});

let textColor = colors.white;

export const deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'800'
  },
  errorText: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
    fontWeight:'600'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  },
});