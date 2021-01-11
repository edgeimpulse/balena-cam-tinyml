#!/bin/sh
#This script builds and downloads WASM classifier using Edge Impulse API
# API Key and Project ID are defined as environment variables in BalenaCloud

# Fill out and uncomment for local deployment
#EI_API_KEY=""
#EI_PROJECT_ID=""

# Build WASM model and retrieves JOB ID
JOB_ID=`curl --request POST \
  --url "https://studio.edgeimpulse.com/v1/api/$EI_PROJECT_ID/jobs/build-ondevice-model?type=wasm" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --header "x-api-key: $EI_API_KEY" \
  --data '{"engine":"tflite-eon"}' | sed -n '/.*id":/ { s///; s/}.*//; p; q; }'`

# Loop until build is finished
while true; do
  BUILD_STATUS=`curl --request GET \
    --url "https://studio.edgeimpulse.com/v1/api/$EI_PROJECT_ID/jobs/$JOB_ID/status" \
    --header "Accept: application/json" \
    --header "x-api-key: $EI_API_KEY" | grep "finished"`

  if [ $? -ne 1 ]; then break; fi
  echo "Still building WASM..."
  sleep 5
done

# Retrieve WASM model
curl --request GET \
  --url "https://studio.edgeimpulse.com/v1/api/$EI_PROJECT_ID/deployment/download?type=wasm" \
  --header "accept: application/zip" \
  --header "x-api-key: $EI_API_KEY" --output wasm.zip && \
  unzip -o wasm.zip && rm wasm.zip

# default WASM classifier will be loaded if curl request fails
exit 0
