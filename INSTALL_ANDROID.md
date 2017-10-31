# Installation

Go to https://developer.android.com/studio/index.html and scroll all the way down!

You will find a link like: https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip. Unzip to e.g. `/opt`.

    export PATH=$PATH:/opt/tools:/opt/tools/bin 
    export ANDROID_HOME=/opt

    sdkmanager "platforms;android-23"
    sdkmanager --licenses

Just these few lines should be enough to set you up without installing Android Studio or other bloatware IDEs.

## What NOT to do

These are android images, not needed

    #DONT sudo apt install android 

The following is UNNECESSARY TOO

    #DONT sudo apt install google-android-platform-23-installer
    #DONE sudo apt install google-android-build-tools-installer

Of course, this should make it so much easier: `ubuntu-make` didn't work for me, should have been just umake android, but checksum was incorrect!

    #DONT umake android 

# Preparation

Prepare your local config:

    cp js/LocalConfig.template.ts cp/js/LocalConfig.ts

# Running

Just `react-native run-android` might not be enough. 

Run in several shells:

    cd android && ./reverse.sh
    npm start
    react-native start

# Troubleshooting

Try a different USB port if you've trouble connecting with your phone, adjust your udev rules, and all kind of other typical things. If you solved some particular issue, please tell us and we can add it to this troubleshooting section.
