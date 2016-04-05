import React, {
  StyleSheet,
} from 'react-native';

export const colors = {
  menuBackground: {h:'#1c202a', r:28, g:32, b:42},
  menuText: {h:'#ffffff', r:255, g:255, b:255},
  menuTextSelected: {h:'#2daeff', r:2, g:222, b:255},
  separator: {h:'#cccccc', r:204, g:204, b:204},
  blue: {h:'#0075c9', r:0, g:117, b:201},
  green: {h:'#a0eb58', r:160, g:235, b:88},
  red: {h:'#ff3c00', r:255, g:60, b:0},
  iosBlue: {h:'#007aff', r:0, g:122, b:255},
};

export const stylesIOS = StyleSheet.create({
  topBar: {
    backgroundColor:colors.menuBackground.h,
    paddingTop:18,
    paddingLeft:6,
    paddingRight:6,
    flexDirection:'row'
  },
  topBarSideView: {
    justifyContent:'center',
    width:100,
  },


  topBarCenterView: {
    flex: 1,
    alignItems:'center',
    justifyContent:'center',
  },
  topBarLeft: {
    fontSize:17,
    color:colors.menuText.h,
    textAlign:'left',
  },
  topBarCenter: {
    fontSize:17,
    fontWeight:'bold',
    color:colors.menuText.h,
    textAlign:'center',
  },
  topBarRight: {
    fontSize:17,
    color:colors.menuText.h,
    textAlign:'right',
  },
  centered: {
    alignItems: 'center',
    justifyContent:'center',
  },
  roomImageContents: {
    padding:10,
    justifyContent:'center',
    backgroundColor: 'transparent'
  },
  roomImageText:{
    fontSize:17,
    fontWeight: 'bold',
    color:'#ffffff',
    padding:8,
    borderRadius:16,
    backgroundColor:'rgba(0,0,0,0.3)',
  },

  menuItem: {
    fontSize:9,
    color:colors.menuText.h

  },
  menuView: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    padding:3,
  },

  listView: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingLeft:15,
    paddingRight:15,
    alignItems: 'center',
  },
  listText:{
    width:130,
    fontSize: 17,
  },
  listTextLarge:{
    width:250,
    fontSize: 17,
  },
  separator: {
    height: 1,
    backgroundColor: colors.separator.h,
  },
  listItem: {

  },
  topExplanation: {
    paddingTop:20
  },
  rightNavigationValue: {
    color:'#888',
    paddingRight:15,
    textAlign:'right'
  },
  shadedStatusBar:{
    backgroundColor:'rgba(0,0,0,0.2)',
    height:20,
  },
});