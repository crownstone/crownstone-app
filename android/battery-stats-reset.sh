#!/bin/bash

adb kill-server
adb shell dumpsys batterystats --reset
