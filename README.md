# Image classification using Edge Impulse and BalenaCloud

This guide will help you deploy an image classification system running on a Raspberry Pi. [Edge Impulse](https://edgeimpulse.com) enables developers to create intelligent device solutions with embedded Machine Learning. You will learn how to easily acquire image samples using your smartphone, train your ML algorithm and deploy the inference engine on your device. [BalenaCloud](https://balena.io) is a container-based platform for deploying IoT applications.

## Overview

This project is based on the great [BalenaCam project](https://github.com/balenalabs/balena-cam) to live stream your camera's feed by running a webapp in a container. For our application we leverage the multi-containers feature of Balena by adding a second container running Edge Impulse webassembly inference engine inside a Node.js server. The 2 containers communicate with each other through a websocket. The `balena-cam` webapp has been modified to call the inference engine every second and display the results on the webpage.

## Requirements

* Raspberry Pi (v3 and v4 tested)
* [Raspberry Pi camera](https://www.raspberrypi.org/products/camera-module-v2/)
* A mobile phone to capture image samples 
* Sign up for a free [Edge Impulse account](https://edgeimpulse.com/)
* Sign up for a free [BalenaCloud account](https://www.balena.io/)

## Creating your Edge Impulse project

In this tutorial we'll build a model that can distinguish between different type of shoes: flip flops, sneakers or running shoes. 

### Data collection

Head to your Edge Impulse project and add your mobile phone as a device to start capturing images:

![connect a new device](images/01device.png)

Scan the QR code with your phone and then go the *Data Acquisition* section.

You should capture around 30 to 50 images of each object you wish to classify. Make sure to capture with a variety of angles and zoom levels to get some diversity in the dataset.
Capture also 50 random images that are not objects you wish to classify.

![Image samples](images/02samples.png)

You will also need to get some testing data to validate the image classification model. You can switch between training and testing data  above the *Collected data* widget:

![Training-testing data](images/03testing.png)

A good proportion is to have a training/testing ratio of 80/20. In this example we have 32 samples in training data and 8 samples in testing data per label. If you have captured all your samples in *Training data*, you can move them to the *Test data* by clicking on the 3-dots link on each sample line.

For more details you can follow our tutorial on [Collecting image data with your phone](https://docs.edgeimpulse.com/docs/image-classification-mobile-phone)

### Impulse design

Head to the *Impulse design* section and add the *Image* and *Transfer Learning* blocks to perform image classification:

![Impulse](images/04impulse.png)

Select the *Image* section and confirm *RGB* color depth. Image features will then be generated.

Finally configure the Neural Network in the *Transfer learning* section with the following parameters:
* Number of training cycles: 100
* Learning rate: 0.001
* Data augmentation: ON
* Minimum confidence rating: 0.75

Depending on the complexity of your dataset you may need to tune those values.

Start the Neural Network training and check that performances are correct:

![Training the Neural Network](images/05training.png)

### Model testing

Before deploying our model, let's validate our current model using our Test data. Head to the *Model testing* section and classify all samples:

![Model testing](images/06test.png)

If you are satisfied with the accuracy it's time to build the library.

### Deployment

Head to the *Deployment* section and select the WebAssembly library:

![WASM](images/07wasm.png)

Select the *Quantized* version of the library and click on *Build*:

![Building the library](images/08build.png)

You can download the WebAssembly on your computer though the library will be automatically imported on the Raspberry using Edge Impulse API.

## Creating your BalenaCloud project

Click on the following link to deploy the application in your Balena account:

[![](https://balena.io/deploy.png)](https://dashboard.balena-cloud.com/deploy)


### Password Protect your balenaCam device

To protect your balenaCam devices using a username and a password set the following environment variables.

| Key            | Value
|----------------|---------------------------
|**`username`**  | **`yourUserNameGoesHere`**
|**`password`**  | **`yourPasswordGoesHere`**

💡 **Tips:** 💡 
* You can set them as [fleet environment variables](https://www.balena.io/docs/learn/manage/serv-vars/#fleet-environment-and-service-variables) and every new balenaCam device you add will be password protected.
* You can set them as [device environment variables](https://www.balena.io/docs/learn/manage/serv-vars/#device-environment-and-service-variables) and the username and password will be different on each device.

### Optional Settings

- To rotate the camera feed by 180 degrees, add a **device variable**: `rotation` = `1` (More information about this on the [docs](https://www.balena.io/docs/learn/manage/serv-vars/)).
- To suppress any warnings, add a **device variable**: `PYTHONWARNINGS` = `ignore`

### TURN server configuration


If you have access to a TURN server and you want your balenaCam devices to use it. You can easily configure it using the following environment variables. When you set them all the app will use that TURN server as a fallback mechanism when a direct WebRTC connection is not possible.

| Key            | Value
|----------------|---------------------------
|**`STUN_SERVER`**  | **`stun:stun.l.google.com:19302`**
|**`TURN_SERVER`**  | **`turn:<yourTURNserverIP>:<yourTURNserverPORT>`**
|**`TURN_USERNAME`**  | **`<yourTURNserverUsername>`**
|**`TURN_PASSWORD`**  | **`yourTURNserverPassword`**

## Additional Information

- This project uses [WebRTC](https://webrtc.org/) (a Real-Time Communication protocol).
- A direct WebRTC connection fails in some cases.
- This current version uses mjpeg streaming when the webRTC connection fails.
- Chrome browsers will hide the local IP address from WebRTC, making the page appear but no camera view. To resolve this try the following
  - Navigate to chrome://flags/#enable-webrtc-hide-local-ips-with-mdns and set it to Disabled
  - You will need to relaunch Chrome after altering the setting
- Firefox may also hide local IP address from WebRTC, confirm following in 'config:about'
  - media.peerconnection.enabled: true
  - media.peerconnection.ice.obfuscate_host_addresses: false

## Supported Browsers

- **Chrome** (but see note above)
- **Firefox** (but see note above)
- **Safari**
- **Edge** (only mjpeg stream)
