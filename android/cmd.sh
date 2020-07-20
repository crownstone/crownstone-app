#!/bin/bash

serial=""

if [ "$#" -lt 2 ]; then
	echo "Usage: $0 <target> <command>"
	exit 1
fi

serial=$(grep "^$1 " serial-numbers.txt | cut -d " " -f 2)
if [ -z $serial ]; then
	echo "Unkown target: $1"
	echo "Usage: $0 [target] <command>"
	exit 1
fi

echo adb -s "$serial" "${@:2}"
adb -s "$serial" "${@:2}"

exit $?
