import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import { IconButton }         from '../components/IconButton'
import { OverlayBox }         from '../components/overlays/OverlayBox'
import { colors , screenHeight, screenWidth} from '../styles'
import { eventBus } from "../../util/EventBus";
import { SeparatedItemList } from "../components/SeparatedItemList";
import { Icon } from "../components/Icon";
const Actions = require('react-native-router-flux').Actions;



export class SphereSelectionOverlay extends Component<any, any> {
  unsubscribe : any;
  activeSphere : string;

  constructor(props) {
    super(props);
    this.state = { visible: false };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showSphereSelectionOverlay", () => {
      this.setState({ visible: true });
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _sphereRenderer(item, index, itemId) {
    let color = colors.white.hex;
    let textStyle = {paddingLeft:10, flex:1};
    if (this.activeSphere === itemId) {
      color = colors.csBlue.hex;
      textStyle['fontWeight'] = '600';
      textStyle['color'] = colors.white.hex;
    }
    return (
      <TouchableOpacity
        key={'spherePicker'+index}
        style={{flexDirection: 'row', width:0.7*screenWidth, height:40, backgroundColor: color, alignItems:'center'}}
        onPress={() => {
          this.props.store.dispatch({type:"SET_ACTIVE_SPHERE", data: {activeSphere: itemId}});
          this.setState({visible:false});
        }}
      >
        <Text style={textStyle}>{item.config.name + '\'s Sphere'}</Text>
        {item.config.present ? <Icon name="c1-locationPin1" size={20} style={{paddingRight:10}} color={colors.black.rgba(0.4)} /> : undefined }
      </TouchableOpacity>
    )
  }

  render() {
    let state = this.props.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let spheres = state.spheres;
    this.activeSphere = state.app.activeSphere;

    return (
      <OverlayBox
        visible={this.state.visible}
        canClose={true} closeCallback={() => { this.setState({visible:false}); }}
        overrideBackButton={() => { this.setState({visible:false}); }}
        backgroundColor={colors.menuBackground.rgba(0.5)}
      >
        <Text style={{fontSize: 17, fontWeight: 'bold', color: colors.csBlue.hex, padding:15, textAlign:'center'}}>{"Select a Sphere:"}</Text>
        <IconButton
          name="c1-sphere"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.csBlue.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative',}}
        />
        <View style={{flex:0.05}} />
        <Text style={{fontSize: 10, fontWeight: '300', color: colors.csBlue.hex, padding:15, textAlign:'center'}}>{"Tap a Sphere from the list to visit it."}</Text>
        <View style={{flex:0.05}} />
        <ScrollView style={{flex:1}}>
          <SeparatedItemList
            items={spheres}
            ids={sphereIds}
            separatorIndent={false}
            boundingOpacity={0.6}
            renderer={this._sphereRenderer.bind(this)}
          />
        </ScrollView>
      </OverlayBox>
    );
  }
}