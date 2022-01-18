#!/bin/bash

echo "Starting server, browse to http://localhost:5678/"
docker --run -p 5678:9999 gcr.io/android-battery-historian/stable:3.0 --port 9999
