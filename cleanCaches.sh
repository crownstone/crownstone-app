#!/bin/bash

# Stop cached listeners
watchman watch-del-all

# Remove installed modules
rm -rf node_modules

# Install only fresh copies
yarn cache clean
yarn

# Kill any other instance of the packager
lsof -ti:8081 | xargs kill

# Restart the thing
npm start --reset-cache