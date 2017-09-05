import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {availableScreenHeight, colors} from "../../styles";

export const WNStyles = StyleSheet.create({
  important: {
    fontSize: 14,
    fontWeight:'bold',
    color: colors.red.hex,
    textAlign:'center'
  },
  text: {
    fontSize: 14,
    fontWeight:'bold',
    color: colors.csBlue.hex,
    textAlign:'center'
  },
  detail: {
    fontSize: 13,
    color: colors.csBlue.hex,
    textAlign:'center'
  },
  innerScrollView: {
    minHeight: availableScreenHeight,
    alignItems:'center',
    paddingBottom:20
  }
});
