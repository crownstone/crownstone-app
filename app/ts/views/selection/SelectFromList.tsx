
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SelectFromList", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


import {
  background,
  colors
} from "../styles";
import {Background} from "../components/Background";
import {IconButton} from "../components/IconButton";
import {Icon} from "../components/Icon";
import {SeparatedItemList} from "../components/SeparatedItemList";
import {EditableItem} from "../components/EditableItem";
import {ProfilePicture} from "../components/ProfilePicture";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { SettingsScrollView } from "../components/SettingsScrollView";
import { SettingsBackground } from "../components/SettingsBackground";



export class SelectFromList extends Component<any, any> {

  constructor(props) {
    super(props);

    let stateData = {
      selectedItemIds: {},
      singularId: null
    };

    // select required items beforehand
    props.items.forEach((item) => {
      if (item.selected === true) {
        stateData.selectedItemIds[item.id] = true;
        if (item.singular === true) {
          stateData.singularId = item.id;
        }
      }
    });

    this.state = stateData;
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

            this.props.callback(newIds);

            if (item.singular) {
              NavigationUtil.back();
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
          { item.icon ? <IconButton name={item.icon} size={item.iconSize || 29} buttonSize={48} radius={29}  color="#fff" buttonStyle={{backgroundColor: colors.green.hex, marginLeft:3, marginRight:7, borderColor: colors.white.hex, borderWidth: 3}}/> : undefined }
          { item.picture || item.person ? <ProfilePicture picture={item.picture} size={50} />: undefined }
          { item.text ? <Text style={{paddingLeft: 15, fontSize: 18, color: colors.black.hex}}>{item.text}</Text> : undefined }
          <View style={{flex:1}} />
          { this.state.selectedItemIds[item.id] === true ? <Icon name="ios-checkmark" size={30} color={colors.csBlue.hex} /> : undefined }
        </TouchableOpacity>
      );
    }

  }

  render() {
    return (
      <SettingsBackground>
        <SettingsScrollView>
          <SeparatedItemList
            items={ this.props.items }
            separatorIndent={ false }
            renderer={ this._renderItem.bind(this) }
            focusOnLoad={ false }
            style={ {} }
          />
        </SettingsScrollView>
      </SettingsBackground>
    );
  }
}
