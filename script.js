let selectedImage = null;
let cvReady = false; // Flag to ensure OpenCV is loaded before processing

function cvLoaded() {
    cvReady = true;
    document.getElementById('opencvStatus').textContent = "✅ OpenCV.js Loaded!";
}

function cvFailed() {
    document.getElementById('opencvStatus').textContent = "❌ Failed to load OpenCV.js. Try refreshing the page.";
}

document.getElementById('imageUpload').addEventListener('change', function(event) {
    let file = event.target.files[0];
    if (!file) return;

    let img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = function () {
        selectedImage = img;
        drawImageOnCanvas(img);
        document.getElementById('analyzeButton').disabled = false;
    };
});

document.getElementById('analyzeButton').addEventListener('click', function() {
    if (!cvReady) {
        alert("OpenCV.js is still loading. Please wait...");
        return;
    }
    if (selectedImage) {
        processImage();
    }
});

function drawImageOnCanvas(img) {
    let canvas = document.getElementById('imageCanvas');
    let ctx = canvas.getContext('2d');

    // Set a fixed canvas size for better display
    canvas.width = 400;
    canvas.height = (img.height / img.width) * 400; // Maintain aspect ratio

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function processImage() {
    let canvas = document.getElementById('imageCanvas');
    let src = cv.imread(canvas);

    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    let keyPoints = detectKeyObjects(gray);
    let heatmap = generateSaliencyMap(src);
    let brightnessMap = analyzeBrightness(src);

    drawRuleOfThirdsGrid(canvas);

    let confidence = evaluateComposition(keyPoints, heatmap, brightnessMap, canvas.width, canvas.height);
    displayResult(confidence);

    // Cleanup to avoid memory leaks
    src.delete();
    gray.delete();
}

function detectKeyObjects(gray) {
    let faces = new cv.RectVector();
    let classifier = new cv.CascadeClassifier();
    classifier.load('haarcascade_frontalface_default.xml'); // Ensure this file is available

    classifier.detectMultiScale(gray, faces);

    let keyPoints = [];
    for (let i = 0; i < faces.size(); i++) {
        let rect = faces.get(i);
        keyPoints.push({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
    }

    faces.delete();
    classifier.delete();
    return keyPoints;
}

function generateSaliencyMap(src) {
    let saliency = new cv.Mat();
    let saliencyDetector = new cv.Saliency.StaticSaliencySpectralResidual();
    saliencyDetector.computeSaliency(src, saliency);

    let heatmap = [];
    for (let y = 0; y < saliency.rows; y++) {
        for (let x = 0; x < saliency.cols; x++) {
            let intensity = saliency.ucharAt(y, x);
            if (intensity > 150) {
                heatmap.push({ x, y });
            }
        }
    }

    saliency.delete();
    return heatmap;
}

function analyzeBrightness(src) {
    let brightnessMap = [];
    for (let y = 0; y < src.rows; y++) {
        for (let x = 0; x < src.cols; x++) {
            let pixel = src.ucharPtr(y, x);
            let brightness = (pixel[0] + pixel[1] + pixel[2]) / 3;
            if (brightness > 200) {
                brightnessMap.push({ x, y });
            }
        }
    }
    return brightnessMap;
}

function drawRuleOfThirdsGrid(canvas) {
    let ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;

    let thirdsX = [canvas.width / 3, (2 * canvas.width) / 3];
    let thirdsY = [canvas.height / 3, (2 * canvas.height) / 3];

    thirdsX.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    });

    thirdsY.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    });
}

function evaluateComposition(keyPoints, heatmap, brightnessMap, width, height) {
    let gridPoints = [
        { x: width / 3, y: height / 3 }, { x: (2 * width) / 3, y: height / 3 },
        { x: width / 3, y: (2 * height) / 3 }, { x: (2 * width) / 3, y: (2 * height) / 3 }
    ];

    let score = 0;
    let threshold = width * 0.1; // 10% of width

    function isNearRuleOfThirds(point) {
        return gridPoints.some(gridPoint =>
            Math.hypot(point.x - gridPoint.x, point.y - gridPoint.y) < threshold
        );
    }

    keyPoints.forEach(point => {
        if (isNearRuleOfThirds(point)) score += 2;
    });

    heatmap.forEach(point => {
        if (isNearRuleOfThirds(point)) score += 1;
    });

    brightnessMap.forEach(point => {
        if (isNearRuleOfThirds(point)) score += 0.5;
    });

    return Math.min((score / 10) * 100, 100);
}

function displayResult(confidence) {
    let resultText = confidence > 70 ?
        `✅ Good composition! (${confidence.toFixed(1)}% confidence)` :
        `⚠️ Consider repositioning elements. (${confidence.toFixed(1)}% confidence)`;

    document.getElementById('analysisResult').textContent = resultText;
}
