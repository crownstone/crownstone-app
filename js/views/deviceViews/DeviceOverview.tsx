import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
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
import {Util} from "../../util/Util";
import {TopBar} from "../components/Topbar";
import {DeviceBehaviour} from "./elements/DeviceBehaviour";
import {DeviceSummary} from "./elements/DeviceSummary";


export class DeviceOverview extends Component<any, any> {
  deleting : boolean = false;
  unsubscribeStoreEvents : any;
  swiper: any = 0;

  constructor() {
    super();
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

      if (
        change.updateStoneConfig &&
        change.updateStoneConfig.stoneIds[this.props.stoneId] ||
        change.updateApplianceConfig
        ) {
        if (this.deleting === false) {
          this.forceUpdate();
        }
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }


  render() {
    const state = this.props.store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    const element = Util.data.getElement(state.spheres[this.props.sphereId], stone);

    let index = this.swiper && this.swiper.state.index || 0;

    return (
      <Background image={this.props.backgrounds.stoneDetailsBackground} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          right={() => {
            switch (index) {
              case 0:
                return 'Edit';
              case 1:
                return 'Change';
            }
          }}
          rightAction={() => {
            switch (index) {
              case 0:
                Actions.deviceEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId}); break;
              case 1:
                Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId}); break;
            }
          }}
          title={element.config.name} />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <Swiper style={swiperStyles.wrapper} showsPagination={true} height={availableScreenHeight}
          dot={<View style={{backgroundColor:'rgba(255,255,255,0.2)', width: 8, height: 8,borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
          activeDot={<View style={{backgroundColor: 'rgba(255,255,255,0.8)', width: 8, height: 8, borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3,}} />}
          ref={(swiper) => { this.swiper = swiper; }}
          onMomentumScrollEnd={() => {  this.forceUpdate(); /* this updates the index */ }}
        >
          <DeviceSummary  store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
          <DeviceBehaviour store={this.props.store} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
        </Swiper>
      </Background>
    )
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