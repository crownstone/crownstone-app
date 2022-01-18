#!/bin/bash

adb shell dumpsys batterystats > batterystats.txt
adb bugreport bugreport.zip
