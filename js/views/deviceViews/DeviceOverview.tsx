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



Swiper.prototype.componentWillUpdate = (nextProps, nextState) => {
  eventBus.emit("setNewIndex", nextState.index);
};

export class DeviceOverview extends Component<any, any> {
  unsubscribeStoreEvents : any;
  unsubscribeSwipeEvent : any;

  constructor() {
    super();

    this.state = {swiperIndex: 0, scrolling:false};
    this.unsubscribeSwipeEvent = eventBus.on("setNewIndex", (nextIndex) => {
      if (this.state.swiperIndex !== nextIndex) {
        this.setState({swiperIndex: nextIndex, scrolling: false});
      }
    });
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
      let applianceId = stone.config.applianceId;
      if (
        change.changeStoneState && change.changeStoneState.stoneIds[this.props.stoneId] ||
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
    this.unsubscribeSwipeEvent();
  }


  render() {
    const state = this.props.store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const element = Util.data.getElement(state.spheres[this.props.sphereId], stone);
    let hasAppliance = stone.config.applianceId !== null;

    let summaryIndex = 0;
    let behaviourIndex = 1;

    let hasError = stone.errors.hasError || stone.errors.advertisementError;
    let canUpdate = Util.versions.canUpdate(stone, state);
    let hasBehaviour = stone.config.type !== STONE_TYPES.guidestone;
    let deviceType = stone.config.type;

    if (hasError)  { summaryIndex++; behaviourIndex++; }
    if (canUpdate) { summaryIndex++; behaviourIndex++; }

    let checkScrolling = (newState) => {
      if (this.state.scrolling !== newState) {
        this.setState({scrolling: newState});
      }
    };

    return (
      <Background image={this.props.backgrounds.stoneDetailsBackground} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          rightItem={this.state.scrolling ? this._getScrollingElement() : undefined}
          right={() => {
            switch (this.state.swiperIndex) {
              case summaryIndex:
                return (hasAppliance ? Permissions.editAppliance : Permissions.editCrownstone) ? 'Edit' : undefined;
              case behaviourIndex:
                return Permissions.changeBehaviour ? 'Change' : undefined;
            }
          }}
          rightAction={() => {
            switch (this.state.swiperIndex) {
              case summaryIndex:
                Actions.deviceEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId}); break;
              case behaviourIndex:
                Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId}); break;
            }
          }}
          title={element.config.name} />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <Swiper style={swiperStyles.wrapper} showsPagination={true} height={availableScreenHeight}
          dot={<View style={{backgroundColor:'rgba(255,255,255,0.2)', width: 8, height: 8,borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
          activeDot={<View style={{backgroundColor: 'rgba(255,255,255,0.8)', width: 8, height: 8, borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
          loop={false}
          bounces={true}
          onScrollBeginDrag={  () => { checkScrolling(true);  }}
        >
          { this._getContent(hasError, canUpdate, hasBehaviour, deviceType) }
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

  _getContent(hasError, canUpdate, hasBehaviour, deviceType) {
    let content = [];

    if (hasError) {
      content.push(<DeviceError key={'errorSlide'} store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />);
    }
    if (canUpdate) {
      content.push(<DeviceUpdate key={'updateSlide'} store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId}/>);
    }

    if (deviceType === STONE_TYPES.guidestone) {
      content.push(<GuidestoneSummary key={'summarySlide'} store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId}/>);
    }
    else {
      content.push(<DeviceSummary key={'summarySlide'} store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId}/>);
    }

    if (hasBehaviour) {
      content.push(<DeviceBehaviour key={'behaviourSlide'} store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />);
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