
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LockOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
} from "react-native";

import { OverlayBox }           from '../components/overlays/OverlayBox'
import { styles, colors, screenWidth, screenHeight } from "../styles";
import { core } from "../../core";
import { ScaledImage } from "../components/ScaledImage";
import { Separator } from "../components/Separator";

export class ListOverlay extends Component<any, any> {
  unsubscribe : any;
  customContent : Component;
  callback : any;
  selection : string[];
  getItems : () => any[]

  constructor(props) {
    super(props);
    this.state = {
      allowMultipleSelections: false,
      image: null,
      maxSelections: null,
      saveLabel: null,
      showSaveButton:false,
      separator:true,
      title: "",
      visible: false,
    };
    this.unsubscribe = [];

    this.callback = () => {}
    this.customContent = null;
    this.getItems = () => { return [] };
    this.selection = [];
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("showListOverlay", (data) => {
      this.customContent = data.customContent || null;
      this.getItems = data.getItems;
      this.callback = data.callback;
      if (data.selection && Array.isArray(data.selection) === false) {
        this.selection = [data.selection];
      }
      else {
        this.selection = data.selection || [];
      }
      this.setState({
        visible: true,
        image: data.image,
        separator: data.separator === undefined ? true : data.separator,
        title: data.title,
        allowMultipleSelections: data.allowMultipleSelections || false,
        maxSelections: data.maxSelections,
      });
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  getElements() {
    if (!this.state.visible) {
      return null;
    }

    let items = this.getItems()
    let elements = [];
    if (this.state.separator) {
      elements.push(<Separator key={"listOverlay_Separator_first"}/>)
    }
    items.forEach((item, i) => {
      let isSelected = this.selection.indexOf(item.id) !== -1
      elements.push(
        <TouchableOpacity
          key={"listOverlayElement_"+i}
          style={{paddingLeft: 30, backgroundColor: isSelected ? colors.green.hex : colors.white.hex}}
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
        elements.push(<Separator key={"listOverlay_seperator_" + i}/>)
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
            style={{height:50, flex:3, borderColor:colors.white.hex, borderWidth:2, backgroundColor:colors.green.hex, borderRadius: 20, alignItems: 'center', justifyContent:'center'}}
            onPress={() => {
              this.callback(this.selection);
              this.close();
            }}
          >
            <Text style={{fontSize:15, fontWeight:'bold'}}>{this.state.saveLabel || "Save selection!"}</Text>
          </TouchableOpacity>
          <View style={{flex:0.2}} />
        </View>
      )
    }
  }

  close() {
    this.callback = () => {}
    this.customContent = null;
    this.getItems = () => { return [] }
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
    });
  }

  render() {
    let idealAspectRatio = 1.75;
    let width = 0.85*screenWidth;
    let height = Math.min(width*idealAspectRatio, 0.9 * screenHeight);

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
        title={this.state.title}
        footerComponent={this._getSaveButton()}
      >
        { this.customContent ? this.customContent : this.getElements() }
        <View style={{height:50}} />
      </OverlayBox>
    );
  }
}



