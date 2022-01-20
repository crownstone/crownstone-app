# Set to dir with the cloud test container repo.
CLOUD_DIR="../cloud-test-container"

export IP_ADDRESS=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`

# Set to your IP address, or leave commented out to use the result of ifconfig.
#export IP_ADDRESS="1.2.3.4"

${CLOUD_DIR}/reset_mongo_db.sh

detox test --configuration android-debug-device

