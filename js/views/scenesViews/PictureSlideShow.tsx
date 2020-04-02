import { LiveComponent } from "../LiveComponent";
import React from "react";
import { FlatList, Platform, TouchableHighlight, Text, View, TouchableOpacity, TextStyle } from "react-native";
import { colors, screenWidth, styles } from "../styles";



const imageSize = screenWidth/11;
export class PictureSlideShow extends LiveComponent<any, any> {
  _ren = ({item, index, separators}) => {
    return (
      <TouchableHighlight
        key={item.key}
          // onPress={() => this._onPress(item)}
        onShowUnderlay={separators.highlight}
        onHideUnderlay={separators.unhighlight}
      >
        <View style={{ backgroundColor: colors.random().hex,  height:3*imageSize, width:4*imageSize, marginLeft:15, borderRadius:10 }}>
        <Text>{item.title}</Text>
        </View>
      </TouchableHighlight>
    )
  }

  _ren2 = ({item, index, separators}) => {
    let data = [];
    for (let i = 0; i< 1000; i++) {
      data.push( { title: 'my Title' + i, key: 'item'+i },)
    }
    let typeStyle : TextStyle = {
      color: colors.white.hex,
      fontSize: 24,
      paddingLeft: 20,
      paddingBottom: 10,
    }
    if (index == 0) {
      return (
        <View style={{marginTop: 30,}}>
          <Text style={typeStyle}>{"Custom picture"}</Text>
          <TouchableOpacity onPress={() => {
          }} style={{...styles.centered, padding:20, backgroundColor: colors.menuTextSelected.hex, borderRadius: 10, marginHorizontal: 15}}>
            <Text style={{fontSize:16, color: colors.white.hex, fontWeight: 'bold'}}>Take or select picture...</Text>
          </TouchableOpacity>


        </View>

      )
    }

    return (
      <View style={{marginTop: 30}}>
        <Text style={typeStyle}>{item.type}</Text>
        <FlatList horizontal={true} data={data} initialNumToRender={4} renderItem={this._ren} showsHorizontalScrollIndicator={false} />
      </View>
    )
  }

  render() {
    let types = [];
    for (let i = 0; i< 1000; i++) {
      types.push( { type:"Dinner Time" + i, key: 'typeIitem'+i },)
    }
    return (
      <View style={{flex:1, backgroundColor: colors.black.hex}}>
        <FlatList
          data={types}
          initialNumToRender={6}
          renderItem={this._ren2}
        />
      </View>
    );
  }
}