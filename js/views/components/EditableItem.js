import React, {
  Component,
  DatePickerIOS,
  Dimensions,
  TouchableHighlight,
  TouchableOpacity,
  Picker,
  PixelRatio,
  ScrollView,
  SliderIOS,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';

import { IconCircle }       from '../components/IconCircle'
import { PictureCircle }    from '../components/PictureCircle'
import { Explanation }      from '../components/Explanation'
import { EditSpacer }       from '../components/EditSpacer'
import { SlideFadeInView }  from '../components/SlideFadeInView'
import Slider               from 'react-native-slider'
var Icon = require('react-native-vector-icons/Ionicons');
import { stylesIOS, colors } from '../styles'
let styles = stylesIOS;


/**
 *
 * This module offers the following types:

 * button - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, callback: callback to store changes}

 * checkbar - Just a text which acts like a button (modeled after iOS Delete contact button)
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * explanation - Text above or below an editable item with padding.
     --> {label: text, below: boolean, style: style object to overrule explanation style}

 * icon - Trigger to change the icon
     --> {label: field label, value: iconName, callback: (newValue) => {}}

 * navigation - text with an > for navigation in a menu. The value and valueStyle is optional
     --> {label: field label, value: text, callback: (newValue) => {}, valueStyle: style object to overrule value style, labelStyle: style object to overrule label style}

 * picture - Trigger to remove a picture or add one
     --> {label: field label, value: pictureURI, callback: (newValue) => {}}

 * slider - slider control with optional label
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * spacer - Empty space to separate editable items.
     --> {}

 * switch - native boolean switch
     --> {label: field label, value: boolean, callback: (newValue) => {}}

 * textEdit - TextEdit field
     --> {label: field label, value: text, callback: (newValue) => {}}

 */
export class EditableItem extends Component {
  constructor() {
    super();
  }

  render() {
    let pxRatio = PixelRatio.get();
    let width = Dimensions.get('window').width;
    let height = 21*pxRatio;
    let heightLarge = 40*pxRatio;

    if (this.props.setActiveElement === undefined) {
      this.props.setActiveElement = () => {};
    }

    switch (this.props.type) {
      case 'button':
        return (
          <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
            <View style={[styles.listView, {height}]}>
              <Text style={[styles.listTextLarge, {color:'#e00'}]}>{this.props.label}</Text>
            </View>
          </TouchableHighlight>
        );
      case 'checkbar':
        return (
          <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
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
      case 'explanation':
        return (
          <Explanation style={this.props.style} text={this.props.label} below={this.props.below} />
        );
      case 'icon':
        return (
          <View style={{flex:1}}>
            <View style={[styles.listView, {paddingTop:10,alignItems:'flex-start',height:heightLarge}]}>
              <Text style={styles.listText}>{this.props.label}</Text>
              <TouchableOpacity onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
                <View>
                  <IconCircle icon={this.props.value} showEdit={true} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'navigation':
        return (
          <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
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
              onValueChange={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
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
              onSlidingComplete={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
            />
            </View>
          </View>
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
                value={this.props.value}
                onChangeText={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
              />
            </View>
          </View>
        );
      case 'timePicker':
        // TODO: Wait for RN to fix the checking.
        let formatTime = (time) => {
          let hours = this.props.value.getHours();
          let mins = this.props.value.getMinutes();
          hours = hours < 10 ? '0' + hours : hours;
          mins = mins < 10 ? '0' + mins : mins;
          return hours + ':' + mins;
        }
        return (
          <View>
            <TouchableHighlight onPress={() => {this.props.setActiveElement()}}>
              <View style={[styles.listView, {height}]}>
                <Text style={[styles.listTextLarge, this.props.labelStyle]}>{this.props.label}</Text>
                <Text style={[{flex:1, fontSize:17, textAlign:'right'}, this.props.valueStyle]}>{formatTime(this.props.value)}</Text>
              </View>
            </TouchableHighlight>
            <SlideFadeInView height={216} visible={this.props.activeElement == this.props.elementIndex} >
              <View style={{flex:1, backgroundColor:'#fff', alignItems:'center', justifyContent:'center'}} >
                <DatePickerIOS
                  date={this.props.value}
                  mode="time"
                  timeZoneOffsetInMinutes={0}
                  onDateChange={this.props.callback}
                  minuteInterval={10}
                />
              </View>
            </SlideFadeInView>
          </View>
        )
      default:
        return (
          <View>
            <View style={[styles.listView, {height, flex:1}]}>
              <Text>{this.props.label + ' - UNHANDLED for ' + this.props.type}</Text>
            </View>
          </View>
        );
    }
  }
}
