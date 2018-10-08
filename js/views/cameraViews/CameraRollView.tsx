import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  CameraRoll,
  Image,
  Dimensions,
  Platform,
  ScrollView,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;
import {styles, OrangeLine} from '../styles'
import {LOG, LOGe} from '../../logging/Log'
import {BackAction} from "../../util/Back";

export class CameraRollView extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: Languages.title("CameraRollView", "Choose_a_Picture")(),
    }
  };

  pictureIndex : any;
  state : any;
  active : any;
  fetchPicturesTimeout : any;

  constructor(props) {
    super(props);
    this.pictureIndex = undefined;
    this.state = {pictures:[]};
    this.active = true;
    this.fetchPicturesTimeout = setTimeout(() => { this.fetchPictures(); }, 350);
  }

  componentWillUnmount() {
    this.active = false;
    clearTimeout(this.fetchPicturesTimeout);
  }

  fetchPictures() {
    if (this.active === true) {
      let query = {
        first: 10,
        assetType: 'Photos',
      };
      if (Platform.OS === 'ios') {
        query['groupTypes'] = 'SavedPhotos';
      }

      if (this.pictureIndex !== undefined) {
        query["after"] = this.pictureIndex;
      }
      
      CameraRoll.getPhotos(query).then((data) => {
        if (this.active === true) {
          this.pictureIndex = data.page_info.end_cursor;
          if (data.page_info.has_next_page === true) {
            this.fetchPictures();
          }

          let pictures = [...this.state.pictures, ...data.edges];
          this.setState({pictures: pictures})
        }
      }).catch((err) => {
        if (err.code === "E_UNABLE_TO_LOAD") {
          let defaultActions = () => {BackAction();};
          Alert.alert(
Languages.alert("CameraRollView", "_I_do_not_have_access_to__header")(),
Languages.alert("CameraRollView", "_I_do_not_have_access_to__body")(),
[{text:Languages.alert("CameraRollView", "_I_do_not_have_access_to__left")(), onPress: defaultActions }],
            { onDismiss: defaultActions}
          );
        }
        else {
          LOGe.info(err.message, err)
        }
      });
    }
  }

  drawPictures() {
    if (this.state.pictures.length > 0) {
      let width = Dimensions.get('window').width;

      let amountX = 4;
      let size = width / amountX;

      let images = [];
      let rows = [];
      this.state.pictures.forEach((edge, index) => {
        images.push((
          <TouchableHighlight key={'image'+index} onPress={() => {
            clearTimeout(this.fetchPicturesTimeout);
            this.active = false;
            this.props.selectCallback(edge.node.image.uri);
            BackAction();
            }}>
            <Image source={{uri: edge.node.image.uri}} style={{width:size,height:size}}/>
          </TouchableHighlight>
        ));
        if (images.length == amountX) {
          rows.push(<View key={'imageRow' + rows.length} style={{flexDirection:'row'}}>{images}</View>);
          images = [];
        }
      });

      if (images.length > 0) {
        rows.push(<View key={'imageRow' + rows.length} style={{flexDirection:'row'}}>{images}</View>);
        images = [];
      }

      return <ScrollView key="theScroll" style={{flexDirection:'column'}}>{rows}</ScrollView>;
    }
  }

  render() {
    return (
      <View style={[styles.fullscreen, {backgroundColor:'#fff'}]}>
        <OrangeLine/>
        {this.drawPictures()}
      </View>
    );
  }
}
