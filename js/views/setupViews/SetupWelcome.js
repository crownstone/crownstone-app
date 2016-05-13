import React, {
Animated,
  Component,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from './../components/Background'
import { styles, colors } from './../styles'
import { setupStyle } from './SetupStyles'

let {width, height} = Dimensions.get("window");

export class SetupWelcome extends Component {
  constructor() {
    super();

    this.textPadding = 5;
    let totalTextHeight = 2 * 45 + 2 * this.textPadding + 27;
    let offset = height / 2 - totalTextHeight / 2;
    this.state = {
      welcome:    {x: new Animated.Value(width), y: new Animated.Value(offset)},
      to:         {x: new Animated.Value(width), y: new Animated.Value(offset + 45 + 2 * this.textPadding)},
      crownstone: {x: new Animated.Value(width), y: new Animated.Value(offset + 45 + 27 + 2*this.textPadding)},
      opacity: new Animated.Value(0)
    }
  }

  componentDidMount() {
    const {store} = this.props;
    let dt = 250;
    let start = 250;
    let welcomeTime = 1000;
    let fadeDelay = 400;
    let topOffset = 35;

    store.dispatch({type: 'APP_UPDATE', data: {doFirstTimeSetup: false}});
    setTimeout(() => {Animated.spring(this.state.welcome.x,   {toValue: 0, friction:8, tension:40}).start();},start);
    setTimeout(() => {Animated.spring(this.state.to.x,        {toValue: 0, friction:8, tension:40}).start();},start + dt);
    setTimeout(() => {Animated.spring(this.state.crownstone.x,{toValue: 0, friction:8, tension:40}).start();},start + 2*dt);
    setTimeout(() => {
      Animated.spring(this.state.welcome.y,   {toValue: topOffset, friction:8, tension:20}).start();
      Animated.spring(this.state.to.y,        {toValue: topOffset + 45 + 2 * this.textPadding, friction:8, tension:20}).start();
      Animated.spring(this.state.crownstone.y,{toValue: topOffset + 45 + 27 + 2 * this.textPadding, friction:8, tension:20}).start();
    },start + 2*dt + welcomeTime);
    setTimeout(() => {Animated.timing(this.state.opacity, {toValue: 1, duration:250}).start();},start + 2*dt + welcomeTime + fadeDelay);
  }


  render() {
    let fontSize;
    if (width > 370)
      fontSize = 45;
    else if (width > 300)
      fontSize = 40;
    else
      fontSize = 35;


    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <Animated.Text style={[setupStyle.header, {position:'absolute', fontSize: fontSize, left:this.state.welcome.x, top:this.state.welcome.y}]}>WELCOME</Animated.Text>
        <Animated.Text style={[setupStyle.header, {position:'absolute', fontSize: fontSize * 0.5, fontStyle:'italic', left:this.state.to.x, top:this.state.to.y}]}>to</Animated.Text>
        <Animated.Text style={[setupStyle.header, {position:'absolute', fontSize: fontSize, left:this.state.crownstone.x, top:this.state.crownstone.y}]}>CROWNSTONE</Animated.Text>
        <Animated.View style={{opacity:this.state.opacity, flex:1, marginTop:170}}>
          <Text style={[setupStyle.text, {fontSize: fontSize * 0.45}]}>Do you want to setup your own Crownstones or will you join an existing group?</Text>
          <Text style={[setupStyle.text, {fontSize: fontSize * 0.45}]}>You can always add Crownstones, Groups and Rooms later through the settings menu.</Text>
          <View style={{flex:1}} />
          <View style={setupStyle.buttonContainer}>
            <TouchableOpacity onPress={() => {Actions.tabBar()}} >
              <View style={setupStyle.button}><Text style={[setupStyle.buttonText]}>Skip setup</Text></View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {Actions.setupCreateGroup()}} >
              <View style={setupStyle.button}><Text style={[setupStyle.buttonText]}>Start the setup!</Text></View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Background>
    )
  }
}
