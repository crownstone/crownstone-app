#!/bin/bash

# Copies fonts from js to android dir.

cp -r ../js/fonts/*.ttf app/src/main/assets/fonts/


# Can also be done with gradle:
#   Edit `android/app/build.gradle` ( NOT `android/build.gradle` ) and add the following:
#   ```gradle
#   apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
#   ```
cp -r ../node_modules/react-native-vector-icons/Fonts/*.ttf app/src/main/assets/fonts/
