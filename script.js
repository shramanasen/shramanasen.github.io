const imageUpload = document.getElementById("imageUpload");
const analyzeBtn = document.getElementById("analyzeBtn");
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true }); // ✅ Fix: Optimize canvas for frequent reads
const analysisResult = document.getElementById("analysisResult");

let img = new Image();

imageUpload.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            img.onload = function() {
                drawImageWithGrid();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function drawImageWithGrid() {
    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Draw rule-of-thirds grid
    drawRuleOfThirdsGrid(img.width, img.height);
}

function drawRuleOfThirdsGrid(width, height) {
    ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
    ctx.lineWidth = 2;

    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(width / 3, 0);
    ctx.lineTo(width / 3, height);
    ctx.moveTo((2 * width) / 3, 0);
    ctx.lineTo((2 * width) / 3, height);

    // Horizontal lines
    ctx.moveTo(0, height / 3);
    ctx.lineTo(width, height / 3);
    ctx.moveTo(0, (2 * height) / 3);
    ctx.lineTo(width, (2 * height) / 3);

    ctx.stroke();
}

// Analyze composition when button is clicked
analyzeBtn.addEventListener("click", function() {
    if (!img.src) return;
    
    analyzeBrightSpots();
    analyzeFaces();
});

// ** 1. Detect Bright Spots **
function analyzeBrightSpots() {
    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true }); // Optimize performance

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let brightSpots = [];

    for (let i = 0; i < data.length; i += 4) {
        // Improved perceived brightness formula
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        if (brightness > 200) { // High brightness threshold
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);
            brightSpots.push({ x, y });
        }
    }

    const aligned = checkAlignment(brightSpots);
    analysisResult.textContent = aligned 
        ? "Bright areas align with rule of thirds!" 
        : "Bright areas do not align well.";
}


async function analyzeFaces(imageData) {
    try {
        // 1. Convert the image data to a cv.Mat object.
        let src = cv.matFromImageData(imageData);

        // 2. Convert the image to grayscale.
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // 3. Check if the grayscale image is empty
        if (gray.empty()) {
            throw new Error("Grayscale image is empty."); // throw custom error
        }

        // 4. Check if the image size is valid.
        if (gray.cols <= 0 || gray.rows <= 0) {
            throw new Error(`Invalid image dimensions: ${gray.cols} x ${gray.rows}`);
        }

        // 5. Load the face detection cascade properly
        let faceCascade = new cv.CascadeClassifier();
        let cascadeFile = 'haarcascade_frontalface_default.xml';

        await new Promise((resolve, reject) => {
            cv.FS_createPreloadedFile(
                "/", cascadeFile, cascadeFile, true, false,
                () => {
                    faceCascade.load(cascadeFile);
                    resolve();
                },
                (err) => reject(new Error("Failed to load Haar cascade"))
            );
        });

        // 6. Detect faces in the image.
        let faces = new cv.RectVector();
        let msize = new cv.Size(30, 30); // Min face size
        faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

        // 7. Store detected face positions for rule-of-thirds check
        let facePositions = [];

        // 8. Loop through faces and draw rectangles around them.
        for (let i = 0; i < faces.size(); ++i) {
            let roi = faces.get(i);
            let point1 = new cv.Point(roi.x, roi.y);
            let point2 = new cv.Point(roi.x + roi.width, roi.y + roi.height);

            // Draw rectangle around face
            cv.rectangle(src, point1, point2, [255, 0, 0, 255], 2);

            // Store face center for alignment check
            facePositions.push({ x: roi.x + roi.width / 2, y: roi.y + roi.height / 2 });
        }

        // 9. Check face alignment with rule-of-thirds
        let facesAligned = checkAlignment(facePositions);
        let alignmentMessage = facesAligned ? " Faces are well positioned!" : " Faces are not well aligned.";

        // 10. Display the image with face detection result
        cv.imshow('canvasOutput', src);
        analysisResult.textContent += alignmentMessage;

        // 11. Free memory
        src.delete();
        gray.delete();
        faceCascade.delete();
        faces.delete();
        msize.delete();
    } catch (err) {
        console.error("Error in analyzeFaces:", err);
    }
}


// ** Helper Function: Check if Points Align with Rule of Thirds **
function checkAlignment(points) {
    const thirdsX = [canvas.width / 3, (2 * canvas.width) / 3];
    const thirdsY = [canvas.height / 3, (2 * canvas.height) / 3];

    return points.some(point =>
        thirdsX.some(x => Math.abs(point.x - x) < 20) &&
        thirdsY.some(y => Math.abs(point.y - y) < 20)
    );
}




