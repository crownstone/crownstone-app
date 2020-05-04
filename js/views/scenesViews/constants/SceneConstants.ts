import { screenWidth } from "../../styles";

let padding     = 15;
let sceneHeight = 80;
let sceneImageWidth = 100;
let buttonWidth = 80;


export let SceneConstants = {
  roundness:   10,
  sceneHeight: sceneHeight,
  sceneImageWidth: sceneImageWidth,
  padding:     padding,
  buttonWidth: buttonWidth,
  playWidth:   buttonWidth - 40,
  textWidth:   screenWidth - 2*padding - sceneImageWidth - buttonWidth - 10
}