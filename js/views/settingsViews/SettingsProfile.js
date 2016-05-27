import React, { Component } from 'react' 
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { PictureCircle } from './../components/PictureCircle'
import { ListEditableItems } from './../components/ListEditableItems'
import { processImage, safeDeleteFile } from '../../util/util'
import { CLOUD } from '../../cloud/cloudAPI'
import { styles, colors, width } from './../styles'
import RNFS from 'react-native-fs'


export class SettingsProfile extends Component {
  constructor() {
    super();
    this.state = {picture:null};
  }

  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems(user) {
    let items = [];
    // room Name:
    items.push({type:'spacer'});
    items.push({label:'First Name', type: 'textEdit', value: user.firstName, callback: (newText) => {}});
    items.push({label:'Last Name', type: 'textEdit', value: user.lastName, callback: (newText) => {}});
    items.push({label:'Email', type: 'textEdit', value: user.email, callback: (newText) => {}});
    items.push({type:'spacer'});
    items.push({label:'Change Password', type: 'navigation', callback: () => {}});

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;

    return (
      <Background>
        <View style={{alignItems:'center', justifyContent:'center', width:width, paddingTop:40}}>
          <PictureCircle 
            value={this.state.picture} 
            callback={(pictureUrl) => {
                this.setState({picture:pictureUrl})
                let newFilename = user.userId + '.jpg';
                processImage(pictureUrl, newFilename).then((newPicturePath) => {
                  CLOUD.forUser(userId).uploadProfileImage(newPicturePath)
                })
              }} 
            removePicture={() => {
              safeDeleteFile(this.state.picture);
              this.setState({picture:null});
            }}
            size={120} />
        </View>
        <ScrollView>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
