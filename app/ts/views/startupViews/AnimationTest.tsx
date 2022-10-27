
import * as React from 'react';
import {Component} from 'react';
import {Platform,} from 'react-native';
import {StoreManager} from '../../database/storeManager'
import {BackgroundProcessHandler} from '../../backgroundProcesses/BackgroundProcessHandler'
import {Splash} from "./Splash";
import {core} from "../../Core";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import {Stacks} from "../Stacks";
import {stylesUpdateConstants} from "../../views/styles";
import {Bluenet} from "../../native/libInterface/Bluenet";
import SplashScreen from 'react-native-splash-screen';
import LottieView from 'lottie-react-native';


export class AnimationTest extends Component<any, any> {
  unsubscribe = [];

  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }

  componentWillUnmount() { // cleanup
  }


  render() {
    return <LottieView source={require('../../../assets/animations/stickFigure.json')} style={{backgroundColor:"#f00"}} autoPlay loop />;
  }
}

