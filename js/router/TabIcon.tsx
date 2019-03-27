import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';
import { colors, screenWidth, tabBarHeight } from '../views/styles'
import { Icon }                      from '../views/components/Icon';
import { core } from "../core";

export class TabIcon extends Component<any, any> {
  unsubscribe = null;
  constructor(props) {
    super(props);

    this.state = { badge: 0, badgeScale: new Animated.Value(1) }
  }

  componentDidMount() {
    if (this.props.badgeOnMessages) {
      this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
        let state = core.store.getState();
        let activeSphere = state.app.activeSphere;

        let change = data.change;
        if (change.changeMessageState && change.changeMessageState.sphereIds[activeSphere]) {
          let newMessages = state.spheres[activeSphere].state.newMessageFound;

          if (this.state.badge === 0 && newMessages) {
            this.setState({ badge : 1 });
            Animated.sequence([
              Animated.timing(this.state.badgeScale,{ toValue: 4, duration: 100 }),
              Animated.timing(this.state.badgeScale,{ toValue: 1, duration: 150 }),
            ]).start()
          }
          if (this.state.badge > 0 && !newMessages) {
            this.setState({ badge : 0 });
          }
        }
      });
    }
  }

  componentWillUnmount() {
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
    }
  }

  render(){
    let alertSize = 14;
    const animatedStyle = {
      transform: [
        { scale: this.state.badgeScale },
      ]
    };
    let backgroundColor = this.state.badgeScale.interpolate({
      inputRange: [1,4],
      outputRange: [colors.green.hex, colors.csOrange.hex]
    });

    return (
      <View style={{width:screenWidth/3, height:tabBarHeight, alignItems:'center', justifyContent:'center'}}>
        <Icon
          name={this.props.iconString}
          size={31}
          color={this.props.focused ?  colors.menuTextSelected.hex : colors.menuText.hex}
          style={{backgroundColor:'transparent', padding:0, margin:0}}
        />
        <Text style={{
          fontSize:11,
          fontWeight:'200',
          color: (this.props.focused ?  colors.menuTextSelected.hex : colors.menuText.hex)
        }}>{this.props.tabTitle}</Text>
        { this.state.badge > 0 ?
          <Animated.View style={
            [animatedStyle,{
              position:'absolute',
              top:3,
              right:0,
              width:alertSize,
              height:alertSize,
              borderRadius:0.5*alertSize,
              backgroundColor:backgroundColor,
              borderWidth: 2,
              borderColor: colors.white.hex,
            }]} /> : undefined }
      </View>
    );
  }
}