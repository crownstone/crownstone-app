import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform, ScrollView, StatusBar,
  Text, TextStyle,
  View, ViewStyle
} from "react-native";
import { Pagination } from 'react-native-snap-carousel';
import { colors, screenHeight, screenWidth, styles, tabBarHeight, topBarHeight } from "../styles";
import { core } from "../../core";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import { SetupDeviceEntry } from "../components/deviceEntries/SetupDeviceEntry";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Background } from "../components/Background";
import { FadeIn, FadeInView, HiddenFadeInView } from "../components/animated/FadeInView";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Icon } from "../components/Icon";
import { TopbarBackButton } from "../components/topbar/TopbarButton";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";


export class ScanningForSetupCrownstones extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: "Add Crownstones",
      headerLeft: <TopbarBackButton text={"Back"} onPress={() => { params.returnToRoute ? NavigationUtil.backTo(params.returnToRoute) : NavigationUtil.back() }} />
    }
  };


  nothingYetTimeout;
  iconTimeout;

  setupEvents = [];
  constructor(props) {
    super(props);

    this.state = {
      showNothingYet: false,
      icon1Visible:  Math.random() < 0.5,
      icon2Visible:  Math.random() < 0.5,
      icon3Visible:  Math.random() < 0.5,
      headerColor:  0,
    };
  }

  componentDidMount() {
    this.setupEvents.push(core.eventBus.on("setupStoneChange", () => { this.setState({showNothingYet: false}) }));
    this.setupEvents.push(core.eventBus.on("noSetupStonesVisible", () => { this._startNothingYetTimeout() }));
    this._startNothingYetTimeout();
    this._cycleIcons();
  }

  _startNothingYetTimeout() {
    this.nothingYetTimeout = setTimeout(() => { this.setState({showNothingYet: true })}, 4000);
  }

  _cycleIcons() {
    let toggleIndex = Math.ceil(Math.random()*3);
    switch(toggleIndex) {
      case 1:
        this.setState({icon1Visible: !this.state.icon1Visible, headerColor: (this.state.headerColor + 1) % 4}); break;
      case 2:
        this.setState({icon2Visible: !this.state.icon2Visible, headerColor: (this.state.headerColor + 1) % 4}); break;
      case 3:
        this.setState({icon3Visible: !this.state.icon3Visible, headerColor: (this.state.headerColor + 1) % 4}); break;
    }
    this.iconTimeout = setTimeout(() => { this._cycleIcons()}, 600);
  }

  componentWillUnmount() {
    this.setupEvents.forEach((unsub) => { unsub(); });
    clearTimeout(this.nothingYetTimeout);
    clearTimeout(this.iconTimeout);
  }

  _renderer(item, index, stoneId) {
    return (
      <View key={stoneId + '_setup_entry'}>
        <FadeIn style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
          <SetupDeviceEntry
            key={stoneId + '_setup_element'}
            sphereId={this.props.sphereId}
            handle={item.handle}
            item={item}
            callback={() => { NavigationUtil.navigate("SetupCrownstone", {sphereId: this.props.sphereId, setupStone: item}); }}
          />
        </FadeIn>
      </View>
    );
  }

  _getStoneList() {
    let stoneArray = [];
    let ids = [];
    let shownHandles = {};

    if (SetupStateHandler.areSetupStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
      let setupStones = SetupStateHandler.getSetupStones();
      let setupIds = Object.keys(setupStones);

      setupIds.forEach((setupId) => {
        shownHandles[setupStones[setupId].handle] = true;
        ids.push(setupId);
        setupStones[setupId].setupMode = true;
        stoneArray.push(setupStones[setupId]);
      });
    }

    return { stoneArray, ids };
  }


  render() {
    const { stoneArray, ids } = this._getStoneList();

    let borderStyle = { borderColor: colors.black.rgba(0.2), borderBottomWidth: 1 };
    return (
      <Background hasNavBar={false} image={core.background.light}>
        <View style={{...styles.centered, width: screenWidth, height: 100, ...borderStyle, overflow:'hidden'}}>
          <FadeInView duration={600} visible={this.state.headerColor < 2}   style={{position:'absolute', top:0, left:0, backgroundColor: colors.green.rgba(0.7),   width: screenWidth, height: 100}} />
          <FadeInView duration={600} visible={this.state.headerColor >= 2}  style={{position:'absolute', top:0, left:0, backgroundColor: colors.iosBlue.rgba(0.3), width: screenWidth, height: 100}} />
          <FadeInView duration={600} visible={this.state.icon1Visible} style={{position:'absolute', top:-25, left:105}}><Icon name="c2-pluginFront" size={100} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon2Visible} style={{position:'absolute', top:25,  left:175}}><Icon name="c2-pluginFront" size={100} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon3Visible} style={{position:'absolute', top:-32, left:-30}}><Icon name="c2-pluginFront" size={160} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <View style={{flex:1, }} />
          <View style={{...styles.centered, flexDirection:'row', flex:1, minHeight:40 }}>
            <View style={{flex:1}} />
            <Text style={{color: colors.csBlueDark.hex, fontSize:16, fontWeight: "bold"}}>{stoneArray.length > 0 ? "Searching for more Crownstones..." : "Searching for new Crownstones..."}</Text>
            <View style={{flex:1}} />
            <ActivityIndicator animating={true} size='large' color={colors.csBlueDark.hex} />
            <View style={{flex:1}} />
          </View>
          <SlideFadeInView visible={stoneArray.length > 0} height={30}><Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>These Crownstones are visible near you:</Text></SlideFadeInView>
          <View style={{flex:1}} />
        </View>
        <ScrollView style={{position:'relative', top:-1}}>
          <SeparatedItemList
            items={stoneArray}
            ids={ids}
            separatorIndent={false}
            renderer={this._renderer.bind(this)}
          />
          <SlideFadeInView duration={1000} height={80} visible={ids.length === 0 && this.state.showNothingYet === true} style={{...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>Nothing yet, but I'm still looking!</Text>
          </SlideFadeInView>
        </ScrollView>
      </Background>
    );
  }

}

