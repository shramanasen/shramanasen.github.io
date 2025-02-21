{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;\f1\fnil\fcharset0 AppleColorEmoji;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 document.getElementById("imageInput").addEventListener("change", function (event) \{\
    const file = event.target.files[0];\
    if (file) \{\
        const reader = new FileReader();\
        reader.onload = function (e) \{\
            const img = new Image();\
            img.onload = function () \{\
                drawImageWithGrid(img);\
                analyzeComposition(img);\
            \};\
            img.src = e.target.result;\
        \};\
        reader.readAsDataURL(file);\
    \}\
\});\
\
function drawImageWithGrid(img) \{\
    const imageCanvas = document.getElementById("imageCanvas");\
    const gridCanvas = document.getElementById("gridCanvas");\
\
    const ctxImage = imageCanvas.getContext("2d");\
    const ctxGrid = gridCanvas.getContext("2d");\
\
    imageCanvas.width = gridCanvas.width = img.width;\
    imageCanvas.height = gridCanvas.height = img.height;\
\
    ctxImage.clearRect(0, 0, imageCanvas.width, imageCanvas.height);\
    ctxImage.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);\
\
    ctxGrid.clearRect(0, 0, gridCanvas.width, gridCanvas.height);\
    ctxGrid.strokeStyle = "rgba(255, 0, 0, 0.7)";\
    ctxGrid.lineWidth = 2;\
\
    const w = imageCanvas.width;\
    const h = imageCanvas.height;\
\
    for (let i = 1; i <= 2; i++) \{\
        let x = (w / 3) * i;\
        ctxGrid.beginPath();\
        ctxGrid.moveTo(x, 0);\
        ctxGrid.lineTo(x, h);\
        ctxGrid.stroke();\
    \}\
\
    for (let i = 1; i <= 2; i++) \{\
        let y = (h / 3) * i;\
        ctxGrid.beginPath();\
        ctxGrid.moveTo(0, y);\
        ctxGrid.lineTo(w, y);\
        ctxGrid.stroke();\
    \}\
\
    ctxGrid.fillStyle = "rgba(0, 255, 0, 0.7)";\
    const dotSize = 6;\
    for (let i = 1; i <= 2; i++) \{\
        for (let j = 1; j <= 2; j++) \{\
            let x = (w / 3) * i;\
            let y = (h / 3) * j;\
            ctxGrid.beginPath();\
            ctxGrid.arc(x, y, dotSize, 0, Math.PI * 2);\
            ctxGrid.fill();\
        \}\
    \}\
\}\
\
function analyzeComposition(img) \{\
    const canvas = document.getElementById("imageCanvas");\
    const ctx = canvas.getContext("2d");\
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);\
    const data = imageData.data;\
\
    let brightnessMap = [];\
    for (let y = 0; y < canvas.height; y++) \{\
        for (let x = 0; x < canvas.width; x++) \{\
            const index = (y * canvas.width + x) * 4;\
            const r = data[index];\
            const g = data[index + 1];\
            const b = data[index + 2];\
            const brightness = (r + g + b) / 3;\
            brightnessMap.push(\{ x, y, brightness \});\
        \}\
    \}\
\
    brightnessMap.sort((a, b) => b.brightness - a.brightness);\
    const topBrightest = brightnessMap.slice(0, 10);\
\
    const ruleOfThirdsPoints = [\
        \{ x: canvas.width / 3, y: canvas.height / 3 \},\
        \{ x: (canvas.width / 3) * 2, y: canvas.height / 3 \},\
        \{ x: canvas.width / 3, y: (canvas.height / 3) * 2 \},\
        \{ x: (canvas.width / 3) * 2, y: (canvas.height / 3) * 2 \}\
    ];\
\
    let matchCount = 0;\
    const threshold = 50; \
\
    topBrightest.forEach(point => \{\
        ruleOfThirdsPoints.forEach(gridPoint => \{\
            const distance = Math.sqrt(\
                Math.pow(point.x - gridPoint.x, 2) + Math.pow(point.y - gridPoint.y, 2)\
            );\
            if (distance < threshold) \{\
                matchCount++;\
            \}\
        \});\
    \});\
\
    const feedback = document.getElementById("feedback");\
    if (matchCount >= 2) \{\
        feedback.textContent = "
\f1 \uc0\u9989 
\f0  The image follows the Rule of Thirds!";\
        feedback.style.color = "green";\
    \} else \{\
        feedback.textContent = "
\f1 \uc0\u10060 
\f0  The image does not strongly follow the Rule of Thirds.";\
        feedback.style.color = "red";\
    \}\
\}\
}