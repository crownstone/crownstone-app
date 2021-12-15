SCRIPT_DIR="../cloud-test-container"
IP_ADDRESS=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`

${SCRIPT_DIR}/reset_mongo_db.sh

detox test --configuration ios-debug