
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ScenePictureGallery", key)(a,b,c,d,e);
}
import { LiveComponent } from "../LiveComponent";
import React from "react";
import { FlatList, Image, Platform, Text, View, TextStyle, TouchableHighlight, TouchableOpacity } from "react-native";
import { colors, screenWidth, styles } from "../styles";
import { TopBarUtil } from "../../util/TopBarUtil";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { Button } from "../components/Button";
import { ErrorCode } from "react-native-image-picker/lib/typescript/types";
import { SelectPicture } from "../components/PictureCircle";
import {
  PICTURE_GALLERY_TYPES,
  SCENE_PICTURE_DATA,
  SCENE_STOCK_PICTURE_LIST,
  SCENE_TYPES
} from "./constants/SceneConstants";



const typeStyle : TextStyle = {
  color: colors.white.hex,
  fontSize: 24,
  paddingLeft: 20,
  paddingBottom: 10,
}


const imageSize = screenWidth/11;
const imageStyle = {height:3*imageSize, width:4*imageSize, marginLeft:15, borderRadius:10 };



export class ScenePictureGallery extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Pick_a_picture"), closeModal: true });
  }


  categories = {};
  constructor(props) {
    super(props);

    this.categories = {
      bedtime:       lang("Bedtime"),
      board_games:   lang("Boardgames"),
      cooking:       lang("Cooking"),
      dinner:        lang("Dinner"),
      eco:           lang("Eco"),
      gaming:        lang("Gaming"),
      good_morning:  lang("Good_morning"),
      hobby_and_art: lang("Hobby_and_art"),
      movie_time:    lang("Movie_time"),
      music:         lang("Music"),
      party:         lang("Party"),
      relax:         lang("Relax"),
      romantic:      lang("Romantic"),
      sports:        lang("Sports"),
      study:         lang("Study"),
      weather:       lang("Weather"),
    }
  }

  handleCustomImage = () => {
    NavigationUtil.dismissModal();
    setTimeout(() => {
      SelectPicture((uri) => {
        this.props.callback(uri, PICTURE_GALLERY_TYPES.CUSTOM);
      })
    }, 200)
  }

  renderStockImages = ({item, index, separators}) => {
    return (
      <TouchableHighlight
        key={item.key}
        onPress={() => { this.props.callback(item.data, PICTURE_GALLERY_TYPES.STOCK); NavigationUtil.dismissModal(); }}
      >
        <Image style={imageStyle} source={SCENE_STOCK_PICTURE_LIST[item.data]} />
      </TouchableHighlight>
    )
  }

  renderStockGroup = ({item, index, separators}) => {
    if (index == 0) {
      return (
        <View style={{marginTop: 30,}}>
          <Text style={typeStyle}>{ lang("Custom_picture") }</Text>
          <Button
            iconPosition={ "right"}
            icon={'ios-camera'}
            xl={true}
            backgroundColor={colors.blue.hex}
            iconColor={colors.blueDark.hex}
            label={ lang("Take_or_select_picture___")}
            callback={this.handleCustomImage}
          />
        </View>
      );
    }

    return (
      <View style={{marginTop: 30}}>
        <Text style={typeStyle}>{this.categories[item.key] || item.name}</Text>
        <FlatList horizontal={true} data={SCENE_PICTURE_DATA[item.type]} removeClippedSubviews={true} initialNumToRender={4} renderItem={this.renderStockImages} showsHorizontalScrollIndicator={false} />
      </View>
    );
  }

  render() {
    return (
      <View style={{flex:1, backgroundColor: colors.black.hex}}>
        <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} />
        <FlatList
          data={SCENE_TYPES}
          removeClippedSubviews={true}
          initialNumToRender={6}
          renderItem={this.renderStockGroup}
        />
      </View>
    );
  }
}