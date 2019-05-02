import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform, ScrollView, StatusBar,
  Text, TextStyle,
  View, ViewStyle
} from "react-native";
import Carousel, { Pagination } from 'react-native-snap-carousel';
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


export class ScanningForSetupCrownstones extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "Searching...",
    }
  };


  nothingYetTimeout
  iconTimeout
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
    this.nothingYetTimeout = setTimeout(() => { this.setState({showNothingYet: true })}, 2500);
    this._cycleIcons();
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
            callback={() => { NavigationUtil.navigate("SetupCrownstone_step1", {sphereId: this.props.sphereId, setupStone: item}); }}
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
        shownHandles[setupStones[setupId].advertisement.handle] = true;
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
    console.log("HERE")
    return (
      <Background hasNavBar={false} image={core.background.light}>
        <View style={{...styles.centered, flexDirection:'row', width: screenWidth, height: 80, ...borderStyle, overflow:'hidden'}}>
          <FadeInView duration={600} visible={this.state.headerColor < 2}  style={{position:'absolute', top:0, left:0, backgroundColor: colors.green.rgba(0.6),   width: screenWidth, height: 80}} />
          <FadeInView duration={600} visible={this.state.headerColor >= 2}  style={{position:'absolute', top:0, left:0, backgroundColor: colors.iosBlue.rgba(0.3), width: screenWidth, height: 80}} />
          <FadeInView duration={600} visible={this.state.icon1Visible} style={{position:'absolute', top:-25, left:105}}><Icon name="c2-pluginFront" size={100} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon2Visible} style={{position:'absolute', top:20,  left:175}}><Icon name="c2-pluginFront" size={100} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>
          <FadeInView duration={600} visible={this.state.icon3Visible} style={{position:'absolute', top:-32, left:-30}}><Icon name="c2-pluginFront" size={160} color={colors.white.hex} style={{backgroundColor:'transparent'}} /></FadeInView>

          <View style={{flex:1}} />
          <Text style={{color: colors.csBlueDark.hex, fontSize:16, fontWeight: "bold"}}>Looking for new Crownstones...</Text>
          <View style={{flex:1}} />
          <ActivityIndicator animating={true} size='large' color={colors.csBlueDark.hex} />
          <View style={{flex:1}} />
        </View>
        <ScrollView style={{position:'relative', top:-1}}>
          <SeparatedItemList
            items={stoneArray}
            ids={ids}
            separatorIndent={false}
            renderer={this._renderer.bind(this)}
          />
          <HiddenFadeInView duration={1000} visible={ids.length === 0 && this.state.showNothingYet === true} style={{...styles.centered, width:screenWidth, height:80, backgroundColor: colors.white.rgba(0.3),...borderStyle}}>
            <Text style={{color: colors.csBlueDark.hex, fontSize:14, fontWeight: "bold"}}>Nothing yet, I'm still looking!</Text>
          </HiddenFadeInView>
        </ScrollView>
      </Background>
    );
  }

}

