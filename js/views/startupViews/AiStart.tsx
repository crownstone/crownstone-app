
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AiStart", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Platform
} from 'react-native';



import { Background } from '../components/Background'
import {LOGe} from '../../logging/Log'
import {styles, colors, screenWidth, screenHeight, topBarHeight, } from '../styles'
import { Icon } from '../components/Icon';
import { TextEditInput } from '../components/editComponents/TextEditInput'
import loginStyles from './LoginStyles'
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { Stacks } from "../../router/Stacks";



export class AiStart extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Your_AI")});
  }

  backButtonFunction : any;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    if (Object.keys(state.spheres).length === 0) {
      LOGe.info("User does not have a sphere on startup.");
      NavigationUtil.setRoot(Stacks.loggedIn());
    }

    let possibleNames = [
      'Amy',
      'Anne',
      'Bob',
      'Clive',
      'Crowny',
      'Daisy',
      'Dobby',
      'Dotty',
      'Grey',
      'Glados',
      'Evy',
      'Eve',
      'HAL',
      'James',
      'Marvin',
      'Nikki',
      'Pulli',
      'Robby',
      'Sam',
      'Sam',
      'Sky',
      'Suzy',
      'Rosii',
      'Sonny',
      'Stanley',
      'Tron',
      'Wally',
      'Watson',
    ];

    let defaultIndex = Math.floor(Math.random() * possibleNames.length);

    let sphereId = props.sphereId || Object.keys(state.spheres)[0];
    let name = state.spheres[sphereId].config.aiName || possibleNames[defaultIndex];
    this.state = {aiName: name};
  }


  render() {
    let state = core.store.getState();
    let userFirstName = state.user.firstName;

    let availableHeight = screenHeight - topBarHeight - 3*16 - 30 - 50 - 50;

    return (
      <Background hasNavBar={false} image={core.background.detailsDark}>
        <View style={[styles.centered, {flex:1}]}>
          <View style={{flex:1}} />
          <Icon name="c1-house" size={0.26*availableHeight} color={colors.white.hex} />
          <View style={{flex:1}} />
          <Text style={aiStyle.largeText}>{ lang("Welcome__",userFirstName) }</Text>
          <Text style={aiStyle.boldText}>{ lang("Im_your_house_") }</Text>
          <View style={{flex:1}} />
          <Text style={aiStyle.text}>{ lang("What_would_you_like_to_ca") }</Text>
          <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
            <TextEditInput
              style={{width: 0.8*screenWidth, padding:10}}
              placeholder={lang("Name_your_house_")}
              autocorrect={false}
              placeholderTextColor='#888'
              value={this.state.aiName}
              callback={(newValue) => {this.setState({aiName:newValue});}} />
          </View>
          <View style={{flex:3}} />
          <TouchableOpacity style={aiStyle.button} onPress={() => { this.handleAnswer(userFirstName); }}>
            <Text style={aiStyle.boldText}>{ lang("OK") }</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </Background>
    );
  }

  handleAnswer(userFirstName) {
    let name = this.state.aiName.trim();

    if (name.length === 0) {
      Alert.alert(
        lang("_Ehmm_____arguments_______header",userFirstName),
        lang("_Ehmm_____arguments_______body"),
        [{text:lang("_Ehmm_____arguments_______left")}]
      );
    }
    else {
      let state = core.store.getState();
      let sphereId = this.props.sphereId || Object.keys(state.spheres)[0];
      let title =  lang("Thank_you_");
      let detail =  lang("Its_nice_to_finally_meet_");
      let button =  lang("Lets_get_started_");
      if (this.props.canGoBack === true) {
        if (this.state.aiName === state.spheres[sphereId].config.aiName) {
          detail =  lang("I_think_my_name_describes");
          button =  lang("Youre_right_");
        }
        else {
          detail =  lang("This_name_is_much_better_");
          button =  lang("It_suits_you_");
        }
      }
      let defaultAction = () => {
        core.store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
        core.store.dispatch({type:'UPDATE_SPHERE_CONFIG', sphereId: sphereId, data: {aiName: this.state.aiName}});
        if (this.props.canGoBack === true) {
          NavigationUtil.back();
        }
        else if (this.props.resetViewStack === true) {
          NavigationUtil.setRoot(Stacks.loggedIn());
        }
        else {
          NavigationUtil.setRoot(Stacks.loggedIn());
        }
      };
      Alert.alert(title, detail, [{text: button, onPress: defaultAction}], { cancelable: false })
    }
  }
}


let aiStyle = StyleSheet.create({
  text: {
    fontSize:16, backgroundColor:'transparent', color:colors.white.hex, padding:10
  },
  boldText: {
    fontSize:19, fontWeight:'bold', backgroundColor:'transparent', color:colors.white.hex, padding:10
  },
  largeText: {
    fontSize:30, fontWeight:'bold', backgroundColor:'transparent', color:colors.white.hex
  },
  button: {
    borderWidth: 2, width:90, height:50, borderRadius:25, borderColor: colors.white.rgba(0.75), alignItems:'center', justifyContent:'center'
  }
});
