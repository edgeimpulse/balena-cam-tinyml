// Load the inferencing WebAssembly module
const Module = require('./edge-impulse-standalone');
// sharp module to retrieve image pixels information
const sharp = require('sharp');
const WebSocket = require('ws');


// Classifier module
let classifierInitialized = false;
Module.onRuntimeInitialized = function() {
    classifierInitialized = true;
};

class EdgeImpulseClassifier {
    _initialized = false;

    init() {
        if (classifierInitialized === true) return Promise.resolve();

        return new Promise((resolve) => {
            Module.onRuntimeInitialized = () => {
                resolve();
                classifierInitialized = true;
            };
        });
    }

    classify(rawData, debug = false) {
        if (!classifierInitialized) throw new Error('Module is not initialized');

        const obj = this._arrayToHeap(rawData);
        let ret = Module.run_classifier(obj.buffer.byteOffset, rawData.length, debug);
        Module._free(obj.ptr);

        if (ret.result !== 0) {
            throw new Error('Classification failed (err code: ' + ret.result + ')');
        }

        let jsResult = {
            anomaly: ret.anomaly,
            results: []
        };

        for (let cx = 0; cx < ret.classification.size(); cx++) {
            let c = ret.classification.get(cx);
            jsResult.results.push({ label: c.label, value: c.value });
        }

        return jsResult;
    }

    _arrayToHeap(data) {
        let typedArray = new Float32Array(data);
        let numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
        let ptr = Module._malloc(numBytes);
        let heapBytes = new Uint8Array(Module.HEAPU8.buffer, ptr, numBytes);
        heapBytes.set(new Uint8Array(typedArray.buffer));
        return { ptr: ptr, buffer: heapBytes };
    }
}


//Initialize the classifier
let classifier = new EdgeImpulseClassifier();
const cl = classifier.init();

// Initialize websocket
const wss = new WebSocket.Server({ port: 8080 });

// Incoming websocket connection
wss.on('connection', function connection(ws) {

    ws.on('message', function incoming(message) {
        console.log('received new image');

        // Retrieve raw information from image in argument and parse it for the classifier
        let raw_features = [];
        const buf = sharp(Buffer.from(message, 'base64')).raw().toBuffer()
            .then(img_buffer => {
                let buf_string = img_buffer.toString('hex');
                
                // store RGB pixel value and convert to integer
                for (let i=0; i<buf_string.length; i+=6) {
                    raw_features.push(parseInt(buf_string.slice(i, i+6), 16));
                }
            })
            .catch(err => {
                console.error('Failed to load image', err);
            });
        
        // Run classifier once image raw features retrieved and classifier initialized
        Promise.all([cl, buf])
        .then(() => {
            let result = classifier.classify(raw_features);
            console.log();
            ws.send(JSON.stringify(result));

        })
        .catch(err => {
            console.error('Failed to run classifier', err);
        })
      
    })

});
