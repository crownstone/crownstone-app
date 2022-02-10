
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Interview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component, useState } from "react";
import {
  Platform, Keyboard,
  ScrollView, Text, TextStyle,
  View
} from "react-native";
import { availableModalHeight, colors, screenWidth, styles } from "../styles";
import Carousel from 'react-native-snap-carousel';
import {
  InterviewTextInput, LargeTextButtonWithLargeImage,
  TextButtonLight, TextButtonWithLargeImage, ThemedTextButtonWithIcon
} from "../components/InterviewComponents";
import { ScaledImage } from "./ScaledImage";
import { SlideFadeInView } from "./animated/SlideFadeInView";
import {BackButtonHandler} from "../../backgroundProcesses/BackButtonHandler";

let headerStyle : TextStyle = {
  paddingLeft: 15,
  paddingRight: 15,
  marginTop: 20,
  fontSize: 26,
  fontWeight: "bold",
  color: colors.csBlueDark.hex
};

let subHeaderStyle : TextStyle = {
  padding: 15,
  marginTop: 20,
  fontSize: 21,
  fontWeight: "bold",
  color: colors.csBlueDark.hex
};

let explanationStyle : TextStyle = {
  paddingBottom: 15,
  paddingLeft: 15,
  paddingRight: 15,
  fontSize: 16,
  fontWeight: "bold",
  color: colors.csBlueDark.hex
};

export class Interview extends Component<{
  getCards() : interviewCards,
  backButtonName?: string,
  height? : number,
  scrollEnabled? : boolean,
  update?() : void,
}, any> {

  _carousel;
  responseHeaders : any;
  selectedOptions = [];
  _lockedCard = false;

  activeBackground = null;
  activeTextColor  = null;
  activeCardIndex  = null;
  transitioningToCardId  = null;
  constructor(props) {
    super(props);

    let cards = this.props.getCards();
    if (cards && cards.start) {
      this.state = {
        cardIds: ['start'],
      };
    }
    else {
      this.state = {invalid:true}
    }

    this.activeCardIndex = 0;
    this.transitioningToCardId = null;

    this.selectedOptions = [];
    this.responseHeaders = {};
  }


  componentDidMount() {
    if (this.props.backButtonName) {
      BackButtonHandler.override(this.props.backButtonName, () => {
        return this.back();
      });
    }
  }

  componentWillUnmount() {
    if (this.props.backButtonName) {
      BackButtonHandler.clearOverride(this.props.backButtonName)
    }
  }

  isActiveCard(cardId) {
    if (this.transitioningToCardId !== null && this.transitioningToCardId !== cardId) {
      return false;
    }

    return this.state.cardIds[this.activeCardIndex] === cardId ;
  }


  resetStackToCard(cardId) {
    if (!cardId) { return; }
    this._lockedCard = false;

    let currentIds = [cardId];

    this.transitioningToCardId = cardId;

    this.setState({ cardIds: currentIds }, () => {
      this.checkStyleUpdates();
      setTimeout(() => { this._carousel.snapToItem(currentIds.length - 1); }, 10);
    })
  }


  back() {
    if (this.activeCardIndex !== 0) {
      this._carousel.snapToItem(this.activeCardIndex- 1);
    }
    else {
      return false
    }
  }

  setLockedCard(cardId) {
    if (!cardId) { return; }
    this._lockedCard = true;

    let currentIds = this.state.cardIds;
    currentIds.splice(this.activeCardIndex + 1);
    currentIds.push(cardId);
    this.transitioningToCardId = cardId;
    this.setState({ cardIds: currentIds }, () => {
      this.checkStyleUpdates();
      setTimeout(() => { this._carousel.snapToItem(currentIds.length - 1); }, 10);
    });
  }

  renderCard({item, index}) {
    return (
      <InterviewCard
        nextCard={(cardId, value, selectedIndex, option) => {
          if (!cardId) { return; }

          let currentIds = this.state.cardIds;
          currentIds.splice(this.activeCardIndex + 1);

          if (this.selectedOptions.length <= this.activeCardIndex) {
            this.selectedOptions.push(selectedIndex)
          }
          else {
            this.selectedOptions[this.activeCardIndex] = selectedIndex;
          }
          this.responseHeaders[cardId] = option.dynamicResponse && option.dynamicResponse(value) || option.response;

          currentIds.push(cardId);

          this.transitioningToCardId = cardId;

          this.setState({ cardIds: currentIds }, () => {
            this.checkStyleUpdates();
            setTimeout(() => { this._carousel.snapToItem(currentIds.length - 1, true); }, 10);
          })
        }}
        card={item}
        height={this.props.height}
        headerOverride={this.responseHeaders[this.state.cardIds[index]]}
        selectedOption={this.selectedOptions[index]}
      />
    )
  }

  getBackgroundFromCard() {
    let cards = this.props.getCards();
    let activeCard = cards[this.state.cardIds[this.activeCardIndex]];
    let backgroundImage = null;
    if (this.transitioningToCardId !== null) {
      backgroundImage = cards[this.transitioningToCardId].backgroundImage;
    }
    else if (activeCard.backgroundImage !== undefined) {
      backgroundImage = activeCard.backgroundImage;
    }

    return backgroundImage;
  }

  getTextColorFromCard() {
    let cards = this.props.getCards();
    if (this.state.cardIds[this.activeCardIndex] && cards[this.state.cardIds[this.activeCardIndex]]) {
      let activeCard = cards[this.state.cardIds[this.activeCardIndex]];
      return activeCard.textColor || null;
    }
    return null;
  }

  checkStyleUpdates() {
    if (!this.props.update) { return; }

    let shouldUpdate = false;
    let newBackground = this.getBackgroundFromCard();
    if (this.activeBackground !== newBackground) {
      this.activeBackground = newBackground;
      shouldUpdate = true;
    }

    let newTextColor = this.getTextColorFromCard();
    if (this.activeTextColor !== newTextColor) {
      this.activeTextColor = newTextColor;
      shouldUpdate = true;
    }
    if (shouldUpdate) {
      this.props.update();
    }
  }

  render() {
    if (this.state.invalid === true) {
      return <View><Text>{ lang("Something_went_wrong__Plea") }</Text></View>
    }

    let allCards = this.props.getCards();
    let cards = [];
    this.state.cardIds.forEach((cardId) => {
      cards.push(allCards[cardId]);
    });

    return (
      <Carousel
        scrollEnabled={this.props.scrollEnabled}
        ref={(c) => {
          this._carousel = c;
        }}
        removeClippedSubviews={Platform.OS === 'android' ? false : undefined /* THIS IS REQUIRED IF WE HAVE THIS ELEMENT ON A MODAL OR THE FIRST SLIDE WONT RENDER */}
        data={cards}
        renderItem={this.renderCard.bind(this)}
        itemHeight={this.props.height || availableModalHeight}
        sliderWidth={screenWidth}
        itemWidth={screenWidth}
        onBeforeSnapToItem={(indexToBe) => {
          if (indexToBe < this.activeCardIndex) {
            this.transitioningToCardId = this.state.cardIds[indexToBe];
            this.checkStyleUpdates();
            Keyboard.dismiss();
          }
        }}
        onSnapToItem={(index) => {
          this.transitioningToCardId = null;
          this.activeCardIndex = index;
          this.checkStyleUpdates();

          let allCards = this.props.getCards();
          let cards = [];
          this.state.cardIds.forEach((cardId) => {
            cards.push(allCards[cardId]);
          });

          let activeCard = cards[this.activeCardIndex];

          if (this._lockedCard || activeCard.locked === true) {
            // we first go to index 0, then reset the stack with only the locked card. Once that is done, we set the appropriate pointers.
            this._carousel.snapToItem(0, false, false)
            this.setState({ cardIds: [this.state.cardIds[this.activeCardIndex]]}, () => {
              this.activeCardIndex = 0;
              this.transitioningToCardId = null;
            });
          }
        }}
      />
    );
  }
}

function InterviewCard(props : {
  card: interviewCard,
  headerOverride?: string,
  height?: number,
  image?: any,
  selectedOption?: number,
  nextCard: (nextCard:string, value: interviewReturnData, index:number, option: interviewOption) => void
}) {
  let [ editableInputState, setEditableInputState ] = useState("");
  let [ textInput, setTextInput ] = useState("");

  let header = props.headerOverride || props.card.header;
  let subHeader = props.card.subHeader;
  let explanation = props.card.explanation;
  let options = props.card.options;

  let flexBeforeOptions = false;
  if (props.card.backgroundImage !== undefined || props.card.optionsBottom || props.card.optionsCenter || props.card.hasTextInputField || props.card.editableItem) {
    flexBeforeOptions = true;
  }

  let result : interviewReturnData = {
    customElementState: editableInputState,
    textfieldState: textInput
  };

  let changingAlwaysOnTop = props.card.optionsAlwaysOnTop !== undefined;

  let overrideTextColor = props.card.textColor ? {color: props.card.textColor} : {};
  let card = props.card;
  return (
    <View testID={card.testID}>
      <ScrollView style={{height: props.height || availableModalHeight}}>
        <View style={{minHeight: props.height || availableModalHeight - 10, paddingBottom: 10}}>
          { header      && <Text style={{...headerStyle, ...overrideTextColor}} numberOfLines={card.headerMaxNumLines || 2} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text> }
          { subHeader   && <Text style={[subHeaderStyle,   overrideTextColor]}>{subHeader}</Text>   }
          { explanation && <Text style={[explanationStyle, overrideTextColor]}>{explanation}</Text> }
          {
            card.hasTextInputField ?
              <InterviewTextInput placeholder={card.placeholder} value={textInput} callback={(text) => { setTextInput(text); }} /> :
              undefined
          }
          { card.editableItem ?
              <View style={{...styles.centered, flex:1, width: screenWidth}}>{card.editableItem(editableInputState, setEditableInputState)}</View> :
              undefined}
          {
            card.image ?
              <View style={{...styles.centered, flex:1, width: screenWidth}}>
                <ScaledImage source={card.image.source} sourceWidth={card.image.sourceWidth} sourceHeight={card.image.sourceHeight} targetWidth={card.image.width} targetHeight={card.image.height} tintColor={card.image.tintColor}/>
              </View> :
              undefined
          }
          {
            card.component ?
              <View style={{ flex: 1 }}/> :
              undefined
          }
          {
            card.component ?
              card.component :
              undefined
          }
          {
            card.component ?
              <View style={{flex:1}} /> :
              undefined
          }
          {
            flexBeforeOptions ?
              <View style={{flex:1}} /> :
              undefined
          }
          { card.optionsExplanation ? <Text style={[explanationStyle, overrideTextColor]}>{card.optionsExplanation}</Text> : undefined }
          { !card.optionsAlwaysOnTop && card.optionsHiddenIfNotOnTop !== true ?
            <InterviewOptions options={options} nextCard={props.nextCard || null} selectedOption={props.selectedOption} value={result} /> : <InterviewOptionsSpacer options={options} />}
          {
            card.optionsCenter && !card.optionsAlwaysOnTop ?
              <View style={{flex:1}} /> :
              undefined
          }
        </View>
      </ScrollView>
      {
        changingAlwaysOnTop &&
        <SlideFadeInView visible={card.optionsAlwaysOnTop} height={100} style={{ position: 'absolute', bottom: 0, width: screenWidth, overflow:"hidden", paddingTop:10}}>
          <View style={{shadowColor: colors.black.hex, shadowOpacity:0.9, shadowRadius: 5, shadowOffset:{width:0, height:2} }}>
            <InterviewOptions options={options} nextCard={props.nextCard || null} selectedOption={props.selectedOption} value={result}/>
          </View>
          <View style={{height:10}} />
        </SlideFadeInView>
      }
    </View>
  )
}

function InterviewOptions(props : {options : interviewOption[], value: interviewReturnData, nextCard: (nextCard:string, value: interviewReturnData, index:number, option: interviewOption) => void, selectedOption: number}) {
  let options = [];
  props.options.forEach((option, index) => {
    let cb = () => {
      if (option.onSelect) {
        let resumeAllowed : onSelectResult  = option.onSelect(props.value);
        if (typeof resumeAllowed === 'object' && resumeAllowed['then'] !== undefined) {
          return resumeAllowed.then((result) => {
            if (typeof result === 'string') {
              props.nextCard(result, props.value, index, option);
            }
            else if (result !== false) {
              props.nextCard(option.nextCard, props.value, index, option);
            }
          })
        }
        else if (resumeAllowed === true || resumeAllowed === undefined) {
          props.nextCard(option.nextCard, props.value, index, option);
        }
        else if (typeof resumeAllowed === 'string') {
          props.nextCard(resumeAllowed, props.value, index, option);
        }
      }
      else {
        props.nextCard(option.nextCard, props.value, index, option);
      }
    };

    if (option.image && option.subLabel) {
      options.push(
        <LargeTextButtonWithLargeImage
          key={"option_" + index}
          selected={props.selectedOption === index}
          image={option.image}
          label={option.label}
          subLabel={option.subLabel}
          textAlign={option.textAlign}
          testID={option.testID}
          callback={cb}
        />
      );
    }
    else if (option.image) {
      options.push(
        <TextButtonWithLargeImage
          key={"option_" + index}
          selected={props.selectedOption === index}
          image={option.image}
          label={option.label}
          textAlign={option.textAlign}
          testID={option.testID}
          callback={cb}
        />
      );
    }
    else if (option.icon) {
      options.push(
        <ThemedTextButtonWithIcon
          key={"option_" + index}
          icon={option.icon}
          selected={props.selectedOption === index}
          label={option.label}
          textAlign={option.textAlign}
          testID={option.testID}
          callback={cb}
          theme={option.theme || "default"}
        />
      );
    }
    else {
      options.push(
        <TextButtonLight
          key={"option_" + index}
          selected={props.selectedOption === index}
          label={option.label}
          danger={option.dangerous}
          textAlign={option.textAlign}
          testID={option.testID}
          callback={cb}
        />
      );
    }
  });
  return (
    <View>{options}</View>
  )
}

function InterviewOptionsSpacer(props : {options : interviewOption[]}) {
  // TODO: make generic on type of options.
  return <View style={{height: 62}} />;
}
