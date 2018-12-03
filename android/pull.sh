#!/bin/bash
scriptPath="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

phoneDir="/sdcard/Android/data/rocks.crownstone.consumerapp/files/"
localDir="${scriptPath}/../app-logs/"
cmd="pull -a"

result=0
if [ "$#" -lt 1 ]; then
	echo "$cmd" "$phoneDir" "$localDir" | xargs adb
	result=$?
else
	echo "$1" "$cmd" "$phoneDir" "${localDir}${1}/" | xargs ${scriptPath}/cmd.sh
	result=$?
fi

if [ "$result" != "0" ]; then
	exit $result
fi

chmod --recursive a+r "${localDir}"
exit $?
