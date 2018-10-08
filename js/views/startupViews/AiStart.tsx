import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Alert,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View,
  Platform
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import {LOG, LOGe} from '../../logging/Log'
import {styles, colors, screenWidth, screenHeight, topBarHeight, OrangeLine} from '../styles'
import { Icon } from '../components/Icon';
import { TextEditInput } from '../components/editComponents/TextEditInput'
import loginStyles from './LoginStyles'
import {BackAction} from "../../util/Back";

export class AiStart extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: Languages.title("AiStart", "Your_AI")(),
    }
  };

  backButtonFunction : any;

  constructor(props) {
    super(props);

    let state = props.store.getState();
    if (Object.keys(state.spheres).length === 0) {
      LOGe.info("User does not have a sphere on startup.");
      Actions.tabBar();
    }

    let possibleNames = [
      {name:'Amy', gender:'female'},
      {name:'Anne', gender:'female'},
      {name:'Bob', gender:'male'},
      {name:'Clive', gender:'male'},
      {name:'Crowny', gender:'female'},
      {name:'Daisy', gender:'female'},
      {name:'Dobby', gender:'male'},
      {name:'Dotty', gender:'female'},
      {name:'Grey', gender:'male'},
      {name:'Glados', gender:'female'},
      {name:'Evy', gender:'female'},
      {name:'Eve', gender:'female'},
      {name:'HAL', gender:'male'},
      {name:'James', gender:'male'},
      {name:'Marvin', gender:'male'},
      {name:'Nikki', gender:'female'},
      {name:'Pulli', gender:'female'},
      {name:'Robby', gender:'male'},
      {name:'Sam', gender:'female'},
      {name:'Sam', gender:'male'},
      {name:'Sky', gender:'female'},
      {name:'Suzy', gender:'female'},
      {name:'Rosii', gender:'female'},
      {name:'Sonny', gender:'male'},
      {name:'Stanley', gender:'male'},
      {name:'Tron', gender:'male'},
      {name:'Wally', gender:'male'},
      {name:'Watson', gender:'male'},
    ];

    let defaultIndex = Math.floor(Math.random() * possibleNames.length);

    let sphereId = props.sphereId || Object.keys(state.spheres)[0];
    let name = state.spheres[sphereId].config.aiName || possibleNames[defaultIndex].name;
    let sex = state.spheres[sphereId].config.aiSex || possibleNames[defaultIndex].gender;
    this.state = {aiName: name, aiSex: sex};
  }

  componentDidMount() {
    if (this.props.canGoBack !== true) {
      this.disableBackButton();
    }
  }

  componentWillUnmount() {
    this.restoreBackButton();
  }

  disableBackButton() {
    // Execute callback function and return true to override.
    this.backButtonFunction = () => { return true; };
    BackHandler.addEventListener('hardwareBackPress', this.backButtonFunction);
  }

  restoreBackButton() {
    if (typeof this.backButtonFunction === 'function') {
      BackHandler.removeEventListener('hardwareBackPress', this.backButtonFunction);
      this.backButtonFunction = null;
    }
  }

  render() {
    let state = this.props.store.getState();
    let userFirstName = state.user.firstName;

    let availableHeight = screenHeight - topBarHeight - 3*16 - 30 - 50 - 50;

    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark}>
        <OrangeLine/>
        <View style={[styles.centered, {flex:1}]}>
          <View style={{flex:1}} />
          <Icon name="c1-house" size={0.26*availableHeight} color={colors.white.hex} />
          <View style={{flex:1}} />
          <Text style={aiStyle.largeText}>{ Languages.text("AiStart", "Welcome__")(userFirstName) }</Text>
          <Text style={aiStyle.boldText}>{ Languages.text("AiStart", "Im_your_house_")() }</Text>
          <View style={{flex:1}} />
          <Text style={aiStyle.text}>{ Languages.text("AiStart", "What_would_you_like_to_ca")() }</Text>
          <View style={[loginStyles.textBoxView, {width: 0.8*screenWidth}]}>
            <TextEditInput
              style={{width: 0.8*screenWidth, padding:10}}
              placeholder={Languages.label("AiStart", "Name_your_house_")}
              autocorrect={false}
              placeholderTextColor='#888'
              value={this.state.aiName}
              callback={(newValue) => {this.setState({aiName:newValue});}} />
          </View>
          <View style={{flex:1}} />
          <Text style={aiStyle.text}>{ Languages.text("AiStart", "Whats_my_gender_")() }</Text>
          <View style={{flexDirection:'row', paddingBottom:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => {this.setState({aiSex:'male'});}} style={{justifyContent:'center'}} >
              <Icon name="c1-male" size={(this.state.aiSex === 'male' ? 0.21 : 0.18) * availableHeight} color={this.state.aiSex === 'male' ? colors.white.hex : colors.white.rgba(0.15)} />
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={() => {this.setState({aiSex:'female'});}}  style={{justifyContent:'center'}} >
              <Icon name="c1-female" size={(this.state.aiSex === 'female' ? 0.21 : 0.18) * availableHeight} color={this.state.aiSex === 'female' ? colors.white.hex : colors.white.rgba(0.15)} />
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flex:1}} />
          <TouchableOpacity style={aiStyle.button} onPress={() => { this.handleAnswer(userFirstName); }}>
            <Text style={aiStyle.boldText}>{ Languages.text("AiStart", "OK")() }</Text>
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
        Languages.alert("AiStart", "_Ehmm_____arguments_______header")(userFirstName),
        Languages.alert("AiStart", "_Ehmm_____arguments_______body")(),
        [{text:Languages.alert("AiStart", "_Ehmm_____arguments_______left")()}]
      );
    }
    else {
      let state = this.props.store.getState();
      let sphereId = this.props.sphereId || Object.keys(state.spheres)[0];
      let title =  Languages.label("AiStart", "Thank_you_")();
      let detail =  Languages.label("AiStart", "Its_nice_to_finally_meet_")();
      let button =  Languages.label("AiStart", "Lets_get_started_")();
      if (this.props.canGoBack === true) {
        if (this.state.aiName === state.spheres[sphereId].config.aiName && this.state.aiSex === state.spheres[sphereId].config.aiSex) {
          detail =  Languages.label("AiStart", "I_think_my_name_and_gende")();
          button =  Languages.label("AiStart", "Youre_right_")();
        }
        else if (this.state.aiName !== state.spheres[sphereId].config.aiName && this.state.aiSex === state.spheres[sphereId].config.aiSex) {
          detail =  Languages.label("AiStart", "This_name_is_much_better_")();
          button =  Languages.label("AiStart", "It_suits_you_")();
        }
        else if (this.state.aiName === state.spheres[sphereId].config.aiName && this.state.aiSex !== state.spheres[sphereId].config.aiSex) {
          detail =  Languages.label("AiStart", "Youre_right__I_feel_much_")(this.state.aiSex);
          button =  Languages.label("AiStart", "I_thought_so_too_")();
        }
        else {
          detail =  Languages.label("AiStart", "Im_a_like_whole_new_perso")();
          button =  Languages.label("AiStart", "Nice_to_meet_you_too_")();
        }
      }
      let defaultAction = () => {
        this.props.store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
        this.props.store.dispatch({type:'UPDATE_SPHERE_CONFIG', sphereId: sphereId, data: {aiName: this.state.aiName, aiSex: this.state.aiSex}});
        if (this.props.canGoBack === true) {
          BackAction();
        }
        else {
          this.restoreBackButton();
          if (Platform.OS === 'android') {
            Actions.sphereOverview();
          }
          else {
            Actions.tabBar();
          }
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
