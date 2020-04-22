import { screenWidth } from "../../styles";

let padding     = 15;
let sceneHeight = 80;
let buttonWidth = 60;
let selectableWidth = buttonWidth + 20;


export let SceneConstants = {
  roundness:   10,
  sceneHeight: sceneHeight,
  padding:     padding,
  buttonWidth: buttonWidth,
  selectableWidth: selectableWidth,
  arrowWidth: buttonWidth - 30,
  textWidth:   screenWidth - 2*padding - sceneHeight - selectableWidth - 10
}