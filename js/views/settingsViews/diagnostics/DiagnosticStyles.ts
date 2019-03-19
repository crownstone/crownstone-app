import { colors, screenWidth } from "../../styles";

export const diagnosticStyles = {
  explanationStyle: {fontSize:15, paddingLeft:20, paddingRight:20, textAlign:'center'},
  headerStyle:      {fontSize:15, paddingLeft:20, paddingRight:20, padding:30, textAlign:'center', fontWeight:'bold'},
  titleStyle:       {fontSize:30, paddingLeft:20, paddingRight:20, paddingTop:25, textAlign:'center', fontWeight:'bold'},
  labelStyle:       {fontSize: 18, color: colors.menuBackground.hex, fontWeight: 'bold', },
  optionLabelStyle: {fontSize: 16, color: colors.csBlue.hex, fontWeight: 'bold', width: 0.80*screenWidth},
  buttonStyle:      {
    width:0.7*screenWidth,
    height:50,
    borderRadius: 25,
    borderWidth:2,
    borderColor: colors.menuBackground.hex,
    alignItems:'center',
    justifyContent:'center',
    marginBottom:30,
    marginTop:50,
  },
  smallButtonStyle: {
    width:0.35*screenWidth,
    height:50,
    borderRadius: 25,
    borderWidth:2,
    borderColor: colors.menuBackground.hex,
    alignItems:'center',
    justifyContent:'center',
    marginBottom:30,
    marginTop:50,
  },
  optionStyle: {
    flexDirection:'row',
    width:0.9*screenWidth,
    backgroundColor: colors.white.rgba(0.5),
    borderRadius:27,
    height:54,
    alignItems:'center',
    justifyContent:'flex-start',
    paddingLeft:10,
    marginTop:20,
  }
};


export const DiagnosticStates = {
  INTRODUCTION:         'INTRODUCTION',
  INITIAL_TESTS:        'INITIAL_TESTS',
  INITIAL_TESTS_REVIEW: 'INITIAL_TESTS_REVIEW',
  NO_STONES:            'NO_STONES',
  NOT_IN_SPHERE:        'NOT_IN_SPHERE',
  IN_SPHERE:            'IN_SPHERE',
};
