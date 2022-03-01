#!/bin/sh
#this only affects the simulator, so we do not really care
xcrun simctl status_bar "iPhone 13" override --time "12:00" --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularMode active --cellularBars 4