# Set to dir with the cloud test container repo.
CLOUD_DIR="../cloud-test-container"

LOG_LEVEL="info"
BUILD_APP=1
export REUSE=0

usage () {
	echo "Usage: $0 [options]"
	echo "Option              Meaning"
	echo "  -i <IP address>   Provide the IP address of the test cloud."
	echo "  -r                Reuse the app database."
	echo "  -b                Skip building the app."
	echo "  -v                Verbose logs."
	exit 1
}

while getopts i:rbhv flag
do
    case "${flag}" in
        i) IP_ADDRESS=${OPTARG};;
        r) REUSE=1;;
	b) BUILD_APP=0;;
	v) LOG_LEVEL="verbose";;
	h) usage;;
    esac
done

if [ -z "$IP_ADDRESS" ]; then
	export IP_ADDRESS=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`
fi

if [ `echo "$IP_ADDRESS" | wc -l` -gt 1 ]; then
	echo "There are multiple matches for your IP address, please provide your IP address as argument."
	echo "IP addresses found:"
	echo "$IP_ADDRESS"
	usage
fi

export IP_ADDRESS=$IP_ADDRESS

echo "Using $IP_ADDRESS as local IP address."

./scripts/set_demo_mode_android.sh on

REUSE_FLAG=""
if [ "$REUSE" == "1" ]; then
        REUSE_FLAG="--reuse"
        ${CLOUD_DIR}/scripts/reset_mocks.sh
else
	${CLOUD_DIR}/reset.sh
fi

if [ "$BUILD_APP" == "1" ]; then
	echo "Building app"
	detox build --configuration android-debug-device-english
fi

detox test --configuration android-debug-device-english $REUSE_FLAG --loglevel "$LOG_LEVEL"

./scripts/set_demo_mode_android.sh off
