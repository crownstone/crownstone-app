import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;
import {availableScreenHeight, colors, screenHeight, screenWidth, tabBarHeight, topBarHeight} from '../styles'
import {Background} from "../components/Background";
import {TopBar} from "../components/Topbar";
import {IconButton} from "../components/IconButton";
import {Util} from "../../util/Util";
import {ListEditableItems} from "../components/ListEditableItems";
import {Icon} from "../components/Icon";


export class SelectFromList extends Component<any, any> {

  constructor() {
    super();

    this.state = {
      selectedItemIds: {}
    };
  }

  componentWillMount() {

  }

  componentDidMount() {

  }

  componentWillUnmount() {

  }

  _getItems() {
    let items = [];
    this.props.items.forEach((item) => {
      // item.push()
    })
  }

  render() {
    return (
      <Background image={this.props.backgrounds.detailsDark} hideTopBar={true}>
        <TopBar
          leftAction={() => { Actions.pop(); }}
          notBack={true}
          left={'Cancel'}
          right={'Select'}
          leftStyle={{color: colors.white.hex}}
          rightStyle={{fontWeight: 'bold'}}
          rightAction={() => { this.props.callback(); }}
          title={this.props.title}
        />
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView style={{flex:1}}>
          { this._getItems() }
        </ScrollView>
      </Background>
      );
  }
}
