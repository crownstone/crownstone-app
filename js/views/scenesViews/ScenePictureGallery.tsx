
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
import ImagePicker from "react-native-image-picker";
import { xUtil } from "../../util/StandAloneUtil";
import { Button } from "../components/Button";
import { ImagePickerOptions } from "react-native-image-picker/src/internal/types";


export const PICTURE_GALLERY_TYPES = {
  STOCK: "STOCK",
  CUSTOM: "CUSTOM",
}
export const SCENE_IMAGE_SOURCE = {
  bedtime: {
    'bedtime_1.jpg': require("../../images/scenes/bedtime/bedtime_1.jpg"),
    'bedtime_2.jpg': require("../../images/scenes/bedtime/bedtime_2.jpg"),
    'bedtime_3.jpg': require("../../images/scenes/bedtime/bedtime_3.jpg"),
    'bedtime_4.jpg': require("../../images/scenes/bedtime/bedtime_4.jpg"),
    'bedtime_5.jpg': require("../../images/scenes/bedtime/bedtime_5.jpg"),
    'bedtime_6.jpg': require("../../images/scenes/bedtime/bedtime_6.jpg"),
    'bedtime_7.jpg': require("../../images/scenes/bedtime/bedtime_7.jpg"),
    'bedtime_8.jpg': require("../../images/scenes/bedtime/bedtime_8.jpg"),
    'bedtime_9.jpg': require("../../images/scenes/bedtime/bedtime_9.jpg"),
    'bedtime_10.jpg': require("../../images/scenes/bedtime/bedtime_10.jpg"),
    'bedtime_11.jpg': require("../../images/scenes/bedtime/bedtime_11.jpg"),
    'bedtime_12.jpg': require("../../images/scenes/bedtime/bedtime_12.jpg"),
    'bedtime_13.jpg': require("../../images/scenes/bedtime/bedtime_13.jpg")
  },
  board_games: {
    'board_games_0.jpg': require("../../images/scenes/board_games/board_games_0.jpg"),
    'board_games_1.jpg': require("../../images/scenes/board_games/board_games_1.jpg"),
    'board_games_2.jpg': require("../../images/scenes/board_games/board_games_2.jpg"),
    'board_games_3.jpg': require("../../images/scenes/board_games/board_games_3.jpg"),
    'board_games_4.jpg': require("../../images/scenes/board_games/board_games_4.jpg"),
    'board_games_5.jpg': require("../../images/scenes/board_games/board_games_5.jpg"),
    'board_games_6.jpg': require("../../images/scenes/board_games/board_games_6.jpg"),
    'board_games_7.jpg': require("../../images/scenes/board_games/board_games_7.jpg"),
    'board_games_8.jpg': require("../../images/scenes/board_games/board_games_8.jpg"),
    'board_games_9.jpg': require("../../images/scenes/board_games/board_games_9.jpg")
  },
  cooking: {
    'cooking_0.jpg': require("../../images/scenes/cooking/cooking_0.jpg"),
    'cooking_1.jpg': require("../../images/scenes/cooking/cooking_1.jpg"),
    'cooking_2.jpg': require("../../images/scenes/cooking/cooking_2.jpg"),
    'cooking_3.jpg': require("../../images/scenes/cooking/cooking_3.jpg"),
    'cooking_4.jpg': require("../../images/scenes/cooking/cooking_4.jpg"),
    'cooking_5.jpg': require("../../images/scenes/cooking/cooking_5.jpg"),
    'cooking_6.jpg': require("../../images/scenes/cooking/cooking_6.jpg"),
    'cooking_7.jpg': require("../../images/scenes/cooking/cooking_7.jpg"),
    'cooking_8.jpg': require("../../images/scenes/cooking/cooking_8.jpg"),
    'cooking_9.jpg': require("../../images/scenes/cooking/cooking_9.jpg"),
  },
  dinner: {
    'dinner_1.jpg': require("../../images/scenes/dinner/dinner_1.jpg"),
    'dinner_2.jpg': require("../../images/scenes/dinner/dinner_2.jpg"),
    'dinner_3.jpg': require("../../images/scenes/dinner/dinner_3.jpg"),
    'dinner_4.jpg': require("../../images/scenes/dinner/dinner_4.jpg"),
    'dinner_5.jpg': require("../../images/scenes/dinner/dinner_5.jpg"),
    'dinner_6.jpg': require("../../images/scenes/dinner/dinner_6.jpg"),
    'dinner_7.jpg': require("../../images/scenes/dinner/dinner_7.jpg"),
    'dinner_8.jpg': require("../../images/scenes/dinner/dinner_8.jpg"),
    'dinner_9.jpg': require("../../images/scenes/dinner/dinner_9.jpg"),
    'dinner_10.jpg': require("../../images/scenes/dinner/dinner_10.jpg"),
    'dinner_11.jpg': require("../../images/scenes/dinner/dinner_11.jpg")
  },
  eco: {
    'eco_0.jpg': require("../../images/scenes/eco/eco_0.jpg"),
    'eco_1.jpg': require("../../images/scenes/eco/eco_1.jpg"),
    'eco_2.jpg': require("../../images/scenes/eco/eco_2.jpg"),
    'eco_3.jpg': require("../../images/scenes/eco/eco_3.jpg"),
    'eco_4.jpg': require("../../images/scenes/eco/eco_4.jpg"),
    'eco_5.jpg': require("../../images/scenes/eco/eco_5.jpg"),
    'eco_6.jpg': require("../../images/scenes/eco/eco_6.jpg"),
    'eco_7.jpg': require("../../images/scenes/eco/eco_7.jpg")
  },
  gaming: {
    'gaming_1.jpg': require("../../images/scenes/gaming/gaming_1.jpg"),
    'gaming_2.jpg': require("../../images/scenes/gaming/gaming_2.jpg"),
    'gaming_3.jpg': require("../../images/scenes/gaming/gaming_3.jpg"),
    'gaming_4.jpg': require("../../images/scenes/gaming/gaming_4.jpg"),
    'gaming_5.jpg': require("../../images/scenes/gaming/gaming_5.jpg"),
    'gaming_6.png': require("../../images/scenes/gaming/gaming_6.png"),
    'gaming_7.png': require("../../images/scenes/gaming/gaming_7.png"),
    'gaming_8.jpg': require("../../images/scenes/gaming/gaming_8.jpg"),
    'gaming_9.jpg': require("../../images/scenes/gaming/gaming_9.jpg"),
    'gaming_10.png': require("../../images/scenes/gaming/gaming_10.png"),
    'gaming_11.jpg': require("../../images/scenes/gaming/gaming_11.jpg"),
    'gaming_12.png': require("../../images/scenes/gaming/gaming_12.png")
  },
  good_morning: {
    'good_morning_0.jpg': require("../../images/scenes/good_morning/good_morning_0.jpg"),
    'good_morning_1.jpg': require("../../images/scenes/good_morning/good_morning_1.jpg"),
    'good_morning_2.jpg': require("../../images/scenes/good_morning/good_morning_2.jpg"),
    'good_morning_3.jpg': require("../../images/scenes/good_morning/good_morning_3.jpg"),
    'good_morning_4.jpg': require("../../images/scenes/good_morning/good_morning_4.jpg"),
    'good_morning_5.jpg': require("../../images/scenes/good_morning/good_morning_5.jpg")
  },
  hobby_and_art: {
    'hobby_and_art_1.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_1.jpg"),
    'hobby_and_art_2.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_2.jpg"),
    'hobby_and_art_3.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_3.jpg"),
    'hobby_and_art_4.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_4.jpg"),
    'hobby_and_art_5.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_5.jpg"),
    'hobby_and_art_6.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_6.jpg"),
    'hobby_and_art_7.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_7.jpg"),
    'hobby_and_art_8.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_8.jpg"),
    'hobby_and_art_9.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_9.jpg"),
    'hobby_and_art_10.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_10.jpg"),
    'hobby_and_art_11.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_11.jpg"),
    'hobby_and_art_12.jpg': require("../../images/scenes/hobby_and_art/hobby_and_art_12.jpg"),
  },
  movie_time: {
    'movie_time_0.jpg': require("../../images/scenes/movie_time/movie_time_0.jpg"),
    'movie_time_1.jpg': require("../../images/scenes/movie_time/movie_time_1.jpg"),
    'movie_time_2.jpg': require("../../images/scenes/movie_time/movie_time_2.jpg"),
    'movie_time_3.jpg': require("../../images/scenes/movie_time/movie_time_3.jpg"),
    'movie_time_4.png': require("../../images/scenes/movie_time/movie_time_4.png"),
    'movie_time_5.jpg': require("../../images/scenes/movie_time/movie_time_5.jpg"),
    'movie_time_6.jpg': require("../../images/scenes/movie_time/movie_time_6.jpg"),
    'movie_time_7.jpg': require("../../images/scenes/movie_time/movie_time_7.jpg"),
    'movie_time_8.jpg': require("../../images/scenes/movie_time/movie_time_8.jpg"),
    'movie_time_9.jpg': require("../../images/scenes/movie_time/movie_time_9.jpg"),
    'movie_time_10.jpg': require("../../images/scenes/movie_time/movie_time_10.jpg")
  },
  music: {
    'music_0.jpg': require("../../images/scenes/music/music_0.jpg"),
    'music_1.jpg': require("../../images/scenes/music/music_1.jpg"),
    'music_2.jpg': require("../../images/scenes/music/music_2.jpg"),
    'music_3.jpg': require("../../images/scenes/music/music_3.jpg"),
    'music_4.jpg': require("../../images/scenes/music/music_4.jpg"),
    'music_5.jpg': require("../../images/scenes/music/music_5.jpg"),
    'music_6.jpg': require("../../images/scenes/music/music_6.jpg"),
    'music_7.jpg': require("../../images/scenes/music/music_7.jpg"),
    'music_8.jpg': require("../../images/scenes/music/music_8.jpg")
  },
  party: {
    'party_0.jpg': require("../../images/scenes/party/party_0.jpg"),
    'party_1.jpg': require("../../images/scenes/party/party_1.jpg"),
    'party_2.jpg': require("../../images/scenes/party/party_2.jpg"),
    'party_3.jpg': require("../../images/scenes/party/party_3.jpg"),
    'party_4.jpg': require("../../images/scenes/party/party_4.jpg"),
    'party_5.jpg': require("../../images/scenes/party/party_5.jpg"),
    'party_6.jpg': require("../../images/scenes/party/party_6.jpg"),
    'party_7.jpg': require("../../images/scenes/party/party_7.jpg"),
    'party_8.jpg': require("../../images/scenes/party/party_8.jpg"),
    'party_9.jpg': require("../../images/scenes/party/party_9.jpg")
  },
  relax: {
    'relax_0.jpg': require("../../images/scenes/relax/relax_0.jpg"),
    'relax_1.jpg': require("../../images/scenes/relax/relax_1.jpg"),
    'relax_2.jpg': require("../../images/scenes/relax/relax_2.jpg"),
    'relax_3.jpg': require("../../images/scenes/relax/relax_3.jpg"),
    'relax_4.jpg': require("../../images/scenes/relax/relax_4.jpg"),
    'relax_5.jpg': require("../../images/scenes/relax/relax_5.jpg"),
    'relax_6.jpg': require("../../images/scenes/relax/relax_6.jpg"),
    'relax_7.jpg': require("../../images/scenes/relax/relax_7.jpg"),
    'relax_8.jpg': require("../../images/scenes/relax/relax_8.jpg"),
    'relax_9.jpg': require("../../images/scenes/relax/relax_9.jpg"),
    'relax_10.jpg': require("../../images/scenes/relax/relax_10.jpg"),
  },
  romantic: {
    'romantic_1.jpg': require("../../images/scenes/romantic/romantic_1.jpg"),
    'romantic_2.jpg': require("../../images/scenes/romantic/romantic_2.jpg"),
    'romantic_3.jpg': require("../../images/scenes/romantic/romantic_3.jpg"),
    'romantic_4.jpg': require("../../images/scenes/romantic/romantic_4.jpg"),
    'romantic_5.jpg': require("../../images/scenes/romantic/romantic_5.jpg"),
    'romantic_6.jpg': require("../../images/scenes/romantic/romantic_6.jpg"),
    'romantic_7.jpg': require("../../images/scenes/romantic/romantic_7.jpg"),
    'romantic_8.jpg': require("../../images/scenes/romantic/romantic_8.jpg"),
    'romantic_9.jpg': require("../../images/scenes/romantic/romantic_9.jpg")
  },
  sports: {
    'sports_0.jpg': require("../../images/scenes/sports/sports_0.jpg"),
    'sports_1.jpg': require("../../images/scenes/sports/sports_1.jpg"),
    'sports_2.jpg': require("../../images/scenes/sports/sports_2.jpg"),
    'sports_3.jpg': require("../../images/scenes/sports/sports_3.jpg"),
    'sports_4.jpg': require("../../images/scenes/sports/sports_4.jpg"),
    'sports_5.jpg': require("../../images/scenes/sports/sports_5.jpg"),
    'sports_6.jpg': require("../../images/scenes/sports/sports_6.jpg"),
    'sports_7.jpg': require("../../images/scenes/sports/sports_7.jpg"),
    'sports_8.jpg': require("../../images/scenes/sports/sports_8.jpg")
  },
  study: {
    'study_1.jpg': require("../../images/scenes/study/study_1.jpg"),
    'study_2.jpg': require("../../images/scenes/study/study_2.jpg"),
    'study_3.jpg': require("../../images/scenes/study/study_3.jpg"),
    'study_4.jpg': require("../../images/scenes/study/study_4.jpg"),
    'study_5.jpg': require("../../images/scenes/study/study_5.jpg"),
    'study_6.jpg': require("../../images/scenes/study/study_6.jpg"),
    'study_7.jpg': require("../../images/scenes/study/study_7.jpg"),
    'study_8.jpg': require("../../images/scenes/study/study_8.jpg"),
    'study_9.jpg': require("../../images/scenes/study/study_9.jpg"),
    'study_10.jpg': require("../../images/scenes/study/study_10.jpg"),
  },
  weather: {
    'weather_0.jpg': require("../../images/scenes/weather/weather_0.jpg"),
    'weather_1.jpg': require("../../images/scenes/weather/weather_1.jpg"),
    'weather_2.jpg': require("../../images/scenes/weather/weather_2.jpg"),
    'weather_3.jpg': require("../../images/scenes/weather/weather_3.jpg"),
    'weather_4.jpg': require("../../images/scenes/weather/weather_4.jpg"),
    'weather_5.jpg': require("../../images/scenes/weather/weather_5.jpg"),
    'weather_6.jpg': require("../../images/scenes/weather/weather_6.jpg"),
    'weather_7.jpg': require("../../images/scenes/weather/weather_7.jpg"),
    'weather_8.jpg': require("../../images/scenes/weather/weather_8.jpg")
  }
}

const imageSize = screenWidth/11;

let types = [{ type: 'custom', name: 'custom', key: 'custom'}]
let pictureData = {};
export const SCENE_STOCK_PICTURE_LIST = {};
function prettify(name) {
  return xUtil.capitalize(name.replace(/_/g," "));
}
Object.keys(SCENE_IMAGE_SOURCE).forEach((cat) => {
  types.push({ type:cat, name: prettify(cat), key: cat})
  pictureData[cat] = [];
  Object.keys(SCENE_IMAGE_SOURCE[cat]).forEach((pic, index) => {
    SCENE_STOCK_PICTURE_LIST[pic] = SCENE_IMAGE_SOURCE[cat][pic];
    pictureData[cat].push({data:pic, key: cat+index})
  })
})

const typeStyle : TextStyle = {
  color: colors.white.hex,
  fontSize: 24,
  paddingLeft: 20,
  paddingBottom: 10,
}
const imageStyle = {height:3*imageSize, width:4*imageSize, marginLeft:15, borderRadius:10 };



export class ScenePictureGallery extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Pick_a_picture"), closeModal: true });
  }

  constructor(props) {
    super(props);
  }

  handleCustomImage = () => {
    const options : ImagePickerOptions = {
      title: lang("Select_Picture"),
      noData: true,
      mediaType: "photo",
      storageOptions: {
        waitUntilSaved: false,
        cameraRoll: false,
        privateDirectory:true,
        skipBackup: true,
      },
      allowsEditing: true,
      quality: 0.99
    };
    NavigationUtil.dismissModal();
    ImagePicker.showImagePicker(options, (response) => {
      // console.log('Response = ', response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        this.props.callback(response.uri, PICTURE_GALLERY_TYPES.CUSTOM);
      }
    });}

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
            iconPosition={ lang("right")}
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
        <Text style={typeStyle}>{item.name}</Text>
        <FlatList horizontal={true} data={pictureData[item.type]} removeClippedSubviews={true} initialNumToRender={4} renderItem={this.renderStockImages} showsHorizontalScrollIndicator={false} />
      </View>
    );
  }

  render() {
    return (
      <View style={{flex:1, backgroundColor: colors.black.hex}}>
        <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} />
        <FlatList
          data={types}
          removeClippedSubviews={true}
          initialNumToRender={6}
          renderItem={this.renderStockGroup}
        />
      </View>
    );
  }
}