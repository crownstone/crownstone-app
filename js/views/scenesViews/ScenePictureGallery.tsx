import { LiveComponent } from "../LiveComponent";
import React from "react";
import { FlatList, Image, Platform, Text, View, TextStyle, TouchableHighlight, TouchableOpacity } from "react-native";
import { colors, screenWidth, styles } from "../styles";
import { TopBarUtil } from "../../util/TopBarUtil";
import { NavigationUtil } from "../../util/NavigationUtil";
import ImagePicker from "react-native-image-picker";
import { xUtil } from "../../util/StandAloneUtil";

let source = {
  dinner: {
    'beauty-1841162_1920.jpg': require("../../images/Scenes/dinner/beauty-1841162_1920.jpg"),
    'buffet-315691.jpg': require("../../images/Scenes/dinner/buffet-315691.jpg"),
    'food-1050813_1280.jpg': require("../../images/Scenes/dinner/food-1050813_1280.jpg"),
    'food-1081707_1920.jpg': require("../../images/Scenes/dinner/food-1081707_1920.jpg"),
    'food-2068217_1920.jpg': require("../../images/Scenes/dinner/food-2068217_1920.jpg"),
    'food-4397860_1920.jpg': require("../../images/Scenes/dinner/food-4397860_1920.jpg"),
    'pizza-3007395_1920.jpg': require("../../images/Scenes/dinner/pizza-3007395_1920.jpg"),
    'soup-1429793_1920.jpg': require("../../images/Scenes/dinner/soup-1429793_1920.jpg"),
    'sushi-2853382_1920.jpg': require("../../images/Scenes/dinner/sushi-2853382_1920.jpg"),
    'white-791099_1920.jpg': require("../../images/Scenes/dinner/white-791099_1920.jpg"),
    'wine-2891894_1920.jpg': require("../../images/Scenes/dinner/wine-2891894_1920.jpg")
  },
  bedtime: {
    'annie-spratt-4Wlp6m8hroE-unsplash.jpg': require("../../images/Scenes/bedtime/annie-spratt-4Wlp6m8hroE-unsplash.jpg"),
    'beazy-toX2sYnycCw-unsplash.jpg': require("../../images/Scenes/bedtime/beazy-toX2sYnycCw-unsplash.jpg"),
    'danny-g-_Utk8ZYT4tI-unsplash.jpg': require("../../images/Scenes/bedtime/danny-g-_Utk8ZYT4tI-unsplash.jpg"),
    'sarah-dorweiler-06wMGv3GF8k-unsplash.jpg': require("../../images/Scenes/bedtime/sarah-dorweiler-06wMGv3GF8k-unsplash.jpg"),
    'teddy-bear-567952_1920.jpg': require("../../images/Scenes/bedtime/teddy-bear-567952_1920.jpg")
  },
  cooking: {
    'appliance-2257_1920.jpg': require("../../images/Scenes/cooking/appliance-2257_1920.jpg"),
    'cooking-1835369_1920.jpg': require("../../images/Scenes/cooking/cooking-1835369_1920.jpg"),
    'grilling-1081675_1920.jpg': require("../../images/Scenes/cooking/grilling-1081675_1920.jpg"),
    'kettle-2178442_1920.jpg': require("../../images/Scenes/cooking/kettle-2178442_1920.jpg"),
    'kitchen-3597348_1920.jpg': require("../../images/Scenes/cooking/kitchen-3597348_1920.jpg"),
    'kitchen-731351_1920.jpg': require("../../images/Scenes/cooking/kitchen-731351_1920.jpg"),
    'pasta-1181189_1920.jpg': require("../../images/Scenes/cooking/pasta-1181189_1920.jpg"),
    'shish-kebab-417994_1920.jpg': require("../../images/Scenes/cooking/shish-kebab-417994_1920.jpg"),
    'spaghetti-4456186_1920.jpg': require("../../images/Scenes/cooking/spaghetti-4456186_1920.jpg")
  },
  eco: {
    'noah-buscher-x8ZStukS2PM-unsplash.jpg': require("../../images/Scenes/eco/noah-buscher-x8ZStukS2PM-unsplash.jpg"),
    'simon-migaj-9D3swqmEFjk-unsplash.jpg': require("../../images/Scenes/eco/simon-migaj-9D3swqmEFjk-unsplash.jpg")
  },
  game_night: {
    'board-2097446_1920.jpg': require("../../images/Scenes/game_night/board-2097446_1920.jpg"),
    'cards-416960_1920.jpg': require("../../images/Scenes/game_night/cards-416960_1920.jpg"),
    'competition-3061509_1920.jpg': require("../../images/Scenes/game_night/competition-3061509_1920.jpg"),
    'game-3061506_1920.jpg': require("../../images/Scenes/game_night/game-3061506_1920.jpg"),
    'game-340574_1920.jpg': require("../../images/Scenes/game_night/game-340574_1920.jpg"),
    'monopoly-2636268_1920.jpg': require("../../images/Scenes/game_night/monopoly-2636268_1920.jpg"),
    'play-3978841_1920.jpg': require("../../images/Scenes/game_night/play-3978841_1920.jpg"),
    'playing-cards-1201257_1920.jpg': require("../../images/Scenes/game_night/playing-cards-1201257_1920.jpg"),
    'scrabble-15546_1920.jpg': require("../../images/Scenes/game_night/scrabble-15546_1920.jpg"),
    'un-2619589_1920.jpg': require("../../images/Scenes/game_night/un-2619589_1920.jpg")
  },
  gaming: {
    'aviv-rachmadian-vp6udpaQXkU-unsplash.jpg': require("../../images/Scenes/gaming/aviv-rachmadian-vp6udpaQXkU-unsplash.jpg"),
    'clem-onojeghuo-kfoSKoWc9Gg-unsplash.jpg': require("../../images/Scenes/gaming/clem-onojeghuo-kfoSKoWc9Gg-unsplash.jpg"),
    'fabian-albert-uwL_JvIhtLM-unsplash.jpg': require("../../images/Scenes/gaming/fabian-albert-uwL_JvIhtLM-unsplash.jpg"),
    'hello-i-m-nik-lWIM6FXIfnI-unsplash.jpg': require("../../images/Scenes/gaming/hello-i-m-nik-lWIM6FXIfnI-unsplash.jpg"),
    'joystick-1486907.png': require("../../images/Scenes/gaming/joystick-1486907.png"),
    'joystick-2389216.png': require("../../images/Scenes/gaming/joystick-2389216.png"),
    'lucas-ortiz-RMSLfydEKSI-unsplash.jpg': require("../../images/Scenes/gaming/lucas-ortiz-RMSLfydEKSI-unsplash.jpg"),
    'mike-meyers-v8XaVfyo41Q-unsplash.jpg': require("../../images/Scenes/gaming/mike-meyers-v8XaVfyo41Q-unsplash.jpg"),
    'nintendo-ds-3997772_1280.png': require("../../images/Scenes/gaming/nintendo-ds-3997772_1280.png"),
    'video-controller-336657_1920.jpg': require("../../images/Scenes/gaming/video-controller-336657_1920.jpg"),
    'vr-1911452.png': require("../../images/Scenes/gaming/vr-1911452.png"),
    'xbox-1602822_1920.jpg': require("../../images/Scenes/gaming/xbox-1602822_1920.jpg")
  },
  good_moring: {
    'alexander-possingham-RIQ96s3Uzso-unsplash.jpg': require("../../images/Scenes/good_moring/alexander-possingham-RIQ96s3Uzso-unsplash.jpg"),
    'bedroom-1006526_1920.jpg': require("../../images/Scenes/good_moring/bedroom-1006526_1920.jpg"),
    'coffee-1276778_1920.jpg': require("../../images/Scenes/good_moring/coffee-1276778_1920.jpg"),
    'coffee-171653_1920.jpg': require("../../images/Scenes/good_moring/coffee-171653_1920.jpg"),
    'ekaterina-kasimova-L57USwim61Y-unsplash.jpg': require("../../images/Scenes/good_moring/ekaterina-kasimova-L57USwim61Y-unsplash.jpg"),
    'jon-tyson-IXyQ2ySnKAI-unsplash.jpg': require("../../images/Scenes/good_moring/jon-tyson-IXyQ2ySnKAI-unsplash.jpg")
  },
  hobby_and_art: {
    'abstract-2468874_1920.jpg': require("../../images/Scenes/hobby_and_art/abstract-2468874_1920.jpg"),
    'brushes-3129361_1920.jpg': require("../../images/Scenes/hobby_and_art/brushes-3129361_1920.jpg"),
    'car-repair-362150_1920.jpg': require("../../images/Scenes/hobby_and_art/car-repair-362150_1920.jpg"),
    'garage-943249_1920.jpg': require("../../images/Scenes/hobby_and_art/garage-943249_1920.jpg"),
    'motorbike-407186_1920.jpg': require("../../images/Scenes/hobby_and_art/motorbike-407186_1920.jpg"),
    'paint-2940513_1920.jpg': require("../../images/Scenes/hobby_and_art/paint-2940513_1920.jpg"),
    'pencils-452238_1920.jpg': require("../../images/Scenes/hobby_and_art/pencils-452238_1920.jpg"),
    'sewing-3405975_1920.jpg': require("../../images/Scenes/hobby_and_art/sewing-3405975_1920.jpg"),
    'sharon-mccutcheon-TZZwC_xsClY-unsplash.jpg': require("../../images/Scenes/hobby_and_art/sharon-mccutcheon-TZZwC_xsClY-unsplash.jpg"),
    'tool-1957451_1920.jpg': require("../../images/Scenes/hobby_and_art/tool-1957451_1920.jpg"),
    'tools-1083796_1920.jpg': require("../../images/Scenes/hobby_and_art/tools-1083796_1920.jpg")
  },
  movie_time: {
    'admission-2974645_1920.jpg': require("../../images/Scenes/movie_time/admission-2974645_1920.jpg"),
    'camera-2008489.png': require("../../images/Scenes/movie_time/camera-2008489.png"),
    'cinema-4153289_1920.jpg': require("../../images/Scenes/movie_time/cinema-4153289_1920.jpg"),
    'cinema-4609877_1920.jpg': require("../../images/Scenes/movie_time/cinema-4609877_1920.jpg"),
    'coupon-1828620.png': require("../../images/Scenes/movie_time/coupon-1828620.png"),
    'movie-2545676_1920.jpg': require("../../images/Scenes/movie_time/movie-2545676_1920.jpg"),
    'netflix-2705725.jpg': require("../../images/Scenes/movie_time/netflix-2705725.jpg"),
    'netflix-4011345_1920.jpg': require("../../images/Scenes/movie_time/netflix-4011345_1920.jpg"),
    'popcorn-3794096_1920.jpg': require("../../images/Scenes/movie_time/popcorn-3794096_1920.jpg"),
    'popcorn-4885565_1920.jpg': require("../../images/Scenes/movie_time/popcorn-4885565_1920.jpg")
  },
  music: {
    'amplifier-768536_1920.jpg': require("../../images/Scenes/music/amplifier-768536_1920.jpg"),
    'girl-1990347_1920.jpg': require("../../images/Scenes/music/girl-1990347_1920.jpg"),
    'headphones-690685_1920.jpg': require("../../images/Scenes/music/headphones-690685_1920.jpg"),
    'music-1283851_1920.jpg': require("../../images/Scenes/music/music-1283851_1920.jpg"),
    'piano-1239729.jpg': require("../../images/Scenes/music/piano-1239729.jpg"),
    'piano-690381_1920.jpg': require("../../images/Scenes/music/piano-690381_1920.jpg"),
    'radio-2588503_1920.jpg': require("../../images/Scenes/music/radio-2588503_1920.jpg"),
    'speaker-691002_1920.jpg': require("../../images/Scenes/music/speaker-691002_1920.jpg"),
    'vinyl-2241789.png': require("../../images/Scenes/music/vinyl-2241789.png"),
    'volume-949240_1920.jpg': require("../../images/Scenes/music/volume-949240_1920.jpg")
  },
  party: {
    'audience-1850119_1920.jpg': require("../../images/Scenes/party/audience-1850119_1920.jpg"),
    'balloons-1869790_1920.jpg': require("../../images/Scenes/party/balloons-1869790_1920.jpg"),
    'birthday-cake-380178_1920.jpg': require("../../images/Scenes/party/birthday-cake-380178_1920.jpg"),
    'champagner-1071356_1920.jpg': require("../../images/Scenes/party/champagner-1071356_1920.jpg"),
    'concert-2527495.jpg': require("../../images/Scenes/party/concert-2527495.jpg"),
    'concert-768722_1920.jpg': require("../../images/Scenes/party/concert-768722_1920.jpg"),
    'drinks-2578446_1920.jpg': require("../../images/Scenes/party/drinks-2578446_1920.jpg"),
    'pinata-1937444_1920.jpg': require("../../images/Scenes/party/pinata-1937444_1920.jpg"),
    'pool-3382836_1920.jpg': require("../../images/Scenes/party/pool-3382836_1920.jpg"),
    'streamer-3088458_1920.jpg': require("../../images/Scenes/party/streamer-3088458_1920.jpg")
  },
  relax: {
    'adult-2178466_1920.jpg': require("../../images/Scenes/relax/adult-2178466_1920.jpg"),
    'alisa-anton-u_z0X-yrJIE-unsplash.jpg': require("../../images/Scenes/relax/alisa-anton-u_z0X-yrJIE-unsplash.jpg"),
    'cat-4189697_1920.jpg': require("../../images/Scenes/relax/cat-4189697_1920.jpg"),
    'max-van-den-oetelaar-buymYm3RQ3U-unsplash.jpg': require("../../images/Scenes/relax/max-van-den-oetelaar-buymYm3RQ3U-unsplash.jpg"),
    'relaxing-1979674_1920.jpg': require("../../images/Scenes/relax/relaxing-1979674_1920.jpg"),
    'tea-381235_1920.jpg': require("../../images/Scenes/relax/tea-381235_1920.jpg"),
    'tea-time-3240766_1920.jpg': require("../../images/Scenes/relax/tea-time-3240766_1920.jpg"),
    'teacup-2325722_1920.jpg': require("../../images/Scenes/relax/teacup-2325722_1920.jpg"),
    'tori-1976609_1920.jpg': require("../../images/Scenes/relax/tori-1976609_1920.jpg")
  },
  romantic: {
    'background-2062206_1920.jpg': require("../../images/Scenes/romantic/background-2062206_1920.jpg"),
    'bedroom-665811_1920.jpg': require("../../images/Scenes/romantic/bedroom-665811_1920.jpg"),
    'couple-731890_1920.jpg': require("../../images/Scenes/romantic/couple-731890_1920.jpg"),
    'flower-3585489_1920.jpg': require("../../images/Scenes/romantic/flower-3585489_1920.jpg"),
    'freestocks-Y9mWkERHYCU-unsplash.jpg': require("../../images/Scenes/romantic/freestocks-Y9mWkERHYCU-unsplash.jpg"),
    'heart-700141_1920.jpg': require("../../images/Scenes/romantic/heart-700141_1920.jpg"),
    'love-3388622_1920.jpg': require("../../images/Scenes/romantic/love-3388622_1920.jpg"),
    'rose-3407234_1920.jpg': require("../../images/Scenes/romantic/rose-3407234_1920.jpg"),
    'rose-374318_1920.jpg': require("../../images/Scenes/romantic/rose-374318_1920.jpg"),
    'rose-petals-3194062_1920.jpg': require("../../images/Scenes/romantic/rose-petals-3194062_1920.jpg"),
    'zack-marshall-QFc2kxpXVYQ-unsplash.jpg': require("../../images/Scenes/romantic/zack-marshall-QFc2kxpXVYQ-unsplash.jpg")
  },
  sports: {
    'dane-wetton-t1NEMSm1rgI-unsplash.jpg': require("../../images/Scenes/sports/dane-wetton-t1NEMSm1rgI-unsplash.jpg"),
    'jared-rice-NTyBbu66_SI-unsplash.jpg': require("../../images/Scenes/sports/jared-rice-NTyBbu66_SI-unsplash.jpg"),
    'kelly-sikkema-IZOAOjvwhaM-unsplash.jpg': require("../../images/Scenes/sports/kelly-sikkema-IZOAOjvwhaM-unsplash.jpg"),
    'kelly-sikkema-rWBBDErPXcY-unsplash.jpg': require("../../images/Scenes/sports/kelly-sikkema-rWBBDErPXcY-unsplash.jpg"),
    'mateo-vrbnjak-bq53S9hEYx4-unsplash.jpg': require("../../images/Scenes/sports/mateo-vrbnjak-bq53S9hEYx4-unsplash.jpg"),
    'pedro-araujo-VMsjpnB21hQ-unsplash.jpg': require("../../images/Scenes/sports/pedro-araujo-VMsjpnB21hQ-unsplash.jpg"),
    'weight-860625_1920.jpg': require("../../images/Scenes/sports/weight-860625_1920.jpg"),
    'yoga-1146277_1920.jpg': require("../../images/Scenes/sports/yoga-1146277_1920.jpg"),
    'yoga-2959213_1920.jpg': require("../../images/Scenes/sports/yoga-2959213_1920.jpg")
  },
  study: {
    'antique-1870000_1920.jpg': require("../../images/Scenes/study/antique-1870000_1920.jpg"),
    'book-1149031_1920.jpg': require("../../images/Scenes/study/book-1149031_1920.jpg"),
    'books-690219_1920.jpg': require("../../images/Scenes/study/books-690219_1920.jpg"),
    'green-chameleon-s9CC2SKySJM-unsplash.jpg': require("../../images/Scenes/study/green-chameleon-s9CC2SKySJM-unsplash.jpg"),
    'laptop-3087585_1920.jpg': require("../../images/Scenes/study/laptop-3087585_1920.jpg"),
    'library-869061_1920.jpg': require("../../images/Scenes/study/library-869061_1920.jpg"),
    'marvin-meyer-SYTO3xs06fU-unsplash.jpg': require("../../images/Scenes/study/marvin-meyer-SYTO3xs06fU-unsplash.jpg"),
    'notebook-1850613_1920.jpg': require("../../images/Scenes/study/notebook-1850613_1920.jpg"),
    'notepad-3297994_1920.jpg': require("../../images/Scenes/study/notepad-3297994_1920.jpg"),
    'write-593333_1920.jpg': require("../../images/Scenes/study/write-593333_1920.jpg"),
    'writing-1149962_1920.jpg': require("../../images/Scenes/study/writing-1149962_1920.jpg")
  },
  weather: {
    'clouds-1768967_1920.jpg': require("../../images/Scenes/weather/clouds-1768967_1920.jpg"),
    'lake-696098_1920.jpg': require("../../images/Scenes/weather/lake-696098_1920.jpg"),
    'lights-1283073_1920.jpg': require("../../images/Scenes/weather/lights-1283073_1920.jpg"),
    'rain-455124_1920.jpg': require("../../images/Scenes/weather/rain-455124_1920.jpg"),
    'rain-84648_1920.jpg': require("../../images/Scenes/weather/rain-84648_1920.jpg"),
    'soap-bubble-1958841_1920.jpg': require("../../images/Scenes/weather/soap-bubble-1958841_1920.jpg"),
    'street-1209401_1920.jpg': require("../../images/Scenes/weather/street-1209401_1920.jpg"),
    'water-815271_1920.jpg': require("../../images/Scenes/weather/water-815271_1920.jpg"),
    'waves-1867285_1920.jpg': require("../../images/Scenes/weather/waves-1867285_1920.jpg"),
  }
}




const imageSize = screenWidth/11;

let types = [];
let pictures = {};
let pictureList = {};
function prettify(name) {
  return xUtil.capitalize(name.replace(/_/g," "));
}
Object.keys(source).forEach((cat) => {
  types.push({ type:cat, name: prettify(cat), key: cat})
  pictureList[cat] = [];
  Object.keys(source[cat]).forEach((pic, index) => {
    pictures[pic] = source[cat][pic];
    pictureList[cat].push({data:pic, key: cat+index})
  })
})

let typeStyle : TextStyle = {
  color: colors.white.hex,
  fontSize: 24,
  paddingLeft: 20,
  paddingBottom: 10,
}

let sx = {...styles.centered, padding:20, backgroundColor: colors.menuTextSelected.hex, borderRadius: 10, marginHorizontal: 15}

let imageStyle = {height:3*imageSize, width:4*imageSize, marginLeft:15, borderRadius:10 };

let cb= () => { NavigationUtil.dismissModal() }

let cam = () => {
  const options = {
    title: 'Select Picture',
  };

  ImagePicker.showImagePicker(options, (response) => {
  console.log('Response = ', response);

  if (response.didCancel) {
    console.log('User cancelled image picker');
  } else if (response.error) {
    console.log('ImagePicker Error: ', response.error);
  } else {
    this.props.callback(response.uri)
    // You can also display the image using data:
    // const source = { uri: 'data:image/jpeg;base64,' + response.data };

  }
});}


export class ScenePictureGallery extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Pick a picture", closeModal: true });
  }

  pictures = {}

  constructor(props) {
    super(props);


  }


  renderStockImages = ({item, index, separators}) => {
    return (
      <TouchableHighlight
        key={item.key}
        onPress={cb}
      >
        <Image style={imageStyle} source={pictures[item.data]} />
      </TouchableHighlight>
    )
  }

  renderStockGroup = ({item, index, separators}) => {
    if (index == 0) {
      return (
        <View style={{marginTop: 30,}}>
          <Text style={typeStyle}>{"Custom picture"}</Text>
          <TouchableHighlight onPress={() => { cam() }} style={sx}>
            <Text style={{fontSize:16, color: colors.white.hex, fontWeight: 'bold'}}>Take or select picture...</Text>
          </TouchableHighlight>
        </View>

      )
    }

    return (
      <View style={{marginTop: 30}}>
        <Text style={typeStyle}>{item.name}</Text>
        <FlatList horizontal={true} data={pictureList[item.type]} removeClippedSubviews={true} initialNumToRender={4} renderItem={this.renderStockImages} showsHorizontalScrollIndicator={false} />
      </View>
    )
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