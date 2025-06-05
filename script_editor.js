document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfoContainer = document.getElementById('fileInfoContainer');
    const selectedFileName = document.getElementById('selectedFileName');
    const selectedFileSize = document.getElementById('selectedFileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    // Second PDF elements
    const dropAreaSecond = document.getElementById('dropAreaSecond');
    const fileInputSecond = document.getElementById('fileInputSecond');
    const fileInfoContainerSecond = document.getElementById('fileInfoContainerSecond');
    const selectedFileNameSecond = document.getElementById('selectedFileNameSecond');
    const selectedFileSizeSecond = document.getElementById('selectedFileSizeSecond');
    const removeFileSecondBtn = document.getElementById('removeFileSecondBtn');
    const editorControlsContainer = document.getElementById('editorControlsContainer');
    
    const progressContainer = document.getElementById('progressContainer');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressBar = document.getElementById('progressBar');
    const resultsSection = document.getElementById('resultsSection');
    const pdfEditorSection = document.getElementById('pdfEditorSection');
    const customizeToggle = document.getElementById('customizeToggle');
    const customNameContainer = document.getElementById('customNameContainer');
    const customName = document.getElementById('customName');
    const processBtn = document.getElementById('processBtn');
    const qrFileName = document.getElementById('qrFileName');
    const qrFileSize = document.getElementById('qrFileSize');
    const generationDate = document.getElementById('generationDate');
    
    // PDF Editor elements
    const pdfCanvas = document.getElementById('pdfCanvas');
    const qrPreview = document.getElementById('qrPreview');
    const qrPreviewImg = document.getElementById('qrPreviewImg');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const qrSizeSlider = document.getElementById('qrSizeSlider');
    const qrSizeValue = document.getElementById('qrSizeValue');
    const resetPositionBtn = document.getElementById('resetPositionBtn');
    const applyQrBtn = document.getElementById('applyQrBtn');
    
    // PDF and QR variables
    let pdfDoc = null;
    let secondPdfDoc = null; // Para el segundo PDF donde se insertará el QR
    let currentPage = 1;
    let qrImageData = null;
    let qrPosition = { x: 50, y: 50 };
    let qrSize = 100;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let canvasScale = 1;
    let pdfViewport = null; // Guardar viewport para cálculos de coordenadas
    
    // Set current date
    const today = new Date();
    if (generationDate) {
        generationDate.textContent = today.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Drag Drop events for first PDF
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // Drag Drop events for second PDF
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
        dropAreaSecond.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(function(eventName) {
        dropArea.addEventListener(eventName, highlight, false);
        dropAreaSecond.addEventListener(eventName, highlightSecond, false);
    });
    
    ['dragleave', 'drop'].forEach(function(eventName) {
        dropArea.addEventListener(eventName, unhighlight, false);
        dropAreaSecond.addEventListener(eventName, unhighlightSecond, false);
    });
    
    function highlight() {
        dropArea.classList.add('drag-active');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-active');
    }
    
    function highlightSecond() {
        dropAreaSecond.classList.add('drag-active');
    }
    
    function unhighlightSecond() {
        dropAreaSecond.classList.remove('drag-active');
    }
    
    // Handle dropped files for first PDF
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle dropped files for second PDF
    dropAreaSecond.addEventListener('drop', handleDropSecond, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                // Set the file to the input
                fileInput.files = dt.files;
                handleFileSelect(file);
            } else {
                alert('Por favor, sube solo archivos PDF.');
            }
        }
    }
    
    function handleDropSecond(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                // Set the file to the input
                fileInputSecond.files = dt.files;
                handleSecondFileSelect(file);
            } else {
                alert('Por favor, sube solo archivos PDF.');
            }
        }
    }
    
    // Listen for file input changes
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.type === 'application/pdf') {
                handleFileSelect(file);
            } else {
                alert('Por favor, sube solo archivos PDF.');
                this.value = ''; // Clear the input
            }
        }
    });
    
    // Listen for second file input changes
    fileInputSecond.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (file.type === 'application/pdf') {
                handleSecondFileSelect(file);
            } else {
                alert('Por favor, sube solo archivos PDF.');
                this.value = ''; // Clear the input
            }
        }
    });
    
    // Handle file selection
    function handleFileSelect(file) {
        // Display file info
        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = 'Tamaño: ' + formatFileSize(file.size);
        fileInfoContainer.style.display = 'block';
        
        // Update QR file info
        qrFileName.textContent = file.name.replace('.pdf', '.png');
        qrFileSize.textContent = formatFileSize(file.size);
        
        // Hide drop area
        dropArea.style.display = 'none';
        
        // Enable process button
        processBtn.disabled = false;
    }
    
    // Handle second file selection (PDF where QR will be inserted)
    function handleSecondFileSelect(file) {
        // Display file info
        selectedFileNameSecond.textContent = file.name;
        selectedFileSizeSecond.textContent = 'Tamaño: ' + formatFileSize(file.size);
        fileInfoContainerSecond.style.display = 'block';
        
        // Hide drop area
        dropAreaSecond.style.display = 'none';
        
        // Load PDF for editing
        loadSecondPdfForEditing(file);
    }
    
    // Load second PDF for editing
    function loadSecondPdfForEditing(file) {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedArray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                secondPdfDoc = pdf;
                currentPage = 1;
                console.log('PDF destino cargado con', pdf.numPages, 'páginas');
                
                // Show editor controls and render first page
                editorControlsContainer.style.display = 'block';
                renderSecondPdfPage(currentPage);
                
                // Show QR preview if we have QR data
                if (qrImageData) {
                    setupQrPreview();
                }
            }).catch(function(error) {
                console.error('Error cargando PDF destino:', error);
                alert('Error al cargar el PDF destino. Por favor, intenta con otro archivo.');
            });
        };
        fileReader.readAsArrayBuffer(file);
    }
    
    // Render second PDF page (the one where QR will be inserted)
    function renderSecondPdfPage(pageNum) {
        if (!secondPdfDoc) return;
        
        secondPdfDoc.getPage(pageNum).then(function(page) {
            const viewport = page.getViewport({ scale: 1.5 });
            pdfViewport = viewport; // Guardar viewport para cálculos
            
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            
            // Calculate scale for responsive design
            const containerWidth = pdfCanvas.parentElement.clientWidth - 40;
            canvasScale = Math.min(1, containerWidth / viewport.width);
            
            if (canvasScale < 1) {
                pdfCanvas.style.width = (viewport.width * canvasScale) + 'px';
                pdfCanvas.style.height = (viewport.height * canvasScale) + 'px';
            } else {
                pdfCanvas.style.width = viewport.width + 'px';
                pdfCanvas.style.height = viewport.height + 'px';
            }
            
            const renderContext = {
                canvasContext: pdfCanvas.getContext('2d'),
                viewport: viewport
            };
            
            page.render(renderContext).promise.then(function() {
                updatePageInfo();
                updatePageControls();
                resetQrPosition();
                
                console.log('PDF renderizado:', {
                    'Viewport width': viewport.width,
                    'Viewport height': viewport.height,
                    'Canvas scale': canvasScale,
                    'Canvas display width': pdfCanvas.style.width,
                    'Canvas display height': pdfCanvas.style.height
                });
            });
        });
    }
    
    // Update page info
    function updatePageInfo() {
        if (secondPdfDoc) {
            pageInfo.textContent = `Página ${currentPage} de ${secondPdfDoc.numPages}`;
        }
    }
    
    // Update page controls
    function updatePageControls() {
        if (secondPdfDoc) {
            prevPageBtn.disabled = currentPage <= 1;
            nextPageBtn.disabled = currentPage >= secondPdfDoc.numPages;
        }
    }
    
    // Page navigation
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderSecondPdfPage(currentPage);
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (secondPdfDoc && currentPage < secondPdfDoc.numPages) {
            currentPage++;
            renderSecondPdfPage(currentPage);
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (secondPdfDoc && currentPage < secondPdfDoc.numPages) {
            currentPage++;
            renderSecondPdfPage(currentPage);
        }
    });
    
    // Setup QR preview
    function setupQrPreview() {
        if (qrImageData && qrPreviewImg) {
            qrPreviewImg.src = 'https://menuidac.com' + qrImageData.qr_png_url;
            qrPreview.classList.add('visible');
            updateQrPreviewSize();
            updateQrPreviewPosition();
        }
    }
    
    // QR size control
    qrSizeSlider.addEventListener('input', function() {
        qrSize = parseInt(this.value);
        qrSizeValue.textContent = qrSize + 'px';
        updateQrPreviewSize();
    });
    
    // Update QR preview size
    function updateQrPreviewSize() {
        if (qrPreview) {
            qrPreview.style.width = qrSize + 'px';
            qrPreview.style.height = qrSize + 'px';
        }
    }
    
    // Reset QR position
    function resetQrPosition() {
        qrPosition = { x: 50, y: 50 };
        updateQrPreviewPosition();
    }
    
    resetPositionBtn.addEventListener('click', resetQrPosition);
    
    // Update QR preview position
    function updateQrPreviewPosition() {
        if (qrPreview) {
            qrPreview.style.left = qrPosition.x + 'px';
            qrPreview.style.top = qrPosition.y + 'px';
        }
    }
    
    // QR dragging functionality
    qrPreview.addEventListener('mousedown', function(e) {
        isDragging = true;
        const rect = qrPreview.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        qrPreview.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const canvasRect = pdfCanvas.getBoundingClientRect();
            const newX = e.clientX - canvasRect.left - dragOffset.x;
            const newY = e.clientY - canvasRect.top - dragOffset.y;
            
            // Constrain within canvas bounds
            const maxX = canvasRect.width - qrSize;
            const maxY = canvasRect.height - qrSize;
            
            qrPosition.x = Math.max(0, Math.min(newX, maxX));
            qrPosition.y = Math.max(0, Math.min(newY, maxY));
            
            updateQrPreviewPosition();
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            qrPreview.style.cursor = 'move';
        }
    });
    
    // Función para procesar la respuesta de la API
    function procesarRespuestaAPI(datos) {
        if (!datos || !datos.success) {
            alert('Error al procesar el documento: ' + (datos.error || 'Error desconocido'));
            return;
        }
        
        console.log('Documento procesado con éxito. ID:', datos.id_documento);
        
        // Guardar datos del QR
        qrImageData = datos;
        
        // Verificar qué acción realizar
        const selectedAction = document.querySelector('input[name="qrAction"]:checked').value;
        
        if (selectedAction === 'embed') {
            // Mostrar sección para seleccionar segundo PDF
            showPdfSelection();
        } else {
            // Mostrar solo resultados de descarga
            showDownloadResults();
        }
    }
    
    // Mostrar sección para seleccionar segundo PDF
    function showPdfSelection() {
        // Mostrar sección del editor
        pdfEditorSection.style.display = 'block';
        pdfEditorSection.scrollIntoView({ behavior: 'smooth' });
        
        // Si ya hay un segundo PDF cargado, configurar el QR
        if (secondPdfDoc) {
            setupQrPreview();
        }
    }
    
    // Mostrar resultados de descarga
    function showDownloadResults() {
        // Actualizar la información en la sección de resultados
        document.getElementById('qrFileName').textContent = qrImageData.qr_personalizado ? 
            customName.value + '.png' : 
            selectedFileName.textContent.replace('.pdf', '.png');
        
        // Modificar la imagen del QR para mostrar el actual
        const qrImageContainer = document.querySelector('.qr-code');
        qrImageContainer.innerHTML = ''; // Limpiar el contenedor
        
        // Crear una imagen para mostrar el QR
        const qrImg = document.createElement('img');
        qrImg.src = 'https://menuidac.com' + qrImageData.qr_png_url;
        qrImg.alt = 'Código QR generado';
        qrImg.style.width = '200px';
        qrImg.style.height = '200px';
        qrImageContainer.appendChild(qrImg);
        
        // Configurar el botón de descarga
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = function(event) {
            // Prevenir el comportamiento predeterminado
            event.preventDefault();
            
            // Crear un enlace invisible
            const downloadLink = document.createElement('a');
            downloadLink.href = 'https://menuidac.com' + qrImageData.qr_png_url;
            downloadLink.download = qrFileName.textContent; // Usar el nombre que se muestra en la UI
            downloadLink.style.display = 'none';
            
            // Añadir a la página, hacer clic y luego eliminar
            document.body.appendChild(downloadLink);
            downloadLink.click();
            setTimeout(function() {
                document.body.removeChild(downloadLink);
            }, 100);
            
            return false;
        };
        
        // Actualizar la fecha de generación
        const today = new Date();
        document.getElementById('generationDate').textContent = today.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
        
        // Mostrar la sección de resultados
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Aplicar QR al segundo PDF
    applyQrBtn.addEventListener('click', function() {
        if (!qrImageData || !secondPdfDoc) {
            alert('Error: Faltan datos para procesar el PDF. Asegúrate de haber subido el PDF destino.');
            return;
        }
        
        // Mostrar progreso
        progressContainer.style.display = 'block';
        progressPercentage.textContent = '0%';
        progressBar.style.width = '0%';
        
        // Procesar PDF con QR insertado
        insertQrInPdf();
    });
    
    // Función para insertar QR en el PDF usando PDF-lib
    async function insertQrInPdf() {
        try {
            // Actualizar progreso
            updateProgress(10, 'Cargando PDF...');
            
            // Obtener el archivo PDF destino
            const pdfFile = fileInputSecond.files[0];
            const pdfArrayBuffer = await pdfFile.arrayBuffer();
            
            updateProgress(25, 'Procesando PDF...');
            
            // Cargar PDF con PDF-lib
            const pdfLibDoc = await PDFLib.PDFDocument.load(pdfArrayBuffer);
            
            updateProgress(40, 'Descargando código QR...');
            
            // Descargar la imagen del QR
            const qrImageUrl = 'https://menuidac.com' + qrImageData.qr_png_url;
            const qrImageResponse = await fetch(qrImageUrl);
            const qrImageArrayBuffer = await qrImageResponse.arrayBuffer();
            
            updateProgress(60, 'Insertando código QR...');
            
            // Embeber la imagen QR en el PDF
            const qrImage = await pdfLibDoc.embedPng(qrImageArrayBuffer);
            
            // Obtener la página donde insertar el QR (currentPage - 1 porque PDF-lib usa índice 0)
            const pages = pdfLibDoc.getPages();
            const targetPage = pages[currentPage - 1];
            
            if (!targetPage) {
                throw new Error('Página no encontrada');
            }
            
            // Obtener dimensiones originales de la página del PDF
            const { width: pdfPageWidth, height: pdfPageHeight } = targetPage.getSize();
            
            // Calcular las coordenadas correctas
            const coordinates = calculateRealCoordinates(
                qrPosition.x, 
                qrPosition.y, 
                qrSize, 
                pdfPageWidth, 
                pdfPageHeight
            );
            
            console.log('Cálculo de coordenadas:', {
                'QR posición canvas': qrPosition,
                'QR tamaño canvas': qrSize,
                'PDF página tamaño': { width: pdfPageWidth, height: pdfPageHeight },
                'Viewport': pdfViewport ? { width: pdfViewport.width, height: pdfViewport.height } : 'No disponible',
                'Canvas scale': canvasScale,
                'Coordenadas finales': coordinates
            });
            
            updateProgress(80, 'Aplicando cambios...');
            
            // Insertar QR en la página
            targetPage.drawImage(qrImage, {
                x: coordinates.x,
                y: coordinates.y,
                width: coordinates.width,
                height: coordinates.height,
            });
            
            updateProgress(90, 'Generando archivo final...');
            
            // Generar el PDF modificado
            const pdfBytes = await pdfLibDoc.save();
            
            updateProgress(100, 'Completado');
            
            // Crear nombre del archivo
            const originalName = selectedFileNameSecond.textContent;
            const newFileName = originalName.replace('.pdf', '_con_QR.pdf');
            
            // Descargar el archivo
            downloadPdfWithQr(pdfBytes, newFileName);
            
            // Ocultar progreso después de un momento
            setTimeout(function() {
                progressContainer.style.display = 'none';
                alert(`¡PDF con QR generado exitosamente!\\n\\nArchivo: ${newFileName}\\nPágina: ${currentPage}\\nPosición PDF: X:${Math.round(coordinates.x)}, Y:${Math.round(coordinates.y)}\\nTamaño PDF: ${Math.round(coordinates.width)}px\\n\\nPosición Canvas: X:${Math.round(qrPosition.x)}, Y:${Math.round(qrPosition.y)}\\nTamaño Canvas: ${qrSize}px`);
                
                // También mostrar resultados de descarga del QR original
                showDownloadResults();
            }, 1000);
            
        } catch (error) {
            console.error('Error procesando PDF:', error);
            progressContainer.style.display = 'none';
            alert('Error al procesar el PDF: ' + error.message);
        }
    }
    
    // Función para calcular coordenadas reales del PDF
    function calculateRealCoordinates(canvasX, canvasY, canvasSize, pdfPageWidth, pdfPageHeight) {
        if (!pdfViewport) {
            console.warn('Viewport no disponible, usando cálculos aproximados');
            // Fallback si no hay viewport
            return {
                x: (canvasX / canvasScale) / 1.5,
                y: pdfPageHeight - ((canvasY / canvasScale) / 1.5) - ((canvasSize / canvasScale) / 1.5),
                width: (canvasSize / canvasScale) / 1.5,
                height: (canvasSize / canvasScale) / 1.5
            };
        }
        
        // Paso 1: Convertir coordenadas del canvas escalado a coordenadas del viewport
        const viewportX = canvasX / canvasScale;
        const viewportY = canvasY / canvasScale;
        const viewportSize = canvasSize / canvasScale;
        
        // Paso 2: Convertir del viewport (escala 1.5) a coordenadas originales del PDF
        const pdfX = viewportX / 1.5; // viewport tiene escala 1.5
        const pdfY = viewportY / 1.5;
        const pdfSize = viewportSize / 1.5;
        
        // Paso 3: Convertir coordenadas Y (PDF-lib usa origen abajo-izquierda)
        const finalY = pdfPageHeight - pdfY - pdfSize;
        
        return {
            x: pdfX,
            y: finalY,
            width: pdfSize,
            height: pdfSize
        };
    }
    
    // Función para actualizar el progreso
    function updateProgress(percentage, message) {
        progressPercentage.textContent = percentage + '%';
        progressBar.style.width = percentage + '%';
        if (message) {
            // Actualizar el mensaje si hay un elemento para ello
            const progressMessage = document.querySelector('#progressContainer span');
            if (progressMessage) {
                progressMessage.textContent = message;
            }
        }
    }
    
    // Función para descargar el PDF con QR
    function downloadPdfWithQr(pdfBytes, fileName) {
        // Crear blob del PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        // Crear URL temporal
        const url = URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = fileName;
        downloadLink.style.display = 'none';
        
        // Añadir al DOM, hacer clic y limpiar
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Limpiar después de un momento
        setTimeout(function() {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // Función para enviar un PDF a la API y generar QR (compatible con navegadores antiguos)
    function enviarPdfYGenerarQR(archivoPdf, nombrePersonalizado = null) {
        // Mostrar indicador de carga
        progressContainer.style.display = 'block';
        
        // Preparar los datos del formulario
        const formData = new FormData();
        formData.append('carta', archivoPdf);
        
        // Si hay nombre personalizado, añadirlo
        if (nombrePersonalizado) {
            formData.append('nombre_qr_personalizado', nombrePersonalizado);
        }
        
        // Simular progreso para mejorar la experiencia del usuario
        let progreso = 0;
        const intervaloProgreso = setInterval(function() {
            progreso += 5;
            progressPercentage.textContent = progreso + '%';
            progressBar.style.width = progreso + '%';
            
            if (progreso >= 90) {
                clearInterval(intervaloProgreso);
            }
        }, 150);
        
        // Crear una instancia de XMLHttpRequest
        const xhr = new XMLHttpRequest();
        
        // Configurar la solicitud
        xhr.open('POST', 'https://menuidac.com/api/procesar', true);
        
        // Configurar el manejo de la respuesta
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    // Completar el progreso al 100%
                    progressPercentage.textContent = '100%';
                    progressBar.style.width = '100%';
                    
                    // Procesar la respuesta exitosa
                    try {
                        const datos = JSON.parse(xhr.responseText);
                        setTimeout(function() {
                            progressContainer.style.display = 'none';
                            procesarRespuestaAPI(datos);
                        }, 500);
                    } catch (error) {
                        clearInterval(intervaloProgreso);
                        progressContainer.style.display = 'none';
                        alert('Error al procesar la respuesta: ' + error.message);
                        console.error('Error al parsear la respuesta:', error);
                    }
                } else {
                    clearInterval(intervaloProgreso);
                    progressContainer.style.display = 'none';
                    alert('Error en la respuesta de la API: ' + xhr.status + ' ' + xhr.statusText);
                    console.error('Error en la respuesta:', xhr.status, xhr.statusText);
                }
            }
        };
        
        // Manejar errores de red
        xhr.onerror = function() {
            clearInterval(intervaloProgreso);
            progressContainer.style.display = 'none';
            alert('Error de red al conectar con la API');
            console.error('Error de red');
        };
        
        // Enviar la solicitud
        xhr.send(formData);
    }
    
    // Remove selected file
    removeFileBtn.addEventListener('click', function() {
        fileInput.value = ''; // Clear the input
        fileInfoContainer.style.display = 'none';
        dropArea.style.display = 'block';
        processBtn.disabled = true;
        pdfEditorSection.style.display = 'none';
        resultsSection.style.display = 'none';
        pdfDoc = null;
        qrImageData = null;
    });
    
    // Remove second selected file
    removeFileSecondBtn.addEventListener('click', function() {
        fileInputSecond.value = ''; // Clear the input
        fileInfoContainerSecond.style.display = 'none';
        dropAreaSecond.style.display = 'block';
        editorControlsContainer.style.display = 'none';
        secondPdfDoc = null;
        qrPreview.classList.remove('visible');
    });
    
    // Toggle customization
    customizeToggle.addEventListener('change', function() {
        if (this.checked) {
            customNameContainer.style.display = 'block';
        } else {
            customNameContainer.style.display = 'none';
        }
    });
    
    // Update QR file name when custom name changes
    if (customName) {
        customName.addEventListener('input', function() {
            if (this.value) {
                qrFileName.textContent = this.value + '.png';
            } else {
                // Restore original filename but with .png extension
                const originalName = selectedFileName.textContent;
                const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                qrFileName.textContent = baseName + '.png';
            }
        });
    }
    
    // Process button click
    processBtn.addEventListener('click', function() {
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Por favor, selecciona un archivo PDF antes de continuar.');
            return;
        }
        
        // Verificar que el archivo sea un PDF
        const archivoPdf = fileInput.files[0];
        if (archivoPdf.type !== 'application/pdf') {
            alert('El archivo seleccionado no es un PDF. Por favor, selecciona un archivo PDF válido.');
            return;
        }
        
        // Verificar tamaño máximo (5MB según la API)
        const maxTamano = 5 * 1024 * 1024; // 5MB en bytes
        if (archivoPdf.size > maxTamano) {
            alert('El archivo excede el tamaño máximo permitido de 5MB. Por favor, selecciona un archivo más pequeño.');
            return;
        }
        
        // Obtener nombre personalizado si el toggle está activado
        let nombrePersonalizado = null;
        if (customizeToggle.checked && customName.value.trim() !== '') {
            nombrePersonalizado = customName.value.trim();
        }
        
        // Enviar el archivo a la API
        enviarPdfYGenerarQR(archivoPdf, nombrePersonalizado);
    });

    console.log("Script del editor cargado correctamente - usando menuidac.com con doble PDF");
}); 