import {
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

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
    width:70,
    paddingLeft: 10,
  },
  topBarRightTouch: {
    // backgroundColor:'#ff0',
    height:barHeight,
    width:70,
    paddingRight: 10,
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
  }
});
