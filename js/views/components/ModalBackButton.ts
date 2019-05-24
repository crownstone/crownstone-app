import { NavigationUtil } from "../../util/NavigationUtil";
import { Languages } from "../../Languages";


export const getModalBackButton = () => {
  return {
    leftButtons: [{
      id: 'back',
      component: {
        name:'topbarLeftButton',
        passProps: {
          text: Languages.get("__UNIVERSAL", "Back"), onPress:() => { NavigationUtil.dismissModal(); }
        }
      },
    }]
  }
}