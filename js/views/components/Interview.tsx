import * as React from 'react'; import { Component, useState } from "react";
import {
  ScrollView, Text, TextStyle,
  View} from "react-native";
import { availableModalHeight, colors, screenHeight, screenWidth, styles } from "../styles";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { FadeIn } from "../components/animated/FadeInView";
import {
  InterviewTextInput,
  TextButtonLight, TextButtonWithLargeImage, ThemedTextButtonWithIcon
} from "../components/InterviewComponents";

let headerStyle : TextStyle = {
  paddingLeft: 15,
  paddingRight: 15,
  marginTop: 20,
  fontSize: 28,
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
  height? : number
  update?() : void
}, any> {

  interviewState;
  interviewData;

  _carousel;
  responseHeaders : any;
  selectedOptions = [];
  _lockedCard = false;

  activeBackground = null;
  activeTextColor  = null;
  constructor(props) {
    super(props);

    let cards = this.props.getCards();
    if (cards && cards.start) {
      this.state = {
        activeCardIndex: 0,
        cardIds: ['start'],
        transitioningToCardId: undefined
      };
    }
    else {
      this.state = {invalid:true}
    }

    this.selectedOptions = [];
    this.responseHeaders = {};
  }

  resetStackToCard(cardId) {
    if (!cardId) { return; }
    this._lockedCard = false;

    let currentIds = [cardId];

    this.setState({ cardIds: currentIds, transitioningToCardId: cardId }, () => {
      this.checkStyleUpdates();
      setTimeout(() => { this._carousel.snapToItem(currentIds.length - 1); }, 0);
    })
  }


  setLockedCard(cardId) {
    if (!cardId) { return; }
    this._lockedCard = true;

    let currentIds = this.state.cardIds;
    currentIds.splice(this.state.activeCardIndex + 1);

    currentIds.push(cardId);

    this.setState({ cardIds: currentIds, transitioningToCardId: cardId }, () => {
      this.checkStyleUpdates();
      setTimeout(() => { this._carousel.snapToItem(currentIds.length - 1); }, 0);
    })
  }

  renderCard({item, index}) {
    return (
      <InterviewCard
        nextCard={(cardId, value, selectedIndex, option) => {
          if (!cardId) { return; }

          let currentIds = this.state.cardIds;
          currentIds.splice(this.state.activeCardIndex + 1);

          if (this.selectedOptions.length <= this.state.activeCardIndex) {
            this.selectedOptions.push(selectedIndex)
          }
          else {
            this.selectedOptions[this.state.activeCardIndex] = selectedIndex;
          }
          this.responseHeaders[cardId] = option.dynamicResponse && option.dynamicResponse(value) || option.response;

          currentIds.push(cardId);



          this.setState({ cardIds: currentIds, transitioningToCardId: cardId }, () => {
            this.checkStyleUpdates();
            setTimeout(() => { this._carousel.snapToItem(currentIds.length - 1); }, 0);
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
    let activeCard = cards[this.state.cardIds[this.state.activeCardIndex]];
    let backgroundImage = null;
    if (this.state.transitioningToCardId !== undefined) {
      backgroundImage = cards[this.state.transitioningToCardId].backgroundImage;
    }
    else if (activeCard.backgroundImage !== undefined) {
      backgroundImage = activeCard.backgroundImage;
    }

    return backgroundImage;
  }

  getTextColorFromCard() {
    let cards = this.props.getCards();
    let activeCard = cards[this.state.cardIds[this.state.activeCardIndex]];

    return activeCard.textColor || null;
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
      return <View><Text>Something went wrong. Please retry.</Text></View>
    }

    let allCards = this.props.getCards();
    let cards = [];
    this.state.cardIds.forEach((cardId) => {
      cards.push(allCards[cardId]);
    });

    return (
      <Carousel
        ref={(c) => {
          this._carousel = c;
        }}
        removeClippedSubviews={false /* THIS IS REQUIRED IF WE HAVE THIS ELEMENT ON A MODAL OR THE FIRST SLIDE WONT RENDER */}
        data={cards}
        renderItem={this.renderCard.bind(this)}
        itemHeight={this.props.height || screenHeight}
        sliderWidth={screenWidth}
        itemWidth={screenWidth}
        onSnapToItem={(index) => { this.setState({ activeCardIndex: index, transitioningToCardId: undefined }, () => {
          this.checkStyleUpdates();


          let allCards = this.props.getCards();
          let cards = [];
          this.state.cardIds.forEach((cardId) => {
            cards.push(allCards[cardId]);
          });

          let activeCard = cards[this.state.activeCardIndex];

          if (this._lockedCard || activeCard.locked === true) {
            this.setState({cardIds: [this.state.cardIds[this.state.activeCardIndex]], activeCardIndex: 0});
          }
        })}}
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

  return (
    <ScrollView style={{height: props.height || availableModalHeight}}>
      <View style={{minHeight: props.height || availableModalHeight - 10, paddingBottom: 10}}>
        { header      ? <Text style={[headerStyle, {color: props.card.textColor}]}>{header}</Text>           : undefined }
        { subHeader   ? <Text style={[subHeaderStyle, {color: props.card.textColor}]}>{subHeader}</Text>     : undefined }
        { explanation ? <Text style={[explanationStyle, {color: props.card.textColor}]}>{explanation}</Text> : undefined }
        {
          props.card.hasTextInputField ?
            <InterviewTextInput placeholder={props.card.placeholder} value={textInput} callback={(text) => { setTextInput(text); }} /> :
            undefined
        }
        { props.card.editableItem ?
            <View style={{...styles.centered, flex:1, width: screenWidth}}>{props.card.editableItem(editableInputState, setEditableInputState)}</View> :
            undefined}
        {
          props.card.image ?
            <FadeIn>{props.card.image}</FadeIn> :
            undefined
        }
        {
          props.card.component ?
            <View style={{ flex: 1 }}/> :
            undefined
        }
        {
          props.card.component ?
            props.card.component :
            undefined
        }
        {
          props.card.component ?
            <View style={{flex:1}} /> :
            undefined
        }
        {
          flexBeforeOptions ?
            <View style={{flex:1}} /> :
            undefined
        }
        <InterviewOptions options={options} nextCard={props.nextCard || null} selectedOption={props.selectedOption} value={result} />
        {
          props.card.optionsCenter ?
            <View style={{flex:1}} /> :
            undefined
        }
      </View>
    </ScrollView>
  )
}

function InterviewOptions(props : {options : interviewOption[], value: interviewReturnData, nextCard: (nextCard:string, value: interviewReturnData, index:number, option: interviewOption) => void, selectedOption: number}) {
  let options = [];
  props.options.forEach((option, index) => {
    let cb = () => {
      let resume = true;
      if (option.onSelect) {
        let resumeAllowed = option.onSelect(props.value);
        if (resumeAllowed === false) {
          resume = false;
        }
        else if (typeof resumeAllowed === 'string') {
          props.nextCard(resumeAllowed, props.value, index, option);
          return;
        }
      }

      if (resume) {
        props.nextCard(option.nextCard, props.value, index, option);
      }
    };

    if (option.image) {
      options.push(
        <TextButtonWithLargeImage
          key={"option_" + index}
          selected={props.selectedOption === index}
          image={option.image}
          label={option.label}
          textAlign={option.textAlign}
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
          textAlign={option.textAlign}
          callback={cb}
        />
      );
    }
  });
  return (
    <View>{options}</View>
  )
}
