import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Text, TextStyle,
  View, ViewStyle
} from "react-native";
import { core } from "../core";
import { Background } from "../views/components/Background";
import { colors, OrangeLine, screenWidth } from "../views/styles";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { FadeIn, FadeInView } from "../views/components/animated/FadeInView";
import { TextButtonDark, TextButtonSemitranslucentDark } from "../views/components/InterviewComponents";
import { AicoreUtil } from "../views/deviceViews/elements/smartBehaviour/supportCode/AicoreUtil";




let questionStyle : TextStyle = {
  padding: 15,
  marginTop: 20,
  fontSize: 21,
  fontWeight: "bold",
  color: colors.csBlue.hex
};

export class InterviewLight extends Component<any, any> {
  interviewState
  interviewData

  _carousel
  constructor(props) {
    super(props);

    this.interviewData = {
      presence: null,
      time: null,
      timeDetails: {},
      option: null,
      switchCraft: false,
      dimming: false,
      always: false,
      locked: false,
    };

    this.state = { activeSlide : 0, slides: [this.getCards().introduction], finished: false }
  }

  getCards() {
    let timeString = "";
    if (this.interviewData.timeDetails && this.interviewData.timeDetails.to) {
      timeString = AicoreUtil.getTimeStr(this.interviewData.timeDetails.to);
    }

    return {
      introduction: {
        question:"When would you like me to be on?",
          answers: [
          {label: "When someone is in the room.", nextCard: 'timeAfterPresence', updateState: () => { this.interviewData.presence = "ROOM" }},
          {label: "When someone is at home.",     nextCard: 'timeAfterPresence', updateState: () => { this.interviewData.presence = "HOME" }},
          {label: "When it's dark outside.",      nextCard: 'presenceAfterTime', updateState: () => { this.interviewData.time = "DARK"     }},
          {label: "Between certain times.",                                      updateState: () => { this.interviewData.time = "CUSTOM"   },
            callback:() => { this._showTimePopup("presenceAfterTime")}},
          {label: "Always.",                      nextCard: 'locked',            updateState: () => { this.interviewData.always = true     }},
        ]
      },
      timeAfterPresence: {
        question:"Always or only at certain times?",
          answers: [
          {label: "When it's dark outside.", nextCard: "dimmable", updateState: () => { this.interviewData.time = "DARK"   }},
          {label: "When the sun is up.",     nextCard: "dimmable", updateState: () => { this.interviewData.time = "LIGHT"  }},
          {label: "Between certain times.",                      updateState: () => { this.interviewData.time = "CUSTOM" },
              callback:() => { this._showTimePopup("dimmable")}},
          {label: "Always is fine.",         nextCard: "dimmable", updateState: () => { this.interviewData.time = "ALWAYS" }},
        ]
      },
      allowedToTurnOff: {
        question: "Is it OK if I turn off at " + timeString + " even if there is someone around?",
          answers: [
          {label: "Stay on as long as there's somebody in the room.", nextCard: "dimmable", updateState: () => { this.interviewData.option = "ROOM"; }},
          {label: "Stay on as long as somebody is home.",             nextCard: "dimmable", updateState: () => { this.interviewData.option = "HOME"; }},
          {label: "Yes, you can turn off at " + timeString + ".",     nextCard: "dimmable", updateState: () => { this.interviewData.option =  null;  }},
        ]
      },
      presenceAfterTime: {
        question:"Should I react to your presence as well? I can turn off automatically if nobody is around!",
          answers: [
          {label: "Yes, be on if someone is in the room.", nextCard: "dimmable", updateState: () => { this.interviewData.presence = "ROOM"; }},
          {label: "Yes, be on if someone is at home.",     nextCard: "dimmable", updateState: () => { this.interviewData.presence = "HOME"; }},
          {label: "No, you can ignore presence.",          nextCard: "dimmable", updateState: () => { this.interviewData.presence =  null;  }},
        ]
      },
      button: {
        question:"Is there a wall switch connected to me?",
          answers: [
          {label: "Yes.", nextCard: "switchCraft", updateState: () => { this.interviewData.switchCraft =  true;  }},
          {label: "No.",                           updateState: () => { this.interviewData.switchCraft = false; this.finish() }},
        ]
      },
      switchCraft: {
        question:"I can be controlled with both the wall switch as well as the app and my own behaviour by using Switchcraft!\n\nIs this switch already modified?",
          answers: [
          {label: "Yes.",                 updateState: () => { this.interviewData.switchCraft =  true; this.finish();  }},
          {label: "What's Switchcraft?", updateState: () => { this.interviewData.switchCraft =  false; this.finish();  }},
          {label: "No.",                  updateState: () => { this.interviewData.switchCraft = false; this.finish(); }},
        ]
      },
      dimmable: {
        question:"Am I connected to a dimmable lamp?",
          answers: [
          {label: "Yes.",  nextCard: "button", updateState: () => { this.interviewData.dimming =  true; }},
          {label: "Nope.", nextCard: "button", updateState: () => { this.interviewData.dimming =  false;}},
        ]
      },
      locked: {
        question:"Should I ignore any switch command until you unlock me?",
          answers: [
          {label: "Yes, please."                        , updateState: () => { this.interviewData.locked = true;  this.finish(); }},
          {label: "No, just don't switch automatically!", updateState: () => { this.interviewData.locked = false; this.finish(); }},
        ]
      }
    }
  }


  finish() {
    this.setState({finished: true})
  }


  _showTimePopup(nextCard) {
    core.eventBus.emit('showAicoreTimeCustomizationOverlay', {
      callback: (newTime : aicoreTime) => {
        this.interviewData.timeDetails = newTime;

        let nextIdToGoTo = nextCard;
        if (newTime.type !== "ALL_DAY" && (newTime.to.type === "CLOCK" || newTime.to.type === "SUNSET")) {
          nextIdToGoTo = "allowedToTurnOff";
        }

        let currentSlides = this.state.slides;
        currentSlides.splice(this.state.activeSlide + 1);

        currentSlides.push(this.getCards()[nextIdToGoTo]);
        this.setState({slides: currentSlides}, () => {
          setTimeout(() => {this._carousel.snapToItem(currentSlides.length-1);}, 0);
        })
      },
      time: null,
      image: require("../images/overlayCircles/time.png")
    })
  }


  render() {
    return (
      <Background hasNavBar={false} image={core.background.light}>
        <OrangeLine/>
        {this.state.finished === false ?
          <Carousel
            ref={(c) => {
              this._carousel = c;
            }}
            data={this.state.slides}
            renderItem={({ item, index }) => {
              return <InterviewCard
                nextCard={(cardId) => {
                  if (!cardId) { return; }

                  let currentSlides = this.state.slides;
                  currentSlides.splice(this.state.activeSlide + 1)

                  currentSlides.push(this.getCards()[cardId])
                  this.setState({ slides: currentSlides }, () => {
                    setTimeout(() => {
                      this._carousel.snapToItem(currentSlides.length - 1);
                    }, 0);
                  })
                }}
                card={item}
              />
            }}
            sliderWidth={screenWidth}
            itemWidth={screenWidth}
            onSnapToItem={(index) => this.setState({ activeSlide: index })}
          />
        : undefined }
      </Background>
    );
  }

}

function InterviewCard(props) {
  let question = props.card.question;
  let answers = props.card.answers
  return (
    <View>
      <FadeIn><Text style={questionStyle}>{question}</Text></FadeIn>
      <Answers data={answers} nextCard={props.nextCard}  />
    </View>
  )
}
function Answers({data, nextCard}) {
  let answers = [];
  data.forEach((answer, index) => {
    answers.push(
      <FadeIn key={"answer_" + index} index={index}>
        <TextButtonSemitranslucentDark
          label={answer.label}
          callback={() => {
            if (answer.updateState) { answer.updateState(); }

            if (answer.callback) { answer.callback(); }
            else                 { nextCard(answer.nextCard); }
          }}
        />
      </FadeIn>);
  })

  return (
    <View>{answers}</View>
  )
}
