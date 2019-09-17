
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("InterviewLight", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text, TextStyle,
  View} from "react-native";
import { core } from "../core";
import { Background } from "../views/components/Background";
import { colors, screenWidth } from "../views/styles";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { FadeIn} from "../views/components/animated/FadeInView";
import { TextButtonSemitranslucentDark } from "../views/components/InterviewComponents";
import { AicoreUtil } from "../views/deviceViews/smartBehaviour/supportCode/AicoreUtil";




let questionStyle : TextStyle = {
  padding: 15,
  marginTop: 20,
  fontSize: 21,
  fontWeight: "bold",
  color: colors.csBlue.hex
};

export class InterviewLight extends Component<any, any> {
  interviewState;
  interviewData;

  _carousel;
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
          {label: lang("When_someone_is_in_the_roo"), nextCard: 'timeAfterPresence', updateState: () => { this.interviewData.presence = "ROOM" }},
          {label: lang("When_someone_is_at_home_"),     nextCard: 'timeAfterPresence', updateState: () => { this.interviewData.presence = "HOME" }},
          {label: lang("When_its_dark_outside_"),      nextCard: 'presenceAfterTime', updateState: () => { this.interviewData.time = "DARK"     }},
          {label: lang("Between_certain_times_"),                                      updateState: () => { this.interviewData.time = "CUSTOM"   },
            callback:() => { this._showTimePopup("presenceAfterTime")}},
          {label: lang("Always_"),                      nextCard: 'locked',            updateState: () => { this.interviewData.always = true     }},
        ]
      },
      timeAfterPresence: {
        question:"Always or only at certain times?",
          answers: [
          {label: lang("When_its_dark_outside_"), nextCard: "dimmable", updateState: () => { this.interviewData.time = "DARK"   }},
          {label: lang("When_the_sun_is_up_"),     nextCard: "dimmable", updateState: () => { this.interviewData.time = "LIGHT"  }},
          {label: lang("Between_certain_times_"),                      updateState: () => { this.interviewData.time = "CUSTOM" },
              callback:() => { this._showTimePopup("dimmable")}},
          {label: lang("Always_is_fine_"),         nextCard: "dimmable", updateState: () => { this.interviewData.time = "ALWAYS" }},
        ]
      },
      allowedToTurnOff: {
        question: "Is it OK if I turn off at " + timeString + " even if there is someone around?",
          answers: [
          {label: lang("Stay_on_as_long_as_theres_"), nextCard: "dimmable", updateState: () => { this.interviewData.option = "ROOM"; }},
          {label: lang("Stay_on_as_long_as_somebod"),             nextCard: "dimmable", updateState: () => { this.interviewData.option = "HOME"; }},
          {label: lang("Yes__you_can_turn_off_at__",timeString),     nextCard: "dimmable", updateState: () => { this.interviewData.option =  null;  }},
        ]
      },
      presenceAfterTime: {
        question:"Should I react to your presence as well? I can turn off automatically if nobody is around!",
          answers: [
          {label: lang("Yes__be_on_if_someone_is_i"), nextCard: "dimmable", updateState: () => { this.interviewData.presence = "ROOM"; }},
          {label: lang("Yes__be_on_if_someone_is_at"),     nextCard: "dimmable", updateState: () => { this.interviewData.presence = "HOME"; }},
          {label: lang("No__you_can_ignore_presenc"),          nextCard: "dimmable", updateState: () => { this.interviewData.presence =  null;  }},
        ]
      },
      button: {
        question:"Is there a wall switch connected to me?",
          answers: [
          {label: lang("Yes_"), nextCard: "switchCraft", updateState: () => { this.interviewData.switchCraft =  true;  }},
          {label: lang("No_"),                           updateState: () => { this.interviewData.switchCraft = false; this.finish() }},
        ]
      },
      switchCraft: {
        question:"I can be controlled with both the wall switch as well as the app and my own behaviour by using Switchcraft!\n\nIs this switch already modified?",
          answers: [
          {label: lang("Yes_"),                 updateState: () => { this.interviewData.switchCraft =  true; this.finish();  }},
          {label: lang("Whats_Switchcraft_"), updateState: () => { this.interviewData.switchCraft =  false; this.finish();  }},
          {label: lang("No_"),                  updateState: () => { this.interviewData.switchCraft = false; this.finish(); }},
        ]
      },
      dimmable: {
        question:"Am I connected to a dimmable lamp?",
          answers: [
          {label: lang("Yes_"),  nextCard: "button", updateState: () => { this.interviewData.dimming =  true; }},
          {label: lang("Nope_"), nextCard: "button", updateState: () => { this.interviewData.dimming =  false;}},
        ]
      },
      locked: {
        question:"Should I ignore any switch command until you unlock me?",
          answers: [
          {label: lang("Yes__please_"), updateState: () => { this.interviewData.locked = true;  this.finish(); }},
          {label: lang("No__just_dont_switch_autom"), updateState: () => { this.interviewData.locked = false; this.finish(); }},
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
                  currentSlides.splice(this.state.activeSlide + 1);

                  currentSlides.push(this.getCards()[cardId]);
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
  let answers = props.card.answers;
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
  });

  return (
    <View>{answers}</View>
  )
}
