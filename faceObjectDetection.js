document.getElementById('faceObjectButton').addEventListener('click', async function() {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');

    if (!canvas || !ctx) {
        alert("Please upload an image first.");
        return;
    }

    console.log("Face & Object detection using OpenCV started...");

    // Ensure OpenCV.js is loaded
    if (typeof cv === 'undefined') {
        alert("OpenCV.js is not loaded. Please check your script reference.");
        return;
    }

    // ✅ Read image directly from the canvas
    let src = cv.imread(canvas);

    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    let faceCascade = new cv.CascadeClassifier();
    let objectCascade = new cv.CascadeClassifier();

    // Load Haar cascades (Ensure they are hosted properly)
    let faceCascadeFile = 'https://shramanasen.github.io/haarcascade_frontalface_default.xml';
    let objectCascadeFile = 'https://shramanasen.github.io/haarcascade_fullbody.xml';

    try {
        faceCascade.load(faceCascadeFile);
        objectCascade.load(objectCascadeFile);
    } catch (error) {
        console.error("Failed to load XML files:", error);
        alert("Error loading face/object detection models.");
        return;
    }

    let faces = new cv.RectVector();
    let objects = new cv.RectVector();
    let msize = new cv.Size(100, 100);

    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, new cv.Size());
    objectCascade.detectMultiScale(gray, objects, 1.1, 3, 0, msize, new cv.Size());

    let imgWidth = canvas.width;
    let imgHeight = canvas.height;
    let gridSpacingX = imgWidth / 3;
    let gridSpacingY = imgHeight / 3;
    let tolerance = 0.06 * Math.min(imgWidth, imgHeight);

    let prioritized = [];
    for (let i = 0; i < faces.size(); i++) {
        let face = faces.get(i);
        prioritized.push({ x: face.x, y: face.y, width: face.width, height: face.height, type: 'face' });
    }

    for (let i = 0; i < objects.size(); i++) {
        let object = objects.get(i);
        prioritized.push({ x: object.x, y: object.y, width: object.width, height: object.height, type: 'object' });
    }

    // Sort to prioritize faces over other objects
    prioritized.sort((a, b) => (a.type === 'face' ? -1 : 1));

    let matchFound = false;
    prioritized.forEach((obj) => {
        let centerX = obj.x + obj.width / 2;
        let centerY = obj.y + obj.height / 2;

        let nearGridX = [gridSpacingX, gridSpacingX * 2].some(pos => Math.abs(centerX - pos) <= tolerance);
        let nearGridY = [gridSpacingY, gridSpacingY * 2].some(pos => Math.abs(centerY - pos) <= tolerance);

        if (nearGridX && nearGridY) {
            ctx.strokeStyle = obj.type === 'face' ? 'red' : 'blue';
            ctx.lineWidth = 3;
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
            matchFound = true;
        }
    });

    alert(matchFound ? "Faces/Objects align with Rule of Thirds!" : "No significant alignment found.");

    src.delete();
    gray.delete();
    faces.delete();
    objects.delete();
});
