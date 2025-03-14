window.jsPDF = window.jspdf.jsPDF;
        
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const generatePDFBtn = document.getElementById('generatePDF');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const pageSize = document.getElementById('pageSize');
const orientation = document.getElementById('orientation');
const customSizeRow = document.getElementById('customSizeRow');
const customWidth = document.getElementById('customWidth');
const customHeight = document.getElementById('customHeight');
const imageQuality = document.getElementById('imageQuality');
const qualityValue = document.getElementById('qualityValue');
const fitOption = document.getElementById('fitOption');
const sortByUploadBtn = document.getElementById('sortByUpload');
const sortByNameBtn = document.getElementById('sortByName');
const dropHint = document.getElementById('dropHint');

let uploadedImages = [];

// Show/hide custom size inputs
pageSize.addEventListener('change', function() {
    customSizeRow.style.display = this.value === 'custom' ? 'flex' : 'none';
});

// Update quality value display
imageQuality.addEventListener('input', function() {
    qualityValue.textContent = this.value;
});

// Handle file uploads
imageUpload.addEventListener('change', function(event) {
    const files = event.target.files;
    if (files.length > 0) {
        handleImageUpload(files);
    }
});

// Add drag and drop support for the entire preview area
imagePreview.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('drag-over');
});

imagePreview.addEventListener('dragleave', function() {
    this.classList.remove('drag-over');
});

imagePreview.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageUpload(files);
    }
});

// Handle image upload
function handleImageUpload(files) {
    const startIndex = uploadedImages.length;
    
    // Hide the drop hint when images are uploaded
    if (files.length > 0) {
        dropHint.style.display = 'none';
    }
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload only image files.');
            continue;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgObj = {
                data: e.target.result,
                name: file.name,
                uploadOrder: startIndex + i,  // Track upload order
                originalIndex: uploadedImages.length  // Store original index
            };
            uploadedImages.push(imgObj);
            
            // If all files are loaded, refresh the preview
            if (uploadedImages.length === startIndex + files.length) {
                refreshImagePreviews();
            }
        };
        reader.readAsDataURL(file);
    }
    
    generatePDFBtn.disabled = false;
}

// Create image preview
function createImagePreview(imgObj, index) {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = imgObj.data;
    img.alt = imgObj.name;
    
    const nameLabel = document.createElement('div');
    nameLabel.className = 'image-name';
    nameLabel.textContent = imgObj.name;
    
    const sequenceLabel = document.createElement('div');
    sequenceLabel.className = 'sequence';
    sequenceLabel.textContent = index + 1;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = function() {
        uploadedImages.splice(index, 1);
        refreshImagePreviews();
        
        if (uploadedImages.length === 0) {
            generatePDFBtn.disabled = true;
            dropHint.style.display = 'block';
        }
    };
    
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '↕';
    dragHandle.title = 'Drag to reorder';
    
    // Make the preview item draggable
    previewItem.draggable = true;
    
    previewItem.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/plain', index);
        this.style.opacity = '0.4';
    });
    
    previewItem.addEventListener('dragend', function() {
        this.style.opacity = '1';
    });
    
    previewItem.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    previewItem.addEventListener('dragenter', function() {
        this.classList.add('drag-over');
    });
    
    previewItem.addEventListener('dragleave', function() {
        this.classList.remove('drag-over');
    });
    
    previewItem.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;
        
        if (fromIndex !== toIndex) {
            // Reorder the array
            const item = uploadedImages.splice(fromIndex, 1)[0];
            uploadedImages.splice(toIndex, 0, item);
            refreshImagePreviews();
        }
    });
    
    previewItem.appendChild(img);
    previewItem.appendChild(nameLabel);
    previewItem.appendChild(sequenceLabel);
    previewItem.appendChild(removeBtn);
    previewItem.appendChild(dragHandle);
    
    imagePreview.appendChild(previewItem);
}

// Refresh image previews
function refreshImagePreviews() {
    imagePreview.innerHTML = '';
    
    // Add the drop hint back if no images
    if (uploadedImages.length === 0) {
        const hint = document.createElement('div');
        hint.className = 'text-center w-full text-sm opacity-50';
        hint.id = 'dropHint';
        hint.textContent = 'Drag and drop images here or use the Choose Images button';
        imagePreview.appendChild(hint);
    } else {
        uploadedImages.forEach((img, index) => {
            createImagePreview(img, index);
        });
    }
}

// Sort by upload order
sortByUploadBtn.addEventListener('click', function() {
    uploadedImages.sort((a, b) => a.uploadOrder - b.uploadOrder);
    refreshImagePreviews();
});

// Sort by filename
sortByNameBtn.addEventListener('click', function() {
    uploadedImages.sort((a, b) => a.name.localeCompare(b.name));
    refreshImagePreviews();
});

// Generate PDF
generatePDFBtn.addEventListener('click', function() {
    if (uploadedImages.length === 0) {
        alert('Please upload at least one image.');
        return;
    }
    
    generatePDF();
});

// Generate PDF from images
function generatePDF() {
    // Show progress
    progressContainer.style.display = 'block';
    progressBar.value = 0;
    progressText.textContent = 'Processing...';
    
    // Get PDF settings
    const selectedPageSize = pageSize.value;
    const selectedOrientation = orientation.value;
    const quality = parseFloat(imageQuality.value);
    const fit = fitOption.value;
    
    // Set PDF dimensions
    let pdfWidth, pdfHeight;
    switch (selectedPageSize) {
        case 'a4':
            pdfWidth = 210;
            pdfHeight = 297;
            break;
        case 'letter':
            pdfWidth = 215.9;
            pdfHeight = 279.4;
            break;
        case 'legal':
            pdfWidth = 215.9;
            pdfHeight = 355.6;
            break;
        case 'custom':
            pdfWidth = parseFloat(customWidth.value);
            pdfHeight = parseFloat(customHeight.value);
            break;
        default:
            pdfWidth = 210;
            pdfHeight = 297;
    }
    
    // Swap dimensions for landscape orientation
    if (selectedOrientation === 'landscape') {
        [pdfWidth, pdfHeight] = [pdfHeight, pdfWidth];
    }
    
    // Create PDF
    const doc = new jsPDF({
        orientation: selectedOrientation,
        unit: 'mm',
        format: selectedPageSize !== 'custom' ? selectedPageSize : [pdfWidth, pdfHeight]
    });
    
    // Process images
    processImages(doc, pdfWidth, pdfHeight, quality, fit);
}

// Process images and add to PDF
function processImages(doc, pdfWidth, pdfHeight, quality, fit) {
    let currentPage = 0;
    
    function processNextImage() {
        if (currentPage >= uploadedImages.length) {
            // All images processed, save PDF
            doc.save('images.pdf');
            progressContainer.style.display = 'none';
            return;
        }
        
        const img = uploadedImages[currentPage];
        const imgElement = new Image();
        imgElement.src = img.data;
        
        imgElement.onload = function() {
            // Add new page except for the first image
            if (currentPage > 0) {
                doc.addPage();
            }
            
            // Calculate image dimensions based on fit option
            let imgWidth = imgElement.width;
            let imgHeight = imgElement.height;
            let x = 0;
            let y = 0;
            
            if (fit === 'contain') {
                // Scale to fit within page while maintaining aspect ratio
                const pageRatio = pdfWidth / pdfHeight;
                const imageRatio = imgWidth / imgHeight;
                
                if (imageRatio > pageRatio) {
                    // Image is wider than page proportion
                    imgWidth = pdfWidth;
                    imgHeight = imgWidth / imageRatio;
                    y = (pdfHeight - imgHeight) / 2;
                } else {
                    // Image is taller than page proportion
                    imgHeight = pdfHeight;
                    imgWidth = imgHeight * imageRatio;
                    x = (pdfWidth - imgWidth) / 2;
                }
            } else if (fit === 'cover') {
                // Scale to cover entire page while maintaining aspect ratio
                const pageRatio = pdfWidth / pdfHeight;
                const imageRatio = imgWidth / imgHeight;
                
                if (imageRatio > pageRatio) {
                    // Image is wider than page proportion
                    imgHeight = pdfHeight;
                    imgWidth = imgHeight * imageRatio;
                    x = (pdfWidth - imgWidth) / 2;
                } else {
                    // Image is taller than page proportion
                    imgWidth = pdfWidth;
                    imgHeight = imgWidth / imageRatio;
                    y = (pdfHeight - imgHeight) / 2;
                }
            } else {
                // Original size - center on page
                // Convert pixel dimensions to mm at 72 DPI
                imgWidth = imgWidth * 25.4 / 72;
                imgHeight = imgHeight * 25.4 / 72;
                
                // Center image on page
                x = (pdfWidth - imgWidth) / 2;
                y = (pdfHeight - imgHeight) / 2;
                
                // If image is larger than page, scale it down
                if (imgWidth > pdfWidth || imgHeight > pdfHeight) {
                    const scaleX = pdfWidth / imgWidth;
                    const scaleY = pdfHeight / imgHeight;
                    const scale = Math.min(scaleX, scaleY);
                    
                    imgWidth *= scale;
                    imgHeight *= scale;
                    x = (pdfWidth - imgWidth) / 2;
                    y = (pdfHeight - imgHeight) / 2;
                }
            }
            
            // Add image to PDF
            doc.addImage(
                img.data,
                'JPEG',
                x,
                y,
                imgWidth,
                imgHeight,
                undefined,
                'FAST',
                0
            );
            
            // Update progress
            currentPage++;
            const progress = Math.round((currentPage / uploadedImages.length) * 100);
            progressBar.value = progress;
            progressText.textContent = `Processing ${currentPage}/${uploadedImages.length} (${progress}%)`;
            
            // Process next image
            setTimeout(processNextImage, 0);
        };
    }
    
    // Start processing
    processNextImage();
}