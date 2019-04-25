
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddSphereTutorial", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import { Background } from "../../components/Background";
import { colors, OrangeLine, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { AddSphereTutorial_introduction } from "./elements/AddSphereTutorial_introduction";
import { AddSphereTutorial_multiple } from "./elements/AddSphereTutorial_multiple";
import { AddSphereTutorial_intended } from "./elements/AddSphereTutorial_intended";
import { core } from "../../../core";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { HiddenFadeInView } from "../../components/animated/FadeInView";

export class AddSphereTutorial extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: lang("New_Sphere")}
  };
  _carousel

  constructor(props) {
    super(props);

    this.state = {activeSlide: 0};
  }

  _renderItem({item, index}) {
    return item;
  }


  render() {
    let components = this._getContent();
    return (
      <Background hasNavBar={false} image={core.background.detailsDark}>
        <OrangeLine/>
        <Carousel
          ref={(c) => { this._carousel = c; }}
          data={components}
          renderItem={this._renderItem}
          sliderWidth={screenWidth}
          itemWidth={screenWidth}
          onSnapToItem={(index) => this.setState({ activeSlide: index }) }
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
      </Background>
    )
  }


  _getContent() {
    let content = [];
    content.push(<AddSphereTutorial_introduction key="AddSphereTutorial_introduction" />);
    content.push(<AddSphereTutorial_multiple     key="AddSphereTutorial_multiple" />);
    content.push(<AddSphereTutorial_intended     key="AddSphereTutorial_intended" store={core.store} />);
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

