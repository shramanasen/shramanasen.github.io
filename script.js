document.addEventListener("DOMContentLoaded", () => {
    console.log("Document Loaded. Waiting for OpenCV...");
    
    let opencvLoaded = false;

    function checkOpenCV() {
        if (typeof cv !== "undefined" && cv.getBuildInformation) {
            console.log("✅ OpenCV.js is ready!");
            opencvLoaded = true;
            analyzeBtn.disabled = false; // Enable the analyze button
        } else {
            console.log("⏳ Waiting for OpenCV...");
            setTimeout(checkOpenCV, 100);
        }
    }

    checkOpenCV(); // Start checking for OpenCV

    const imageUpload = document.getElementById("imageUpload");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const canvas = document.getElementById("imageCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const analysisResult = document.getElementById("analysisResult");

    let img = new Image();

    // **Handle Image Upload**
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

    // **Draw Image and Rule of Thirds Grid**
    function drawImageWithGrid() {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        drawRuleOfThirdsGrid(img.width, img.height);
    }

    // **Draw Rule of Thirds Grid**
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

    // **Analyze Bright Spots**
    function analyzeBrightSpots() {
        if (!opencvLoaded) {
            console.error("❌ OpenCV is not loaded yet.");
            return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let brightSpots = [];

        for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            if (brightness > 200) {
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

    // **Analyze Faces using OpenCV.js**
    async function analyzeFaces() {
        if (!opencvLoaded) {
            console.error("❌ OpenCV is not loaded yet.");
            return;
        }

        try {
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let src = cv.matFromImageData(imageData);
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

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
            analysisResult.textContent += facesAligned ? " Faces are well positioned!" : " Faces are not well aligned.";

            cv.imshow('canvasOutput', src);
            src.delete(); gray.delete(); faceCascade.delete(); faces.delete(); msize.delete();
        } catch (err) {
            console.error("Error in analyzeFaces:", err);
        }
    }

    // **Check Rule of Thirds Alignment**
    function checkAlignment(points) {
        const thirdsX = [canvas.width / 3, (2 * canvas.width) / 3];
        const thirdsY = [canvas.height / 3, (2 * canvas.height) / 3];

        return points.some(point =>
            thirdsX.some(x => Math.abs(point.x - x) < 20) &&
            thirdsY.some(y => Math.abs(point.y - y) < 20)
        );
    }

    // **Analyze Image When Button is Clicked**
    analyzeBtn.addEventListener("click", function() {
        if (!img.src) return;
        analyzeBrightSpots();
        analyzeFaces();
    });

});
