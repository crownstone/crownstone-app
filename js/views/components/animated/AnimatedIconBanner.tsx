import { Component } from "react";
import * as React from "react";
import { View } from "react-native";
import { FadeInView } from "./FadeInView";
import { colors, screenWidth } from "../../styles";
import { Icon } from "../Icon";
// import { NavigationEvents } from "react-navigation";

interface iconData {
  name: string,
  size: number,
  left: number,
  top:  number,
  color?: string,
}

export class AnimatedIconBanner extends Component<
  {icons: iconData[], colors: string[], duration?: number, height: number},
  any> {

  iconTimeout;
  amountOfColors: number;
  amountOfIcons: number;

  constructor(props) {
    super(props);

    this.state = {
      icon1Visible:  Math.random() < 0.5,
      icon2Visible:  Math.random() < 0.5,
      icon3Visible:  Math.random() < 0.5,
      icon4Visible:  Math.random() < 0.5,
      icon5Visible:  Math.random() < 0.5,
      icon6Visible:  Math.random() < 0.5,
      icon7Visible:  Math.random() < 0.5,
      icon8Visible:  Math.random() < 0.5,
      icon9Visible:  Math.random() < 0.5,
      colorIndex:   0,
    };

    this.amountOfColors = props.colors.length;
    this.amountOfIcons = props.icons.length;
  }

  componentWillUnmount() {
    this.stop();
  }

  _cycleIcons() {
    let toggleIndex = Math.floor(Math.random()*this.amountOfIcons);

    let newState = {...this.state};
    newState["icon" + toggleIndex + "Visible"] = !newState["icon" + toggleIndex + "Visible"];
    newState["colorIndex"] = (this.state.colorIndex + 1) % (this.amountOfColors*2);
    this.setState(newState);

    this.iconTimeout = setTimeout(() => { this._cycleIcons()}, this.props.duration || 600);
  }

  start() {
    this._cycleIcons();
  }

  stop() {
    clearTimeout(this.iconTimeout);
  }

  _getColors() {
    let result = [];
    this.props.colors.forEach((color, index) => {
      result.push(
        <FadeInView
          key={"colorIndex" + color + "_" + index}
          duration={this.props.duration || 600}
          visible={this.state.colorIndex >= (2*index) && this.state.colorIndex < (2*(1+index))}
          style={{position:'absolute', top:0, left:0, backgroundColor: color, width: screenWidth, height: this.props.height}}
        />
      )
    })
    return result;
  }
  _getIcons() {
    let result = [];
    this.props.icons.forEach((icon, index) => {
      result.push(
        <FadeInView
          key={"Icon" + index}
          duration={this.props.duration || 600}
          visible={this.state["icon" + index + "Visible"]}
          style={{position:'absolute', top:icon.top, left:icon.left}}>
          <Icon name={icon.name} size={icon.size} color={icon.color || colors.white.hex} style={{backgroundColor:'transparent'}} />
        </FadeInView>
      )
    })
    return result;
  }

  render() {
    return (
      <View style={{
        position:'absolute', top:0, left:0,
        width: screenWidth, height: this.props.height,
        overflow:'hidden'
      }}>
        {/*<NavigationEvents*/}
        {/*  onWillFocus={() => { this.start(); }}*/}
        {/*  onWillBlur={ () => { this.stop(); }}*/}
        {/*/>*/}
        { this._getColors() }
        { this._getIcons() }
      </View>
    )
  }
}
