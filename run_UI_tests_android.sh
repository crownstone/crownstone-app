# Set to dir with the cloud test container repo.
CLOUD_DIR="../cloud-test-container"

export REUSE=0
while getopts i:r: flag
do
    case "${flag}" in
        i) IP_ADDRESS=${OPTARG};;
        r) REUSE=${OPTARG};;
    esac
done

usage () {
	echo "Usage: $0 -i <local_IP_address> -r <1|0>"
	exit 1
}

if [ -z "$IP_ADDRESS" ]; then
	export IP_ADDRESS=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`
fi

if [ `echo "$IP_ADDRESS" | wc -l` -gt 1 ]; then
	echo "There are multiple matches for your IP address, please provide your IP address as argument."
	usage
fi

export IP_ADDRESS=$IP_ADDRESS

echo "Using $IP_ADDRESS as local IP address."

./scripts/set_demo_mode_android.sh on

if [ "$REUSE" == "1" ]; then
	${CLOUD_DIR}/scripts/reset_mocks.sh
	detox test --configuration android-debug-device -l --reuse verbose
else
	${CLOUD_DIR}/reset.sh
	detox build --configuration android-debug-device
	detox test --configuration android-debug-device -l verbose
fi

./scripts/set_demo_mode_android.sh off

