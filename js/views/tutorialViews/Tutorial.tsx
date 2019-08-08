import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Tutorial", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';

import { availableModalHeight, colors, screenHeight, screenWidth, topBarHeight } from "../styles";
import { Background } from '../components/Background'
import {TutorialSphere} from "./elements/TutorialSphere";
import {TutorialGetStarted} from "./elements/TutorialGetStarted";
import {TutorialLocalization} from "./elements/TutorialLocalization";
import {Bluenet} from "../../native/libInterface/Bluenet";
import {TutorialDevices} from "./elements/TutorialDevices";
import {TutorialBehaviour} from "./elements/TutorialBehaviour";
import {LOGi} from "../../logging/Log";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
import Carousel, { Pagination } from "react-native-snap-carousel";
import { HiddenFadeInView } from "../components/animated/FadeInView";



export class Tutorial extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Welcome_")});
  }
  requestedPermission = false;
  _carousel;
  constructor(props) {
    super(props);

    this.state = {activeSlide: 0};
  }


  componentWillUpdate(nextProps, nextState) {
    if (nextState.activeSlide === 3 && this.requestedPermission === false) {
      LOGi.info("Tutorial: Requested location permission.");
      Bluenet.requestLocationPermission();
      this.requestedPermission = true;
    }
  }

  _renderItem({item, index}) {
    return item;
  }

  render() {
    let components = this._getContent();

    return (
      <Background hasNavBar={false} image={core.background.detailsDark}>
        <View style={{height: availableModalHeight, width:screenWidth}}>
          <Carousel
            // useScrollView={true}
            ref={(c) => { this._carousel = c; }}
            data={components}
            removeClippedSubviews={false /* THIS IS REQUIRED IF WE HAVE THIS ELEMENT ON A MODAL OR THE FIRST SLIDE WONT RENDER */}
            renderItem={this._renderItem}
            sliderWidth={screenWidth}
            itemWidth={screenWidth}
            onSnapToItem={(index) => {
              this.setState({ activeSlide: index })
            }}
          />
          <HiddenFadeInView visible={this.state.activeSlide !== components.length - 1} style={{position:'absolute', bottom:0, width:screenWidth}}>
            <Pagination
              dotsLength={components.length}
              activeDotIndex={this.state.activeSlide}
              containerStyle={{ backgroundColor: colors.black.rgba(0.3 )}}
              dotStyle={{
                width: 10,
                height: 10,
                borderRadius: 5,
                marginHorizontal: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.92)'
              }}
              inactiveDotStyle={{
                // Define styles for inactive dots here
              }}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
          </HiddenFadeInView>
        </View>
      </Background>
    )
  }


  _getContent() {
    let content = [];

    content.push(<TutorialGetStarted key="TutorialGetStarted" />);
    content.push(<TutorialSphere key="TutorialSphere" />);
    content.push(<TutorialLocalization key="TutorialLocalization" />);
    content.push(<TutorialBehaviour key="TutorialBehaviour" state={core.store.getState()} />);
    content.push(<TutorialDevices key="TutorialDevices" state={core.store.getState()} />);

    return content;
  }
}
