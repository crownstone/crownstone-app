#!/bin/bash
scriptPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

apkPath="${HOME}/dev/app/android/app/build/outputs/apk/release/app-release.apk"
cmd="install -r"

if [ "$#" -lt 1 ]; then
	echo "$cmd" "$apkPath" | xargs adb
	exit $?
fi

echo "$1" "$cmd" "$apkPath" | xargs ${scriptPath}/cmd.sh

exit $?
