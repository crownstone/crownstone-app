
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView, Text,
  View
} from "react-native";

import {
  screenWidth, availableScreenHeight, deviceStyles
} from "../styles";
import { LiveComponent }          from "../LiveComponent";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Background } from "../components/Background";



export class ScenesOverview extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Scenes"});
  }


  constructor(props) {
    super(props);
  }

  componentDidMount() { }

  componentWillUnmount() { }

  render() {
    let state = core.store.getState();
    let activeSphere = state.app.activeSphere;

    if (activeSphere && state.spheres[activeSphere]) {
      let sphere = state.spheres[activeSphere];
      return (
        <Background image={core.background.lightBlur}>
          <View style={{flex:1, justifyContent:'center', padding: 20, paddingTop:30}}>
            <Text style={deviceStyles.subHeader}>{ "Shortcuts:"}</Text>
            <View style={{padding:20}}>

            </View>
            <View style={{flex:1}} />
            <Text style={deviceStyles.subHeader}>{ "Scenes:"}</Text>
            <View style={{padding:20}}>
              <Text style={{...deviceStyles.text, textAlign:'left'}}>{ "In future releases you can add custom scenes to quickly set the mood."}</Text>
            </View>
            <View style={{flex:1}} />
          </View>
        </Background>
      );
    }
    else {
      return (
        <Background image={core.background.lightBlur}>
          <View style={{flex:1, justifyContent:'center', padding: 30}}>
            <View style={{flex:1}} />
            <Text style={deviceStyles.text}>{ "Add a sphere to use Scenes! You can go to the overview, tap edit and create one now!"}</Text>
            <View style={{flex:1}} />
          </View>
        </Background>
      );
    }
  }

}

