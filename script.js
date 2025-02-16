// script.js

function openLightbox(image) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightbox.style.display = 'flex';
    lightboxImg.src = image.src;
}

function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}
