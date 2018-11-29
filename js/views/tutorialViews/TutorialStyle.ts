import { colors, screenWidth } from "../styles";
import {
  StyleSheet,
} from 'react-native';
let textColor = colors.white;

export const tutorialStyle = StyleSheet.create({
header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'800'
},
text: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
    fontWeight:'500'
},
subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
},
explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
}
});