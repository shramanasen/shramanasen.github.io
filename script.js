const imageUpload = document.getElementById("imageUpload");
const analyzeBtn = document.getElementById("analyzeBtn");
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
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


// ** 2. Face Detection with OpenCV.js **
function analyzeFaces() {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    const faceCascade = new cv.CascadeClassifier();
    faceCascade.load('haarcascade_frontalface_default.xml');

    const faces = new cv.RectVector();
    const size = new cv.Size(30, 30);
    
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, size, size);
    
    let facesAligned = false;
    for (let i = 0; i < faces.size(); i++) {
        let rect = faces.get(i);
        if (checkAlignment([{ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }])) {
            facesAligned = true;
            break;
        }
    }

    analysisResult.textContent += facesAligned ? " Faces are well positioned!" : " Faces are not well aligned.";

    src.delete(); gray.delete(); faces.delete();
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
