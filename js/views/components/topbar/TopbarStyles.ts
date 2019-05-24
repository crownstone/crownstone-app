import {
  StyleSheet} from 'react-native';

import { colors, topBarHeight, statusBarHeight} from '../../styles'

let barHeight = topBarHeight - statusBarHeight;


export const topBarStyle = StyleSheet.create({
  topBar: {
    backgroundColor: colors.menuBackground.hex,
    flexDirection: 'row',
    paddingTop: statusBarHeight
  },
  topBarCenterView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLeft: {
    textAlign: 'left',
  },
  topBarLeftTouch: {
    // backgroundColor:'#ff0',
    height:barHeight,
    width:80,
    alignItems:'flex-start',
    justifyContent:'center'
  },
  topBarRightTouch: {
    height:barHeight,
    width:80,
  },
  topBarCenter: {
    textAlign: 'center',
  },
  topBarRight: {
    textAlign: 'right',
  },
  titleText: {
    fontSize: 18,
    color: 'white'
  },
  text:{
    fontSize: 17,
    fontWeight:'bold',
    color: colors.menuTextSelected.hex
  },
  leftText:{
    fontSize: 14,
    fontWeight:'bold',
    color: colors.white.hex
  }
});
