//
// import { Languages } from "../../../Languages"
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("DEV_SelectionFilter", key)(a,b,c,d,e);
// }
import { SlideInView } from "../../components/animated/SlideInView";
import { availableScreenHeight, colors, screenWidth, styles } from "../../styles";
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BigFilterButton, filterState } from "./DEV_SelectionComponents";

export function DEV_SelectionFilter(props:  {submit: () => void, visible: boolean, update: () => void}) {
  let noneModeSelected = !(filterState.setup && filterState.verified && filterState.unverified && filterState.dfu);
  let noneTypeSelected = !(filterState.plug &&  filterState.builtin &&  filterState.builtinOne && filterState.guidestone && filterState.crownstoneUSB);

  return (
    <SlideInView
      hidden={true}
      visible={props.visible}
      height={availableScreenHeight}
      style={{width:screenWidth, height: availableScreenHeight,...styles.centered}}>
      <View style={{flex:1, maxHeight:30}}/>
      <Text style={{fontSize:20, fontWeight: 'bold'}}>{ lang("Select_Filters_") }</Text>
      <View style={{flex:1}}/>
      <View style={{flexDirection: 'row', width: screenWidth*0.9}}>
        <View style={{flex:1,width:0.45*screenWidth, alignItems:'center'}}>
          <Text style={{fontSize:16, fontWeight: 'bold'}}>{ lang("Mode_") }</Text>
          <BigFilterButton label={ lang("Setup")}       selected={filterState.setup}      callback={() => { filterState.setup = !filterState.setup; props.update() }}/>
          <BigFilterButton label={ lang("Verified")}    selected={filterState.verified}   callback={() => { filterState.verified = !filterState.verified; props.update(); }}/>
          <BigFilterButton label={ lang("Unverified")}  selected={filterState.unverified} callback={() => { filterState.unverified = !filterState.unverified; props.update(); }}/>
          <BigFilterButton label={ lang("DFU")}         selected={filterState.dfu}        callback={() => { filterState.dfu = !filterState.dfu; props.update;}}/>
        </View>
        <View style={{flex:1,width:0.5*screenWidth, alignItems:'center'}}>
          <Text style={{fontSize:16, fontWeight: 'bold'}}>{ lang("Type_") }</Text>
          <BigFilterButton label={ lang("Plug")}          selected={filterState.plug}          callback={() => { filterState.plug= !filterState.plug; props.update(); }}/>
          <BigFilterButton label={ lang("Built_in_Zero")} selected={filterState.builtin}       callback={() => { filterState.builtin= !filterState.builtin; props.update(); }}/>
          <BigFilterButton label={ lang("Built_in_One")}  selected={filterState.builtinOne}    callback={() => { filterState.builtinOne= !filterState.builtinOne; props.update();  }}/>
          <BigFilterButton label={ lang("Guidestone")}    selected={filterState.guidestone}    callback={() => { filterState.guidestone= !filterState.guidestone; props.update(); }}/>
          <BigFilterButton label={ lang("USB")}           selected={filterState.crownstoneUSB} callback={() => { filterState.crownstoneUSB= !filterState.crownstoneUSB; props.update(); }}/>
        </View>
      </View>

      <View style={{flexDirection: 'row', width: screenWidth*0.9}}>
        <View style={{flex:1,width:0.45*screenWidth, alignItems:'center'}}>
          <BigFilterButton
            label={noneModeSelected ? "All" : "None"}
            selected={false}
            callback={() => {
              let val = false;
              if (noneModeSelected) {
                val = true;
              }

              filterState.setup = val;
              filterState.verified = val;
              filterState.unverified = val;
              filterState.dfu = val;
              props.update();
            }}
          />
        </View>
        <View style={{flex:1,width:0.5*screenWidth, alignItems:'center'}}>
          <BigFilterButton
            label={noneTypeSelected ? "All" : "None"}
            selected={false}
            callback={() => {
              let val = false;
              if (noneTypeSelected) {
                val = true;
              }

              filterState.plug = val;
              filterState.builtin = val;
              filterState.builtinOne = val;
              filterState.guidestone = val;
              filterState.crownstoneUSB = val;
              props.update();
            }}
          />
        </View>
      </View>
      <View style={{flex:1}}/>
      <TouchableOpacity
        onPress={() => { props.submit()}}
        style={{padding:15, width: 0.75*screenWidth, ...styles.centered, borderRadius: 30, backgroundColor: colors.green.hex}}
      >
        <Text style={{fontSize:20, fontWeight: 'bold'}}>{ lang("Lets_go_") }</Text>
      </TouchableOpacity>
      <View style={{flex:1, maxHeight:30}}/>
    </SlideInView>
  );
}

