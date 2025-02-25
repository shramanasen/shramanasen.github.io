const imageUpload = document.getElementById("imageUpload");
const analyzeBtn = document.getElementById("analyzeBtn");
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true }); // ✅ Optimize for frequent reads
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

analyzeBtn.addEventListener("click", function() {
    if (!img.src) return;

    analyzeBrightSpots();

    if (canvas.width === 0 || canvas.height === 0) {
        console.error("Canvas is empty! Load an image first.");
        return;
    }

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    console.log("Image Data:", imageData);
    if (!imageData || imageData.width === 0 || imageData.height === 0) {
        console.error("Invalid imageData! Ensure an image is loaded.");
        return;
    }

    analyzeFaces(imageData);
});

// ** Analyze Faces Function (Fixed) **
async function analyzeFaces(imageData) {
    try {
        let src = cv.matFromImageData(imageData);

        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        if (gray.empty()) throw new Error("Grayscale image is empty.");

        let faceCascade = new cv.CascadeClassifier();
        let cascadeFile = 'haarcascade_frontalface_default.xml';

        await new Promise((resolve, reject) => {
            cv.FS_createPreloadedFile("/", cascadeFile, cascadeFile, true, false, () => {
                faceCascade.load(cascadeFile);
                resolve();
            }, (err) => reject(new Error("Failed to load Haar cascade")));
        });

        let faces = new cv.RectVector();
        let msize = new cv.Size(30, 30);
        faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, msize, msize);

        let facePositions = [];

        for (let i = 0; i < faces.size(); ++i) {
            let roi = faces.get(i);
            let point1 = new cv.Point(roi.x, roi.y);
            let point2 = new cv.Point(roi.x + roi.width, roi.y + roi.height);

            cv.rectangle(src, point1, point2, [255, 0, 0, 255], 2);

            facePositions.push({ x: roi.x + roi.width / 2, y: roi.y + roi.height / 2 });
        }

        let facesAligned = checkAlignment(facePositions);
        let alignmentMessage = facesAligned ? " Faces are well positioned!" : " Faces are not well aligned.";

        cv.imshow('canvasOutput', src);
        analysisResult.textContent += alignmentMessage;

        src.delete();
        gray.delete();
        faceCascade.delete();
        faces.delete();
        msize.delete();
    } catch (err) {
        console.error("Error in analyzeFaces:", err);
    }
}

// ** Rule-of-Thirds Check (Fixed) **
function checkAlignment(points) {
    const thirdsX = [canvas.width / 3, (2 * canvas.width) / 3];
    const thirdsY = [canvas.height / 3, (2 * canvas.height) / 3];

    return points.some(point =>
        thirdsX.some(x => Math.abs(point.x - x) < 20) &&
        thirdsY.some(y => Math.abs(point.y - y) < 20)
    );
}



