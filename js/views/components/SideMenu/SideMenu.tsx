import * as React from 'react'; import { Component } from 'react';
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
import { styles, colors, screenWidth, screenHeight } from '../../styles'

export class SideMenu extends Component<any, any> {
  constructor(props) {
    super();
    this.state = {open: props.navigationState.open, viewProps: {}}
  }

  componentWillReceiveProps(nextProps) {
    this.setState({open: nextProps.navigationState.open, viewProps: nextProps.navigationState.viewProps});
  }

  render(){
    const state = this.props.navigationState;
    const children = state.children;
    return (
      <Drawer
        ref="navigation"
        open={this.state.open}
        onOpen={ () => {Actions.refresh({key:state.key, open: true})}}
        onClose={() => {Actions.refresh({key:state.key, open: false})}}
        type="overlay"
        content={<SideBar closeCallback={()=> {this.setState({open:false});}} store={this.props.store} viewProps={this.state.viewProps} />}
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
