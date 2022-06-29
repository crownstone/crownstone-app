import * as React from 'react';
import { Alert, Animated, Platform, Vibration, Text, View } from "react-native";
import { Languages } from "../../../Languages";
import { LiveComponent } from "../../LiveComponent";
import { Get } from "../../../util/GetUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { TrainingData } from "../../roomViews/trainingComponents/TrainingData";
import { Bluenet } from "../../../native/libInterface/Bluenet";
import { Background } from "../../components/Background";
import { colors, screenHeight, screenWidth, styles, topBarHeight } from "../../styles";
import { Button } from "../../components/Button";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";


function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining", key)(a,b,c,d,e);
}

export const MIN_DATA_COUNT = 10;


export function RoomTrainingStep2_train() {
}
