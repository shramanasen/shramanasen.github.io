document.getElementById('evaluateAllButton').addEventListener('click', function() {
    console.log("Running all analyses...");
    
    document.getElementById('heatmapButton').click();
    document.getElementById('faceObjectButton').click();
    document.getElementById('brightnessContrastButton').click();
    
    alert("All analyses completed (dummy implementation).");
});
