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
import {EditableItem} from "../components/EditableItem";
import {ProfilePicture} from "../components/ProfilePicture";


export class SelectFromList extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = {
      selectedItemIds: {},
      singularId: null
    };

    // select required items beforehand
    props.items.forEach((item) => {
      if (item.selected === true) {
        this.state.selectedItemIds[item.id] = true;
        if (item.singular === true) {
          this.state.singularId = item.id;
        }
      }
    })

  }

  _renderItem(item) {
    if (item.type) {
      return <EditableItem key={'editableItemFromList_' + item.id} {...item} />;
    }
    else {
      return (
        <TouchableOpacity
          key={'selectFromList_' + item.id}
          onPress={ () => {
            let newIds = {};
            if (item.singular === true) {
              newIds[item.id] = true;
            }
            else {
              newIds = this.state.selectedItemIds;
              if (this.state.singularId) {
                newIds[this.state.singularId] = false;
              }
              newIds[item.id] = newIds[item.id] !== true;
            }
            this.setState({selectedItemIds: newIds, singularId: item.singular ? item.id : null});

            if (item.singular) {
              this.props.callback(newIds);
              Actions.pop();
            }
          }}
          style={{
            height: 80,
            backgroundColor: this.state.selectedItemIds[item.id] === true ? colors.white.rgba(1) : colors.white.rgba(0.65),
            alignItems:'center',
            flexDirection:'row',
            paddingLeft: 15,
            paddingRight: 15
          }}>
          { item.icon ? <IconButton name={item.icon} size={item.iconSize || 29} buttonSize={48} radius={29} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 3}}/> : undefined }
          { item.picture || item.person ? <ProfilePicture picture={item.picture} size={50} />: undefined }
          { item.text ? <Text style={{paddingLeft: 15, fontSize: 18, color: colors.black.hex}}>{item.text}</Text> : undefined }

        </TouchableOpacity>
      );
    }

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
          rightAction={() => { this.props.callback(this.state.selectedItemIds); Actions.pop() }}
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
