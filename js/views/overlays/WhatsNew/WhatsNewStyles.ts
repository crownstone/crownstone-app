import {
  StyleSheet,
  } from 'react-native';
import {colors} from "../../styles";

export const WNStyles = StyleSheet.create({
  important: {
    fontSize: 14,
    fontWeight:'bold',
    color: colors.red.hex,
    textAlign:'center'
  },
  text: {
    fontSize: 15,
    fontWeight:'bold',
    color: colors.csBlue.hex,
    textAlign:'center'
  },
  detail: {
    fontSize: 13,
    color: colors.csBlue.rgba(0.75),
    textAlign:'center'
  },
  innerScrollView: {
    alignItems: 'center',
    paddingBottom: 50,
    paddingLeft: 10,
    paddingRight: 10,
  },
  outerScrollView: {
  },
});
