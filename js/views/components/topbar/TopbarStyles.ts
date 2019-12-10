import {
  Platform,
  StyleSheet
} from "react-native";

import { colors, topBarHeight, statusBarHeight} from '../../styles'

let barHeight = topBarHeight - statusBarHeight;
if (Platform.OS === 'android') {
  barHeight = topBarHeight;
}


export const topBarStyle = StyleSheet.create({
  topBar: {
    backgroundColor: colors.csBlueDarker.hex,
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
    fontWeight:'bold',
    color: 'white'
  },
  text:{
    fontSize: 17,
    color: colors.menuTextSelected.hex
  },
  leftText:{
    fontSize: 14,
    color: colors.white.hex
  }
});
