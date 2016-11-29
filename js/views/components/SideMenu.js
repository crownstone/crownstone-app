import React, { Component } from 'react'
import {
  Alert,
  AppRegistry,
  Navigator,
  Dimensions,
  Image,
  PixelRatio,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SideBar }  from './SideBar'
import Drawer       from 'react-native-drawer';
import { Scene, Router, Actions, DefaultRenderer } from 'react-native-router-flux';
import { styles, colors, screenWidth, screenHeight } from '../styles'

export class SideMenu extends Component {
  constructor(props) {
    super();
    this.state = {open: props.navigationState.open}
  }

  componentWillReceiveProps(nextProps) {
    console.log("will receive", nextProps)
    this.setState({open: nextProps.navigationState.open})
  }

  render(){
    console.log("rendering SideMenu", this.state.open)
    const state = this.props.navigationState;
    const children = state.children;
    return (
      <Drawer
        ref="navigation"
        open={this.state.open}
        onOpen={ () => {console.log("onOpen"); Actions.refresh({key:state.key, open: true})}}
        onClose={() => {console.log("onClose"); Actions.refresh({key:state.key, open: false})}}
        type="overlay"
        content={<SideBar closeCallback={()=> {this.setState({open:false}); console.log("setting")}} />}
        tapToClose={true}
        openDrawerOffset={0.25}
        panCloseMask={0.25}
        negotiatePan={true}
        styles={drawerStyles}
        tweenHandler={(ratio) => ({
          main: { opacity:Math.max(0.5,1-0.75*ratio) }
        })}>
        <DefaultRenderer navigationState={children[0]} onNavigate={this.props.onNavigate} />
      </Drawer>
    );
  }
}

const drawerStyles = {
  // drawer: { shadowColor: '#000000', shadowOpacity: 0.8, shadowRadius: 3},
  drawer: {elevation: 3},
};
