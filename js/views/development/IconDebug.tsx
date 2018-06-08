import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background }  from '../components/Background'
import { IconSelection }  from '../components/IconSelection'
import {colors, screenWidth} from "../styles";
import {BackAction} from "../../util/Back";
import {glyphMapC1, glyphMapC2, glyphMapC3} from "../../fonts/customIcons";
// import glyphMap from 'react-native-vector-icons/glyphmaps/Ionicons.json'

const Actions = require('react-native-router-flux').Actions;



export class IconDebug extends Component<{callback(icon: string) : void, icon: string, backgrounds: any}, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Pick an Icon",
    }
  };

  constructor(props) {
    super(props)
  }

  render() {
    // console.log(glyphMap)
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <View style={{backgroundColor: colors.csOrange.hex, height:2, width:screenWidth}} />
        <ScrollView>
          <IconSelection
            categories={[
              {key: 'c1', label: 'c1'},
              {key: 'c2', label: 'c2'},
              {key: 'c3', label: 'c3'},
              // {key: 'ionicons',  label: 'ionicons'},
              // {key: 'evilIcons', label: 'evilIcons'},
            ]}
            icons={{
              c1: Object.keys(glyphMapC1),
              c2: Object.keys(glyphMapC2),
              c3: Object.keys(glyphMapC3)
            }}
            selectedIcon={this.props.icon}
            debug={true}
            callback={(newIcon) => {
              this.props.callback(newIcon);
              BackAction();
            }}
          />
        </ScrollView>
      </Background>
    );
  }
}
