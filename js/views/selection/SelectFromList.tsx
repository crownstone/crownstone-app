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
import {SeparatedItemList} from "../components/SeparatedItemList";


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

  _renderItem(item) {
    return (
      <View
        key={'selectFromList_' + item.id}
        style={{
          height: 50,
          backgroundColor: colors.white.rgba(0.75),
          alignItems:'center',
          flexDirection:'row',
          paddingLeft: 15,
          paddingRight: 15
        }}>
        { item.icon ? <IconButton name='ios-body' size={23} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7}}/> : undefined }

      </View>
    );
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
          <SeparatedItemList
            items={ this.props.items }
            separatorIndent={ false }
            renderer={ this._renderItem.bind(this) }
            focusOnLoad={ false }
            style={ {} }
          />
        </ScrollView>
      </Background>
    );
  }
}
