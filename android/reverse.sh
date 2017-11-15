#!/bin/bash
scriptPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cmd="reverse tcp:8081 tcp:8081"

if [ "$#" -lt 1 ]; then
	echo "$cmd" "$apkPath" | xargs adb
	exit $?
fi

echo "$1" "$cmd" "$apkPath" | xargs ${scriptPath}/cmd.sh

exit $?
