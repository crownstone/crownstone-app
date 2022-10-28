
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Topbar", key)(a,b,c,d,e);
}
import * as React from 'react';

import {
  Platform,
  View
} from 'react-native';

import {topBarHeight, statusBarHeight, colors} from '../styles'
import {useSafeAreaInsets} from "react-native-safe-area-context";
import {TopBarBlur} from "./NavBarBlur";
import {TopBarCenterIOS, TopBarLeftIOS, TopBarRightIOS} from "./CustomTopBarWrapperIOS";
import {TopBarCenterAndroid, TopBarLeftAndroid, TopBarRightAndroid} from "./CustomTopBarWrapperAndroid";


const TopBarContext = React.createContext({height: 0});

export const useTopBarOffset = () => {
  let topbarcontext = React.useContext(TopBarContext);
  if (!topbarcontext) {
    return {height:0};
  }
  return topbarcontext;
}

export function CustomTopBarWrapper(props) {
  let insets = useSafeAreaInsets();

  return (
    <React.Fragment>
      <TopBarContext.Provider value={{height: topBarHeight - insets.top}}>
        {props.children}
      </TopBarContext.Provider>
      { props.noBlur !== true && <TopBarBlur dark={props.dark}/> }
      <View style={{
        position:'absolute', top:0, left:0, right:0,
        height: topBarHeight, paddingTop:insets.top,
        flexDirection:'row',
        borderColor: colors.black.rgba(0.1),
        borderBottomWidth: props.line ? 1 : 0,
      }}>
        {Platform.OS === 'android' ? <TopBarLeftAndroid   {...props} /> : <TopBarLeftIOS   {...props} /> }
        {Platform.OS === 'android' ? <TopBarCenterAndroid {...props} /> : <TopBarCenterIOS {...props} /> }
        {Platform.OS === 'android' ? <TopBarRightAndroid  {...props} /> : <TopBarRightIOS  {...props} /> }
      </View>
    </React.Fragment>
  )
}

export function CustomTopBarWrapperWithLine(props) {
  return <CustomTopBarWrapper {...props} line={true} />
}

