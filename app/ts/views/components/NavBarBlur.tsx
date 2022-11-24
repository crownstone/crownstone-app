import {colors, screenWidth, statusBarHeight, styles, tabBarHeight, topBarHeight} from "../styles";
import { Platform, View, ViewStyle } from "react-native";
import * as React from "react";
import {NotificationLine} from "./NotificationLine";
import { AnimatedCircle } from "./animated/AnimatedCircle";
import {Blur} from "./Blur";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const android = 'android';
const ios     = 'ios';

export function NavBarBlur(props) {
  let backgroundColor = 'transparent';
  if (props.xlight) {
    backgroundColor = colors.white.rgba(Platform.OS === 'ios' ? 0.4 : 0.9);
  }
  else if (props.xxlight) {
    backgroundColor = colors.white.rgba(Platform.OS === 'ios' ? 0.6 : 1);
  }
  else if (Platform.OS === 'android') {
    backgroundColor = colors.white.rgba(0.6);
  }

  return (
    <React.Fragment>
      {props.noLine !== true && <View style={{position:'absolute', bottom:tabBarHeight,   width:screenWidth, height:1, backgroundColor: colors.black.rgba(0.1)}} />}

      {
        Platform.OS === ios &&
        <Blur blurType={'light'} blurAmount={4} style={{
          position:'absolute',
          bottom:0,
          height:tabBarHeight,
          width:screenWidth,
          backgroundColor,
        }}>
          { props.line && <View style={{height:1, width: screenWidth, backgroundColor: colors.blue.rgba(0.45)}} /> }
        </Blur>
      }
      {
        Platform.OS === android && <SvgGradientInverted height={tabBarHeight} width={screenWidth} from={colors.white.rgba(0.6)} to={colors.white.rgba(0.9)} style={{position:'absolute', bottom:0,}} />
      }
      {
        Platform.OS === android && props.line && <View style={{position:'absolute', bottom:tabBarHeight-1, width:screenWidth, height:1, backgroundColor: colors.blue.rgba(0.45)}} />
      }
    </React.Fragment>
  );
}


export function TopBarBlur(props: {dark?: boolean, xlight?: boolean, xxlight?: boolean, disabledBlur?: boolean, children?: any, showNotifications?: boolean, blink? : UIBlinkSettings}) {
  let backgroundColor = 'transparent';
  if (props.xlight) {
    backgroundColor = colors.white.rgba(Platform.OS === 'ios' ? 0.4 : 0.75);
  }
  else if (props.xxlight) {
    backgroundColor = colors.white.rgba(Platform.OS === 'ios' ? 0.6 : 0.9);
  }

  let style : ViewStyle = {
    height: topBarHeight, width:screenWidth, paddingBottom: 8,
    backgroundColor
  };

  if (props.disabledBlur) {
    return (
      <View style={{ position:'absolute', top:0 }}>
        <View style={style}>
        <View style={{flex:1}} />
        { props.children }
        </View>
        <NotificationLine showNotifications={props.showNotifications}/>
      </View>
    )
  }

  return (
    <View style={{ position:'absolute', top:0 }}>
      { Platform.OS === android && <SvgGradient height={topBarHeight} width={screenWidth} from={colors.white.rgba(0.6)} to={colors.white.rgba(0.9)} /> }
      { Platform.OS === ios     && <Blur blurType={props.dark ? 'dark' : 'light'} blurAmount={4} style={style} /> }

      { props.blink && props.blink.left  && <Blinker style={{top: topBarHeight - (0.5*(topBarHeight - statusBarHeight)) - 4, left:27}}  /> }
      { props.blink && props.blink.right && <Blinker style={{top: topBarHeight - (0.5*(topBarHeight - statusBarHeight)) - 4, right:27}} /> }

      <View style={{ position:'absolute', top:statusBarHeight, width: screenWidth }}>
      <View style={{flex:1}} />
        { props.children }
      </View>
      <NotificationLine showNotifications={props.showNotifications}/>
    </View>
  );
}

export function Blinker(props) {
  return (
    <View style={{position:'absolute', overflow:'visible', backgroundColor: 'red', ...props.style}} pointerEvents={"none"}>
      <Blinky color={colors.csOrange}/>
      <Blinky scale={0.4} color={colors.blue} delay={200} />
    </View>
  )
}


class Blinky extends React.Component<any, any> {
  animationInterval = null;
  startTimeout  = null;
  animationTimeout  = null;
  animationTimeout2  = null;

  sizes = [0,0]

  colors = [
    (this.props.color ?? colors.green).rgba(this.props.opacity ?? 0.4),
    colors.white.rgba(this.props.opacity ?? 0.4),
  ]

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.animate();
  }

  componentWillUnmount() {
    this.stopAnimation();
  }

  animate() {
    clearInterval(this.animationInterval);
    clearTimeout(this.animationTimeout);
    clearTimeout(this.animationTimeout2);

    let pulse = () => {
      this.sizes[0] = 140 * (this.props.scale ?? 1);
      this.sizes[1] = 160 * (this.props.scale ?? 1);

      this.colors[0] = (this.props.color ?? colors.green).rgba(0);
      this.colors[1] = colors.white.rgba(0);
      this.forceUpdate()
      this.animationTimeout = setTimeout(() => {
        this.sizes[0] = 0;
        this.sizes[1] = 0;
        this.forceUpdate()
        this.animationTimeout2 = setTimeout(() => {
          this.colors[0] = (this.props.color ?? colors.green).rgba(this.props.opacity ?? 0.4);
          this.colors[1] = colors.white.rgba(this.props.opacity ?? 0.4);
          this.forceUpdate()
        }, 400);

      },800)
    }

    this.startTimeout = setTimeout(() => {
      this.animationInterval = setInterval(pulse,2000);
      pulse();
    }, this.props.delay ?? 0)
  }

  stopAnimation() {
    clearInterval(this.animationInterval);
    clearTimeout(this.animationTimeout);
    clearTimeout(this.startTimeout);
    clearTimeout(this.animationTimeout2);
    this.forceUpdate();
  }

  render() {
    let maxSize = 160 * (this.props.scale ?? 1)
    return (
      <View style={{ position:'absolute', top:0, left:0}} pointerEvents={"none"}>
        <View style={{ position:'relative', top:-0.5*maxSize, left:-0.5*maxSize, width: maxSize, height: maxSize, ...styles.centered}} pointerEvents={"none"}>
          <AnimatedCircle size={this.sizes[0]} color={this.colors[0]} delay={0}>
            <AnimatedCircle size={this.sizes[1]} color={this.colors[1]} delay={200}>
            </AnimatedCircle>
          </AnimatedCircle>
        </View>
      </View>
    );
  }
}

function SvgGradient(props) {
  return (
    <SvgGradientCustom
      height={props.height}
      width={props.width}
      style={props.style}
      from={props.from}
      to={props.to}
      toOffset={0.2}
      fromOffset={1}
    />
  );
}
function SvgGradientInverted(props) {
  return (
    <SvgGradientCustom
      height={props.height}
      width={props.width}
      style={props.style}
      from={props.to}
      to={props.from}
      toOffset={0}
      fromOffset={0.8}
    />
  );
}

function SvgGradientCustom(props) {
  let [to,   toOpacity]   = parseColor(props.to);
  let [from, fromOpacity] = parseColor(props.from);

  return (
    <Svg height={props.height} width={props.width} style={props.style}>
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset={props.toOffset}   stopColor={ to   } stopOpacity={toOpacity} />
          <Stop offset={props.fromOffset} stopColor={ from } stopOpacity={fromOpacity}/>
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grad)"/>
    </Svg>
  )
}



// Works with rgba(255,255,255,1.0) and #ffffff and returns [hexColor:string, opacity:number]
function parseColor(color) {
  let opacity = 1;
  if (color.startsWith('rgba')) {
    let parts = color.substring(5).split(',');
    opacity = parseFloat(parts[3].replace(')',''));
    color = `#${uint8ToHex(parts[0])}${uint8ToHex(parts[1])}${uint8ToHex(parts[2])}`;
  }
  return [color, opacity];
}

function uint8ToHex(uint8) {
  let val = Number(uint8);
  let hex = val.toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
}
