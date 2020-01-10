import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ListOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
} from "react-native";

import { OverlayBox }           from '../components/overlays/OverlayBox'
import { colors, screenWidth, screenHeight, statusBarHeight } from "../styles";
import { ScaledImage } from "../components/ScaledImage";
import { Separator } from "../components/Separator";
import { NavigationUtil } from "../../util/NavigationUtil";

export class ListOverlay extends LiveComponent<any, any> {
  customContent : () => Component;
  callback : any;
  selection : string[];
  getItems : () => any[];
  themeColor: string;

  constructor(props) {
    super(props);
    this.state = {
      allowMultipleSelections: props.data.allowMultipleSelections || false,
      image:                   props.data.image,
      maxSelections:           props.data.maxSelections,
      saveLabel:               null,
      showSaveButton:          props.data.showSaveButton || false,
      separator: props.data.separator === undefined ? true : props.data.separator,
      title: props.data.title,
      showCustomContent: true,
      visible: false,
    };

    this.themeColor = props.data.themeColor || colors.green.hex;
    this.customContent = props.data.customContent || null;
    this.getItems = props.data.getItems;
    this.callback = props.data.callback;
    if (props.data.selection && Array.isArray(props.data.selection) === false) {
      this.selection = [props.data.selection];
    }
    else {
      this.selection = props.data.selection || [];
    }
  }

  componentDidMount() {
    this.setState({ visible: true });
  }

  getElements() {
    if (!this.state.visible) {
      return null;
    }

    let items = this.getItems();
    let elements = [];
    if (this.state.separator) {
      elements.push(<Separator opacity={0.35} key={"listOverlay_Separator_first"}/>)
    }
    items.forEach((item, i) => {
      let isSelected = this.selection.indexOf(item.id) !== -1;
      elements.push(
        <TouchableOpacity
          key={"listOverlayElement_"+i}
          style={{paddingLeft: 30, backgroundColor: isSelected ? this.themeColor : colors.white.hex}}
          onPress={() => {
            if (this.state.allowMultipleSelections) {
              if (isSelected) {
                this.selection.splice(this.selection.indexOf(item.id),1);
              }
              else {
                this.selection.push(item.id);
              }
              this.forceUpdate();
            }
            else {
              this.callback(item.id);
              this.close();
            }
          }}>
          {item.component ? item.component : undefined}
          {item.label ? <View style={{height:40, justifyContent:'center'}}>
            <Text style={{fontSize:15, fontWeight:'bold'}}>{item.label}</Text>
          </View>: undefined}
        </TouchableOpacity>
      );

      if (this.state.separator) {
        elements.push(<Separator opacity={0.35} key={"listOverlay_seperator_" + i}/>)
      }
    });

    return elements;
  }

  _getSaveButton() {
    if ((this.selection.length > 0 && this.state.allowMultipleSelections === true) || this.state.showSaveButton) {
      return (
        <View style={{flex:1, flexDirection:'row'}}>
          <View style={{flex:1}} />
          <TouchableOpacity
            style={{height:50, flex:3, borderColor:colors.white.hex, borderWidth:2, backgroundColor: this.themeColor, borderRadius: 20, alignItems: 'center', justifyContent:'center'}}
            onPress={() => {
              this.callback(this.selection);
              this.close();
            }}
          >
            <Text style={{fontSize:15, fontWeight:'bold'}}>{ lang("Save_selection_",this.state.saveLabel) }</Text>
          </TouchableOpacity>
          <View style={{flex:0.2}} />
        </View>
      )
    }
  }

  close() {
    this.callback = () => {};
    this.customContent = null;
    this.getItems = () => { return [] };
    this.selection = [];
    this.setState({
      allowMultipleSelections: false,
      image: null,
      maxSelections: null,
      saveLabel: null,
      showSaveButton:false,
      separator:true,
      title: "",
      visible:false,
    }, () => {  NavigationUtil.closeOverlay(this.props.componentId); });
  }

  render() {
    let idealAspectRatio = 1.75;
    let width = 0.85*screenWidth;
    let height = Math.min(width*idealAspectRatio, 0.9 * (screenHeight - statusBarHeight));

    let customContent = null;
    if (this.state.showCustomContent) {
      customContent = this.customContent
    }

    return (
      <OverlayBox
        visible={this.state.visible}
        height={height} width={width}
        overrideBackButton={false}
        canClose={true}
        scrollable={true}
        closeCallback={() => { this.close(); }}
        backgroundColor={colors.white.rgba(0.2)}
        getDesignElement={(innerSize) => { return (
          <ScaledImage source={this.state.image} sourceWidth={600} sourceHeight={600} targetHeight={innerSize}/>
        );}}
        title={ customContent ? null : this.state.title }
        footerComponent={this._getSaveButton()}
      >
        { customContent ? customContent({hideOverlayCallback:() => { this.close(); }, hideCustomContentCallback:() => { this.setState({showCustomContent: false}); }}) : this.getElements() }
        <View style={{height:50}} />
      </OverlayBox>
    );
  }
}



