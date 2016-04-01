import React, {
  Component,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';

import { IconCircle } from '../components/IconCircle'
import { PictureCircle } from '../components/PictureCircle'
import { Explanation } from '../components/Explanation'
import { EditSpacer } from '../components/EditSpacer'
var Icon = require('react-native-vector-icons/Ionicons');
import { stylesIOS, colors } from '../styles'
let styles = stylesIOS;

export class EditableItem extends Component {
  render() {
    let pxRatio = PixelRatio.get();
    let height = 21*pxRatio;
    let heightLarge = 40*pxRatio;

    switch (this.props.type) {
      case 'explanation':
        return (
          <Explanation style={this.props.style} text={this.props.label} key={this.props.label} below={this.props.below} />
        );
      case 'spacer':
        return (
          <EditSpacer />
        );
      case 'text':
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
      case 'icon':
        return (
          <View style={{flex:1}} key={this.props.key}>
            <View style={[styles.listView, {paddingTop:10,alignItems:'flex-start',height:heightLarge}]}>
              <Text style={styles.listText}>{this.props.label}</Text>
              <TouchableOpacity onPress={() => this.props.callback()}>
                <View>
                  <IconCircle icon={this.props.value} showEdit={true} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'picture':
        return (
          <View style={{flex:1}} key={this.props.key}>
            <View style={[styles.listView, {paddingTop:10,alignItems:'flex-start',height:heightLarge}]}>
              <Text style={styles.listText}>{this.props.label}</Text>
              {this.props.value !== undefined ? <PictureCircle picture={require('../../images/mediaRoom.png')} /> : <IconCircle icon={'ios-camera-outline'} color='#b0b0cf' showAdd={true} />}
            </View>
          </View>
        );
      case 'switch':
        return (
          <View key={this.props.key}>
            <View style={[styles.listView, {height}]}>
              <Text style={styles.listTextLarge}>{this.props.label}</Text>
              <View style={{flex:1}} />
              <Switch
                value={this.props.value}
                onValueChange={(newValue) => this.props.callback(newValue)}
              />
            </View>
          </View>
        );
      case 'navigation':
        return (
          <View key={this.props.key}>
            <TouchableOpacity onPress={this.props.callback}>
              <View style={[styles.listView, {height}]}>
                <Text style={styles.listTextLarge}>{this.props.label}</Text>
                <View style={{flex:1}} />
                <View style={{paddingRight:10}}>
                  <Icon name="ios-arrow-right" size={23} color={'#bababa'} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        );
      case 'navigationValue':
        return (
          <View key={this.props.key}>
            <TouchableOpacity onPress={this.props.callback}>
              <View style={[styles.listView, {height}]}>
                <Text style={styles.listText}>{this.props.label}</Text>
                <Text style={[{flex:1}, this.props.valueStyle || {}]}>{this.props.value}</Text>
                <View style={{paddingRight:10}}>
                  <Icon name="ios-arrow-right" size={23} color={'#bababa'} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
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
