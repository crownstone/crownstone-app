
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddSphereTutorial", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import { eventBus } from "../../../util/EventBus";
import { Background } from "../../components/Background";
import { colors, OrangeLine, screenHeight, topBarHeight } from "../../styles";
import { AddSphereTutorial_introduction } from "./elements/AddSphereTutorial_introduction";
import { AddSphereTutorial_multiple } from "./elements/AddSphereTutorial_multiple";
import { AddSphereTutorial_intended } from "./elements/AddSphereTutorial_intended";
const Swiper = require("react-native-swiper");


Swiper.prototype.componentWillUpdate = (nextProps, nextState) => {
  eventBus.emit("setNewSwiperIndex", nextState.index);
};

export class AddSphereTutorial extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: lang("New_Sphere")}
  };

  unsubscribeSwipeEvent : any;
  touchEndTimeout: any;
  requestedPermission;

  constructor(props) {
    super(props);

    this.requestedPermission = false;
    this.state = {swiperIndex: 0, scrolling: false};
    this.unsubscribeSwipeEvent = eventBus.on("setNewSwiperIndex", (nextIndex) => {
      if (this.state.swiperIndex !== nextIndex) {
        this.setState({swiperIndex: nextIndex, scrolling: false});
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSwipeEvent();
    clearTimeout(this.touchEndTimeout);
  }

  render() {
    let checkScrolling = (newState) => {
      if (this.state.scrolling !== newState) {
        this.setState({scrolling: newState});
      }
    };

    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <OrangeLine/>
        <Swiper style={swiperStyles.wrapper} showsPagination={true} height={screenHeight - topBarHeight}
          dot={<View style={{backgroundColor: colors.white.rgba(0.35), width: 8, height: 8,borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.black.rgba(0.1)}} />}
          activeDot={<View style={{backgroundColor: colors.white.rgba(1), width: 8, height: 8, borderRadius: 4, marginLeft: 3, marginRight: 3, marginTop: 3, marginBottom: 3, borderWidth:1, borderColor: colors.csOrange.rgba(1)}} />}
          loop={false}
          bounces={true}
          onScrollBeginDrag={  () => { checkScrolling(true);  }}
          onTouchEnd={() => { this.touchEndTimeout = setTimeout(() => { checkScrolling(false); }, 400);  }}
        >
          { this._getContent() }
        </Swiper>
      </Background>
    )
  }


  _getContent() {
    let content = [];
    content.push(<AddSphereTutorial_introduction key="AddSphereTutorial_introduction" />);
    content.push(<AddSphereTutorial_multiple     key="AddSphereTutorial_multiple" />);
    content.push(<AddSphereTutorial_intended     key="AddSphereTutorial_intended" store={this.props.store} />);
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

