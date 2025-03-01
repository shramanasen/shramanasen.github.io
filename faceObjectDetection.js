document.addEventListener("DOMContentLoaded", function () {
    if (typeof cv === 'undefined') {
        console.error("OpenCV.js is not loaded. Check your script reference.");
        return;
    }
    
    cv['onRuntimeInitialized'] = function () {
        console.log("OpenCV.js is ready!");
        document.getElementById('faceObjectButton').disabled = false; // Enable button after OpenCV loads
        
        document.getElementById('faceObjectButton').addEventListener('click', function() {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
    
            if (!canvas || !ctx) {
                alert("Please upload an image first.");
                return;
            }
    
            console.log("Face & Object detection using OpenCV started...");
    
            // Read image from canvas and convert it to grayscale.
            let src = cv.imread(canvas);
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    
            // Create cascade classifiers for face and object detection.
            let faceCascade = new cv.CascadeClassifier();
            let objectCascade = new cv.CascadeClassifier();
    
            // Specify XML files for the cascade classifiers.
            let faceCascadeFile = 'haarcascade_frontalface_default.xml';
            let objectCascadeFile = 'haarcascade_fullbody.xml';
    
            try {
                faceCascade.load(faceCascadeFile);
                objectCascade.load(objectCascadeFile);
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
    
            // Determine grid positions for the rule of thirds.
            let imgWidth = canvas.width;
            let imgHeight = canvas.height;
            let gridX1 = imgWidth / 3;
            let gridX2 = (imgWidth * 2) / 3;
            let gridY1 = imgHeight / 3;
            let gridY2 = (imgHeight * 2) / 3;
            let tolerance = 0.06 * Math.min(imgWidth, imgHeight);
    
            // Gather detected regions and prioritize faces.
            let detections = [];
            for (let i = 0; i < faces.size(); i++) {
                let face = faces.get(i);
                detections.push({x: face.x, y: face.y, width: face.width, height: face.height, type: 'face'});
            }
    
            for (let i = 0; i < objects.size(); i++) {
                let object = objects.get(i);
                detections.push({x: object.x, y: object.y, width: object.width, height: object.height, type: 'object'});
            }
    
            // Prioritize faces over objects.
            detections.sort((a, b) => a.type === 'face' ? -1 : 1);
    
            // Check each detection against the rule-of-thirds grid.
            let matchFound = false;
            detections.forEach(function(item) {
                let centerX = item.x + item.width / 2;
                let centerY = item.y + item.height / 2;
    
                // Check if the center is near any vertical or horizontal grid line.
                let nearVertical = Math.abs(centerX - gridX1) <= tolerance || Math.abs(centerX - gridX2) <= tolerance;
                let nearHorizontal = Math.abs(centerY - gridY1) <= tolerance || Math.abs(centerY - gridY2) <= tolerance;
    
                if (nearVertical || nearHorizontal) {
                    // Draw a rectangle: red for faces, blue for objects.
                    ctx.strokeStyle = item.type === 'face' ? 'red' : 'blue';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(item.x, item.y, item.width, item.height);
                    matchFound = true;
                }
            });
    
            alert(matchFound ? "Faces/Objects align with Rule of Thirds!" : "No significant alignment found.");
    
            // Free memory.
            src.delete();
            gray.delete();
            faces.delete();
            objects.delete();
        });
    };
});
