# Set to dir with the cloud test container repo.
CLOUD_DIR="../cloud-test-container"

export REUSE=0
export VERBOSE_ARG="info"
export LANGUAGE="en"

while getopts i:l:rv flag
do
    case "${flag}" in
        i) IP_ADDRESS=${OPTARG};;
        r) REUSE=1;;
        v) VERBOSE=1;;
        l) LANGUAGE=${OPTARG};;
    esac
done

usage () {
	echo "Usage: $0 -i [local_IP_address] -r [reuse] -v [verbose] -l [language en|nl]"
	exit 1
}

if [ -z "$IP_ADDRESS" ]; then
	export IP_ADDRESS=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`
fi

if [ `echo "$IP_ADDRESS" | wc -l` -gt 1 ]; then
	echo "There are multiple matches for your IP address, please provide your IP address as argument."
	echo $IP_ADDRESS
	usage
fi

export IP_ADDRESS=$IP_ADDRESS

echo "Using $IP_ADDRESS as local IP address."
echo "Using language: $LANGUAGE"

if [ -n "$VERBOSE" ]; then
  echo "Using verbose logs"
  export VERBOSE_ARG="verbose"
fi

export CONFIG="ios-debug-english"

if [ "$LANGUAGE" == "nl" ]; then
  CONFIG="ios-debug-nederlands"
fi


echo $CONFIG
./scripts/set_demo_mode_ios.sh

if [ "$REUSE" == "0" ]; then
  ${CLOUD_DIR}/reset.sh
  detox test --configuration "${CONFIG}" --loglevel "${VERBOSE_ARG}"
else
  ${CLOUD_DIR}/scripts/reset_mocks.sh
  detox test --configuration "${CONFIG}" --reuse --loglevel "${VERBOSE_ARG}"
fi


