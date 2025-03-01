document.getElementById('imageInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            
            // Set maximum dimensions
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;
            
            // Scale down if needed, preserving aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const widthRatio = maxWidth / width;
                const heightRatio = maxHeight / height;
                const scale = Math.min(widthRatio, heightRatio);
                width = width * scale;
                height = height * scale;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
});
