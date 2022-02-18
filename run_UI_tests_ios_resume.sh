# Set to dir with the cloud test container repo.
CLOUD_DIR="../cloud-test-container"

usage () {
	echo "Usage: $0 [local_IP_address]"
	exit 1
}

if [ $# -gt 0 ]; then
	export IP_ADDRESS="$1"
else
	export IP_ADDRESS=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`
fi

if [ `echo "$IP_ADDRESS" | wc -l` -gt 1 ]; then
	echo "There are multiple matches for your IP address, please provide your IP address as argument."
	usage
fi

echo "Using $IP_ADDRESS as local IP address." 

detox test --configuration ios-debug

