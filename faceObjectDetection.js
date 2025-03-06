console.log("faceObjectDetection.js loaded");

function initFaceObjectDetection() {
    console.log("initFaceObjectDetection called");
    if (typeof cv === 'undefined') {
        console.error("OpenCV.js is not loaded. Check your script reference.");
        return;
    }
    
    console.log("Setting cv.onRuntimeInitialized...");
    cv['onRuntimeInitialized'] = function () {
        console.log("OpenCV.js is ready!");
        // Optionally, print build information to verify cv is working:
        console.log("OpenCV Build Info:", cv.getBuildInformation ? cv.getBuildInformation() : "N/A");
        
        // Enable the button
        const faceButton = document.getElementById('faceObjectButton');
        if(faceButton) {
            faceButton.disabled = false;
        } else {
            console.error("faceObjectButton not found in the DOM.");
        }
        
        faceButton.addEventListener('click', function() {
            console.log("faceObjectButton clicked");
            const canvas = document.getElementById('imageCanvas');
            if (!canvas) {
                console.error("imageCanvas not found.");
                return;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error("Canvas context is null.");
                return;
            }
    
            console.log("Face & Object detection using OpenCV started...");
    
            // Read the image from the canvas.
            let src = cv.imread(canvas);
            if (!src) {
                console.error("cv.imread returned null or undefined.");
                return;
            }
            
            // Convert to grayscale.
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
            // Initialize classifiers.
            let faceCascade = new cv.CascadeClassifier();
            let objectCascade = new cv.CascadeClassifier();
            // Use filenames for XML cascades located in the same directory.
            let faceCascadeFile = 'haarcascade_frontalface_default.xml';
            let objectCascadeFile = 'haarcascade_fullbody.xml';
    
            try {
                let faceLoaded = faceCascade.load(faceCascadeFile);
                let objectLoaded = objectCascade.load(objectCascadeFile);
                console.log("Face cascade loaded:", faceLoaded);
                console.log("Object cascade loaded:", objectLoaded);
                if (!faceLoaded || !objectLoaded) {
                    throw new Error("Cascade files did not load properly.");
                }
            } catch (error) {
                console.error("Failed to load XML files:", error);
                alert("Error loading face/object detection models.");
                src.delete();
                gray.delete();
                return;
            }
    
            // Detect faces and objects.
            let faces = new cv.RectVector();
            let objects = new cv.RectVector();
            let minSize = new cv.Size(100, 100);
            faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, minSize, new cv.Size());
            objectCascade.detectMultiScale(gray, objects, 1.1, 3, 0, minSize, new cv.Size());
    
            console.log("Number of faces detected:", faces.size());
            console.log("Number of objects detected:", objects.size());
    
            // Grid calculation.
            let imgWidth = canvas.width;
            let imgHeight = canvas.height;
            let gridX1 = imgWidth / 3;
            let gridX2 = (imgWidth * 2) / 3;
            let gridY1 = imgHeight / 3;
            let gridY2 = (imgHeight * 2) / 3;
            let tolerance = 0.06 * Math.min(imgWidth, imgHeight);
    
            console.log("Grid positions:", { gridX1, gridX2, gridY1, gridY2, tolerance });
    
            // Combine detections.
            let detections = [];
            for (let i = 0; i < faces.size(); i++) {
                let face = faces.get(i);
                detections.push({ x: face.x, y: face.y, width: face.width, height: face.height, type: 'face' });
            }
            for (let i = 0; i < objects.size(); i++) {
                let object = objects.get(i);
                detections.push({ x: object.x, y: object.y, width: object.width, height: object.height, type: 'object' });
            }
    
            // Prioritize faces.
            detections.sort((a, b) => a.type === 'face' ? -1 : 1);
    
            // Evaluate detections.
            let matchFound = false;
            detections.forEach(function(item) {
                let centerX = item.x + item.width / 2;
                let centerY = item.y + item.height / 2;
                let nearVertical = Math.abs(centerX - gridX1) <= tolerance || Math.abs(centerX - gridX2) <= tolerance;
                let nearHorizontal = Math.abs(centerY - gridY1) <= tolerance || Math.abs(centerY - gridY2) <= tolerance;
    
                console.log(`Detection (${item.type}) center at (${centerX}, ${centerY}) - nearVertical: ${nearVertical}, nearHorizontal: ${nearHorizontal}`);
    
                if (nearVertical || nearHorizontal) {
                    ctx.strokeStyle = item.type === 'face' ? 'red' : 'blue';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(item.x, item.y, item.width, item.height);
                    matchFound = true;
                }
            });
    
            alert(matchFound ? "Faces/Objects align with Rule of Thirds!" : "No significant alignment found.");
    
            // Clean up.
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
