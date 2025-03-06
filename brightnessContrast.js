document.getElementById('brightnessContrastButton').addEventListener('click', function() {
    const canvas = document.getElementById('imageCanvas');
    // Use willReadFrequently to improve performance when reading canvas pixel data frequently.
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!canvas || !ctx) {
        alert("Please upload an image first.");
        return;
    }
    
    // Read the image from the canvas into an OpenCV Mat
    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    // Convert image to grayscale for contrast analysis
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Detect edges using Canny detector (high contrast regions)
    let edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);
    
    // Detect lines using the Probabilistic Hough Transform
    let lines = new cv.Mat();
    // Parameters: image, output lines, rho, theta, threshold, minLineLength, maxLineGap
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);
    
    // Create an output image to draw results (copy original)
    let output = src.clone();
    let width = canvas.width;
    let height = canvas.height;
    
    // Draw the rule-of-thirds grid lines (green)
    let gridColor = new cv.Scalar(0, 255, 0, 255);
    let gridThickness = 1;
    // Vertical lines
    cv.line(output, new cv.Point(Math.round(width / 3), 0), new cv.Point(Math.round(width / 3), height), gridColor, gridThickness);
    cv.line(output, new cv.Point(Math.round(2 * width / 3), 0), new cv.Point(Math.round(2 * width / 3), height), gridColor, gridThickness);
    // Horizontal lines
    cv.line(output, new cv.Point(0, Math.round(height / 3)), new cv.Point(width, Math.round(height / 3)), gridColor, gridThickness);
    cv.line(output, new cv.Point(0, Math.round(2 * height / 3)), new cv.Point(width, Math.round(2 * height / 3)), gridColor, gridThickness);
    
    // Define tolerance (in pixels) for matching lines to the rule-of-thirds guidelines
    let guidelineTolerance = 10;
    let linesAligned = 0;
    
    // Loop through detected lines and check alignment with guideline positions
    for (let i = 0; i < lines.rows; ++i) {
        let x1 = lines.data32S[i * 4];
        let y1 = lines.data32S[i * 4 + 1];
        let x2 = lines.data32S[i * 4 + 2];
        let y2 = lines.data32S[i * 4 + 3];
        
        // Check for near-vertical guideline alignment:
        let nearVertical = (Math.abs(x1 - width / 3) < guidelineTolerance && Math.abs(x2 - width / 3) < guidelineTolerance) ||
                           (Math.abs(x1 - 2 * width / 3) < guidelineTolerance && Math.abs(x2 - 2 * width / 3) < guidelineTolerance);
        // Check for near-horizontal guideline alignment:
        let nearHorizontal = (Math.abs(y1 - height / 3) < guidelineTolerance && Math.abs(y2 - height / 3) < guidelineTolerance) ||
                             (Math.abs(y1 - 2 * height / 3) < guidelineTolerance && Math.abs(y2 - 2 * height / 3) < guidelineTolerance);
        
        // If the line is close to a guideline, count it and draw in red; else, draw in blue.
        if (nearVertical || nearHorizontal) {
            cv.line(output, new cv.Point(x1, y1), new cv.Point(x2, y2), new cv.Scalar(255, 0, 0, 255), 2);
            linesAligned++;
        } else {
            cv.line(output, new cv.Point(x1, y1), new cv.Point(x2, y2), new cv.Scalar(0, 0, 255, 255), 1);
        }
    }
    
    // Display the result on the canvas
    cv.imshow(canvas, output);
    
    // Cleanup memory
    src.delete();
    gray.delete();
    edges.delete();
    lines.delete();
    output.delete();
    
    // Provide feedback based on rule-of-thirds alignment detection
    if (linesAligned > 0) {
        alert("High contrast regions align with the rule-of-thirds guidelines.");
    } else {
        alert("No significant rule-of-thirds alignment detected in high contrast regions.");
    }
});
