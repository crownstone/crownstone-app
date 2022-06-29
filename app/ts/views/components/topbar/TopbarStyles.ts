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
    backgroundColor: 'transparent',
    flexDirection: 'row',
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
    color: colors.black.hex,
  },
  text:{
    fontSize: 17,
    color: colors.iosBlue.hex
  },
  leftText:{
    fontSize: 14,
    color: colors.white.hex
  }
});
