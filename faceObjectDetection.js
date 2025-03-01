console.log("faceObjectDetection.js loaded");

function initFaceObjectDetection() {
    if (typeof cv === 'undefined') {
        console.error("OpenCV.js is not loaded. Check your script reference.");
        return;
    }
    
    console.log("onruntimeinitialised");
    cv['onRuntimeInitialized'] = function () {
        console.log("OpenCV.js is ready!");
        document.getElementById('faceObjectButton').disabled = false;
        
        document.getElementById('faceObjectButton').addEventListener('click', function() {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
    
            if (!canvas || !ctx) {
                alert("Please upload an image first.");
                return;
            }
    
            console.log("Face & Object detection using OpenCV started...");
    
            // Read the image displayed on the canvas into an OpenCV Mat object.
            let src = cv.imread(canvas);
            // Create a new Mat object to hold the grayscale version of the image.
            let gray = new cv.Mat();
            // Convert the source image from RGBA to grayscale.
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
            // Create two CascadeClassifier objects: one for faces, one for objects.
            let faceCascade = new cv.CascadeClassifier();
            let objectCascade = new cv.CascadeClassifier();
    
            // Define the file paths to the cascade XML files for face and full-body detection.
            let faceCascadeFile = 'haarcascade_frontalface_default.xml';
            let objectCascadeFile = 'haarcascade_fullbody.xml';
    
            try {
                // Attempt to load the cascade files.
                let faceLoaded = faceCascade.load(faceCascadeFile);
                let objectLoaded = objectCascade.load(objectCascadeFile);
                console.log("Face cascade loaded:", faceLoaded);
                console.log("Object cascade loaded:", objectLoaded);
            } catch (error) {
                console.error("Failed to load XML files:", error);
                alert("Error loading face/object detection models.");
                src.delete();
                gray.delete();
                return;
            }
    
            // Create empty vectors (arrays) to store detected face and object regions.
            let faces = new cv.RectVector();
            let objects = new cv.RectVector();
            // Define a minimum detection size of 100x100 pixels.
            let minSize = new cv.Size(100, 100);
    
            // Run face detection on the grayscale image using the cascade classifier.
            faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, minSize, new cv.Size());
            // Run full-body detection on the grayscale image.
            objectCascade.detectMultiScale(gray, objects, 1.1, 3, 0, minSize, new cv.Size());
    
            console.log("Number of faces detected:", faces.size());
            console.log("Number of objects detected:", objects.size());
    
            // Calculate positions for the Rule of Thirds grid:
            // The image is divided into thirds both vertically and horizontally.
            let imgWidth = canvas.width;
            let imgHeight = canvas.height;
            let gridX1 = imgWidth / 3;
            let gridX2 = (imgWidth * 2) / 3;
            let gridY1 = imgHeight / 3;
            let gridY2 = (imgHeight * 2) / 3;
            // Tolerance is 6% of the smaller dimension (width or height).
            let tolerance = 0.06 * Math.min(imgWidth, imgHeight);
    
            console.log("Grid positions:", { gridX1, gridX2, gridY1, gridY2, tolerance });
    
            // Create an array to combine detections from both classifiers.
            let detections = [];
            // Loop through each detected face and add it to the detections array.
            for (let i = 0; i < faces.size(); i++) {
                let face = faces.get(i);
                detections.push({x: face.x, y: face.y, width: face.width, height: face.height, type: 'face'});
            }
    
            // Loop through each detected object and add it to the detections array.
            for (let i = 0; i < objects.size(); i++) {
                let object = objects.get(i);
                detections.push({x: object.x, y: object.y, width: object.width, height: object.height, type: 'object'});
            }
    
            // Prioritize faces over objects by sorting the detections array.
            detections.sort((a, b) => a.type === 'face' ? -1 : 1);
    
            // Check each detection to see if its center is near one of the Rule of Thirds grid lines.
            let matchFound = false;
            detections.forEach(function(item) {
                // Calculate the center coordinates of the detection.
                let centerX = item.x + item.width / 2;
                let centerY = item.y + item.height / 2;
    
                // Determine if the center is near one of the vertical grid lines.
                let nearVertical = Math.abs(centerX - gridX1) <= tolerance || Math.abs(centerX - gridX2) <= tolerance;
                // Determine if the center is near one of the horizontal grid lines.
                let nearHorizontal = Math.abs(centerY - gridY1) <= tolerance || Math.abs(centerY - gridY2) <= tolerance;
    
                // Log the detection's center and whether it's near the grid lines.
                console.log(`Detection (${item.type}) center at (${centerX}, ${centerY}) - nearVertical: ${nearVertical}, nearHorizontal: ${nearHorizontal}`);
    
                if (nearVertical || nearHorizontal) {
                    // If a detection is near any grid line, draw a rectangle around it.
                    // Red for faces and blue for objects.
                    ctx.strokeStyle = item.type === 'face' ? 'red' : 'blue';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(item.x, item.y, item.width, item.height);
                    matchFound = true;
                }
            });
    
            // Alert the user whether any detections align with the Rule of Thirds.
            alert(matchFound ? "Faces/Objects align with Rule of Thirds!" : "No significant alignment found.");
    
            // Clean up allocated memory by deleting Mat objects and vectors.
            src.delete();
            gray.delete();
            faces.delete();
            objects.delete();
        });
    };
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFaceObjectDetection);
} else {
    initFaceObjectDetection();
}
