#!/bin/bash

echo "yarn"
yarn

echo "npm run build"
npm run build
if [ $? -ne 0 ]; then
        echo "failed"
#       exit 1
else
        echo "success"
fi
