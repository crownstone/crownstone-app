import React, {
  Component,
  TouchableHighlight,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  SliderIOS,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';

import { IconCircle } from '../components/IconCircle'
import { PictureCircle } from '../components/PictureCircle'
import { Explanation } from '../components/Explanation'
import { EditSpacer } from '../components/EditSpacer'
import Slider from 'react-native-slider'
var Icon = require('react-native-vector-icons/Ionicons');
import { stylesIOS, colors } from '../styles'
let styles = stylesIOS;


/**
 * This module offers the following types:
 *
 * explanation - Text above or below an editable item with padding.
     --> {label: text, below: boolean, style: style object to overrule explanation style}

 * spacer - Empty space to separate editable items.
     --> {}

 * textEdit - TextEdit field
     --> {label: field label, value: text, callback: (newValue) => {}}

 * button - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, callback: callback to store changes}

 * icon - Trigger to change the icon
     --> {label: field label, value: iconName, callback: (newValue) => {}}

 * picture - Trigger to remove a picture or add one
     --> {label: field label, value: pictureURI, callback: (newValue) => {}}

 * slider - slider control with optional label
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * switch - native boolean switch
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * navigation - text with an > for navigation in a menu. The value and valueStyle is optional
     --> {label: field label, value: text, callback: (newValue) => {}, valueStyle: style object to overrule value style, labelStyle: style object to overrule label style}

 */
export class EditableItem extends Component {
  render() {
    let pxRatio = PixelRatio.get();
    let height = 21*pxRatio;
    let heightLarge = 40*pxRatio;

    switch (this.props.type) {
      case 'explanation':
        return (
          <Explanation style={this.props.style} text={this.props.label} below={this.props.below} />
        );
      case 'spacer':
        return (
          <EditSpacer />
        );
      case 'textEdit':
        return (
          <View>
            <View style={[styles.listView, {height}]}>
              <Text style={styles.listText}>{this.props.label}</Text>
              <TextInput
                style={{flex:1}}
                onChangeText={(text) => this.props.callback(text)}
                value={this.props.value}
              />
            </View>
          </View>
        );
      case 'button':
        return (
          <TouchableOpacity onPress={this.props.callback}>
            <View style={[styles.listView, {height}]}>
              <Text style={[styles.listTextLarge, {color:'#e00'}]}>{this.props.label}</Text>
            </View>
          </TouchableOpacity>
        );
      case 'icon':
        return (
          <View style={{flex:1}}>
            <View style={[styles.listView, {paddingTop:10,alignItems:'flex-start',height:heightLarge}]}>
              <Text style={styles.listText}>{this.props.label}</Text>
              <TouchableOpacity onPress={this.props.callback}>
                <View>
                  <IconCircle icon={this.props.value} showEdit={true} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'picture':
        return (
          <View style={{flex:1}}>
            <View style={[styles.listView, {paddingTop:10,alignItems:'flex-start',height:heightLarge}]}>
              <Text style={styles.listText}>{this.props.label}</Text>
              {this.props.value !== undefined ? <PictureCircle picture={require('../../images/mediaRoom.png')} /> : <IconCircle icon={'ios-camera-outline'} color='#b0b0cf' showAdd={true} />}
            </View>
          </View>
        );
      case 'switch':
        return (
          <View style={[styles.listView, {height}]}>
            <Text style={styles.listTextLarge}>{this.props.label}</Text>
            <View style={{flex:1}} />
            <Switch
              value={this.props.value}
              onValueChange={this.props.callback}
            />
          </View>
        );
      case 'slider':
        return (
          <View style={[styles.listView, {height}]}>
            {this.props.label !== undefined ? <View><Text style={styles.listText}>{this.props.label}</Text></View> : undefined}
            <View style={{
              flex: 1,
              marginLeft: 10,
              marginRight: 10,
              alignItems: 'stretch',
              justifyContent: 'center',
            }} >
            <SliderIOS
              value={this.props.value}
              onSlidingComplete={this.props.callback}
            />
            </View>
          </View>
        );
      case 'checkbar':
        return (
          <TouchableHighlight onPress={this.props.callback}>
            <View style={[styles.listView, {height}]}>
              <Text style={styles.listTextLarge}>{this.props.label}</Text>
              <View style={{flex:1}} />
              {
                this.props.value === true ?
                  <View style={{paddingTop:3}}>
                    <Icon name="ios-checkmark-empty" size={30} color={colors.iosBlue.h} />
                  </View>
                : undefined
              }
            </View>
          </TouchableHighlight>
        );

      case 'navigation':
        return (
          <TouchableHighlight onPress={this.props.callback}>
            <View style={[styles.listView, {height}]}>
              {this.props.value !== undefined ?
                <Text style={[styles.listText, this.props.labelStyle]}>{this.props.label}</Text>
                :
                <Text style={[styles.listTextLarge, this.props.labelStyle]}>{this.props.label}</Text>
              }
              {this.props.value !== undefined ?
                <Text style={[{flex:1, fontSize:17}, this.props.valueStyle]}>{this.props.value}</Text>
                :
                <View style={{flex:1}} />
              }
              <View style={{paddingTop:3}}>
                <Icon name="ios-arrow-right" size={18} color={'#888'} />
              </View>
            </View>
          </TouchableHighlight>
        );
      default:
        return (
          <View key={this.props.key}>
            <View style={[styles.listView, {height, flex:1}]}>
              <Text>{this.props.label + ' - UNHANDLED for ' + this.props.type}</Text>
            </View>
          </View>
        );
    }
  }
}
