document.addEventListener('DOMContentLoaded', () => {
    const materialForm = document.getElementById('material-form');
    const warehouseForm = document.getElementById('warehouse-form');
    const valveForm = document.getElementById('valve-form');
    const mainContent = document.getElementById('main-content');
    const materialsContainer = document.getElementById('materials-container');
    const materialDetail = document.getElementById('material-detail');

    // Load materials from localStorage
    let materials = JSON.parse(localStorage.getItem('inventoryMaterials')) || [];

    // Function to save materials to localStorage
    function saveMaterials() {
        localStorage.setItem('inventoryMaterials', JSON.stringify(materials));
    }

    function openSection(sectionName) {
        // Hide all sections
        const allSections = mainContent.querySelectorAll('section');
        allSections.forEach(section => section.classList.add('hidden'));

        // Show the selected section
        const selectedSection = document.getElementById(sectionName);
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
            
            // If opening materials list, refresh the list
            if (sectionName === 'materials-list') {
                renderMaterialsList();
            }

            // If opening orders section, refresh the list
            if (sectionName === 'orders-management') {
                renderOrdersList();
            }
        }
    }

    function renderMaterialsList(filteredMaterials = null) {
        materialsContainer.innerHTML = ''; // Clear existing materials
        
        const materialsToRender = filteredMaterials || materials;
        
        materialsToRender.forEach((material, index) => {
            const materialCard = document.createElement('div');
            materialCard.classList.add('material-card');
            
            // Base details for all materials
            let cardContent = `
                <h3>${material.name}</h3>
                <p>Cantidad: ${material.quantity}</p>
                <p>Tipo: ${material.type}</p>
            `;
            
            // Add valve-specific details if they exist
            if (material.type === 'valve') {
                cardContent += `
                    <p>DN: ${material.dn || 'N/A'}</p>
                    <p>PN: ${material.pn || 'N/A'}</p>
                    <p>KV: ${material.kv || 'N/A'}</p>
                `;
            }
            
            materialCard.innerHTML = cardContent;
            materialCard.addEventListener('click', () => showMaterialDetails(index));
            materialsContainer.appendChild(materialCard);
        });

        // Save after rendering to ensure any changes are persisted
        saveMaterials();
    }

    // Stock Alerts
    const alertsContainer = document.getElementById('alerts-container');
    let stockAlerts = JSON.parse(localStorage.getItem('stockAlerts')) || [];

    function saveStockAlerts() {
        localStorage.setItem('stockAlerts', JSON.stringify(stockAlerts));
    }

    function checkStockAlerts(material) {
        // Check if material is already in alerts
        const existingAlertIndex = stockAlerts.findIndex(
            alert => alert.name === material.name && alert.location === material.location
        );

        // Create alert if quantity is below minimum stock
        if (material.quantity <= material.minStock) {
            if (existingAlertIndex === -1) {
                const newAlert = {
                    name: material.name,
                    currentQuantity: material.quantity,
                    minStock: material.minStock,
                    location: material.location,
                    plant: material.plant,
                    type: material.type
                };
                stockAlerts.push(newAlert);
                saveStockAlerts();
            }
        } else {
            // Remove alert if quantity is now above minimum stock
            if (existingAlertIndex !== -1) {
                stockAlerts.splice(existingAlertIndex, 1);
                saveStockAlerts();
            }
        }

        renderStockAlerts();
    }

    function renderStockAlerts() {
        alertsContainer.innerHTML = ''; // Clear existing alerts

        stockAlerts.forEach((alert, index) => {
            const alertCard = document.createElement('div');
            alertCard.classList.add('stock-alert-card');
            alertCard.innerHTML = `
                <h3>Alerta de Stock Bajo</h3>
                <p><strong>Material:</strong> ${alert.name}</p>
                <p><strong>Cantidad Actual:</strong> ${alert.currentQuantity}</p>
                <p><strong>Stock Mínimo:</strong> ${alert.minStock}</p>
                <p><strong>Ubicación:</strong> ${alert.location}</p>
                <p><strong>Planta:</strong> ${alert.plant}</p>
                <button class="stock-alert-delete" data-index="${index}">Eliminar Alerta</button>
            `;

            // Add delete event listener
            const deleteBtn = alertCard.querySelector('.stock-alert-delete');
            deleteBtn.addEventListener('click', () => {
                stockAlerts.splice(index, 1);
                saveStockAlerts();
                renderStockAlerts();
            });

            alertsContainer.appendChild(alertCard);
        });
    }

    function addMaterial(formData, type) {
        // Create a new material object with default values for optional fields
        const newMaterial = {
            name: type === 'valve' ? formData.valveName : formData.materialName,
            quantity: parseInt(formData.quantity) || 0,
            minStock: parseInt(formData.minStock) || 0,
            location: formData.location || 'No especificado',
            plant: formData.plant || 'No especificado',
            type: type,
            photo: null,
            // Add valve-specific fields
            ...(type === 'valve' && {
                dn: formData.dn || 'No especificado',
                pn: formData.pn || 'No especificado',
                kv: formData.kv || 'No especificado'
            })
        };

        // Only add material if at least the name is provided
        if (newMaterial.name) {
            materials.push(newMaterial);
            renderMaterialsList(); // Update materials list and save
            
            // Check for stock alerts
            checkStockAlerts(newMaterial);
            
            // Reset search input
            if (materialSearch) {
                materialSearch.value = '';
            }
        } else {
            alert('Por favor, ingrese al menos el nombre del material');
        }
    }

    function updateMaterialQuantity(index, newQuantity) {
        materials[index].quantity = newQuantity;
        renderMaterialsList();
        checkStockAlerts(materials[index]);
    }

    function showMaterialDetails(index) {
        const material = materials[index];
        
        document.getElementById('detail-material-name').textContent = material.name;
        document.getElementById('current-quantity').textContent = material.quantity;
        document.getElementById('detail-location').textContent = material.location;
        document.getElementById('detail-plant').textContent = material.plant;
        document.getElementById('detail-min-stock').textContent = material.minStock;
        
        // Add photo upload functionality
        const materialPhotoContainer = document.getElementById('material-photo-container');
        const materialPhotoInput = document.getElementById('material-photo');
        const materialPhotoDisplay = document.getElementById('material-photo-display');

        // Reset previous photo display
        materialPhotoDisplay.innerHTML = '';

        // If material already has a photo, display it
        if (material.photo) {
          const img = document.createElement('img');
          img.src = material.photo;
          img.style.maxWidth = '200px';
          materialPhotoDisplay.appendChild(img);
        }

        // Add event listener for photo upload
        materialPhotoInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              // Save photo to material object
              material.photo = event.target.result;
              
              // Display uploaded photo
              materialPhotoDisplay.innerHTML = '';
              const img = document.createElement('img');
              img.src = event.target.result;
              img.style.maxWidth = '200px';
              materialPhotoDisplay.appendChild(img);
              
              // Update materials in localStorage
              saveMaterials();
            };
            reader.readAsDataURL(file);
          }
        };

        materialDetail.classList.remove('hidden');

        // Remove previous event listeners to prevent multiple attachments
        const decrementBtn = document.getElementById('decrement-btn');
        const incrementBtn = document.getElementById('increment-btn');
        const deleteBtn = document.getElementById('delete-btn');
        
        decrementBtn.onclick = () => {
            if (material.quantity > 0) {
                updateMaterialQuantity(index, material.quantity - 1);
                document.getElementById('current-quantity').textContent = material.quantity;
            }
        };

        incrementBtn.onclick = () => {
            updateMaterialQuantity(index, material.quantity + 1);
            document.getElementById('current-quantity').textContent = material.quantity;
        };

        deleteBtn.onclick = () => {
            // Remove the material from the materials array
            materials.splice(index, 1);
            
            // Update the materials list and save
            renderMaterialsList();
            
            // Hide the material detail view
            materialDetail.classList.add('hidden');
        };

        // Add additional details for valves
        const additionalDetailsContainer = document.getElementById('additional-material-details');
        additionalDetailsContainer.innerHTML = '';
        
        if (material.type === 'valve') {
            const valveDetails = document.createElement('div');
            valveDetails.innerHTML = `
                <p>DN: ${material.dn || 'N/A'}</p>
                <p>PN: ${material.pn || 'N/A'}</p>
                <p>KV: ${material.kv || 'N/A'}</p>
            `;
            additionalDetailsContainer.appendChild(valveDetails);
        }
    }

    // Add search functionality
    const materialSearch = document.getElementById('material-search');
    if (materialSearch) {
        materialSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Filter materials based on search term
            const filteredMaterials = materials.filter(material => 
                material.name.toLowerCase().includes(searchTerm) ||
                material.type.toLowerCase().includes(searchTerm) ||
                material.location.toLowerCase().includes(searchTerm)
            );

            renderMaterialsList(filteredMaterials);
        });
    }

    if (materialForm) {
        materialForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                materialName: document.getElementById('material-input').value,
                quantity: document.getElementById('cantidad-input').value,
                minStock: document.getElementById('stock-minimo-input').value,
                location: document.getElementById('ubicacion-input').value,
                plant: document.getElementById('planta-input').value
            };
            
            addMaterial(formData, 'material');
            materialForm.reset();
        });
    }

    if (warehouseForm) {
        warehouseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                materialName: document.getElementById('material-input').value,
                quantity: document.getElementById('cantidad-input').value,
                minStock: document.getElementById('stock-minimo-input').value,
                location: document.getElementById('ubicacion-input').value,
                plant: document.getElementById('planta-input').value
            };
            
            addMaterial(formData, 'warehouse');
            warehouseForm.reset();
        });
    }

    if (valveForm) {
        valveForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                valveName: document.getElementById('valve-name-input').value,
                quantity: document.getElementById('valve-cantidad-input').value,
                minStock: document.getElementById('valve-stock-minimo-input').value,
                location: document.getElementById('valve-ubicacion-input').value,
                plant: document.getElementById('valve-planta-input').value,
                dn: document.getElementById('valve-dn-input').value,
                pn: document.getElementById('valve-pn-input').value,
                kv: document.getElementById('valve-kv-input').value
            };
            
            addMaterial(formData, 'valve');
            valveForm.reset();
        });
    }

    // Function to trigger photo capture for warehouse
    window.triggerPhotoCapture = () => {
        document.getElementById('warehouse-photo').click();
    }

    // Function to trigger photo capture for valves
    window.triggerValvePhotoCapture = () => {
        document.getElementById('valve-photo').click();
    }

    // Orders Management
    const ordersForm = document.getElementById('orders-form');
    const ordersContainer = document.getElementById('orders-container');
    let orders = JSON.parse(localStorage.getItem('inventoryOrders')) || [];

    function saveOrders() {
        localStorage.setItem('inventoryOrders', JSON.stringify(orders));
    }

    function renderOrdersList(filteredOrders = null) {
        ordersContainer.innerHTML = ''; // Clear existing orders
        
        const ordersToRender = filteredOrders || orders;
        
        ordersToRender.forEach((order, index) => {
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');
            orderCard.innerHTML = `
                <h3>Pedido #${order.orderNumber}</h3>
                <p><strong>Fabricante:</strong> ${order.manufacturer}</p>
                <p><strong>Persona:</strong> ${order.person}</p>
                <p><strong>Ubicación:</strong> ${order.location}</p>
                <p><strong>Cantidad:</strong> ${order.quantity}</p>
                <p><strong>Descripción:</strong> ${order.description}</p>
                ${order.photo ? `<img src="${order.photo}" alt="Foto de Pedido" style="max-width: 200px; max-height: 200px;">` : ''}
                <button class="order-delete" data-index="${index}">Eliminar Pedido</button>
                <input type="file" class="order-photo-input" data-index="${index}" accept="image/*" style="display:none;">
                <button class="order-add-photo" data-index="${index}">Añadir Foto</button>
            `;

            // Add delete event listener
            const deleteBtn = orderCard.querySelector('.order-delete');
            deleteBtn.addEventListener('click', () => {
                // Before deleting, check if we want to add the order to materials
                const shouldAddToMaterials = confirm('¿Desea añadir este pedido a la lista de materiales?');
                
                if (shouldAddToMaterials) {
                    // Add to materials
                    const newMaterial = {
                        name: order.orderNumber,
                        quantity: parseInt(order.quantity) || 0,
                        location: order.location,
                        type: 'pedido',
                        manufacturer: order.manufacturer,
                        description: order.description,
                        minStock: 0, // Default min stock
                        photo: order.photo
                    };
                    
                    materials.push(newMaterial);
                    renderMaterialsList();
                    checkStockAlerts(newMaterial);
                }

                // Remove the order
                orders.splice(index, 1);
                saveOrders();
                renderOrdersList();
            });

            // Add photo event listener
            const photoInput = orderCard.querySelector('.order-photo-input');
            const addPhotoBtn = orderCard.querySelector('.order-add-photo');
            addPhotoBtn.addEventListener('click', () => {
                photoInput.click();
            });

            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        // Update order photo
                        orders[index].photo = event.target.result;
                        
                        // If order is already in materials, update material photo
                        const materialIndex = materials.findIndex(
                            material => material.name === orders[index].orderNumber
                        );
                        
                        if (materialIndex !== -1) {
                            materials[materialIndex].photo = event.target.result;
                        }

                        // Re-render orders and materials lists
                        saveOrders();
                        saveMaterials();
                        renderOrdersList();
                        renderMaterialsList();

                        // Update the image in the order card
                        const img = orderCard.querySelector('img');
                        if (img) {
                            img.src = event.target.result;
                        } else {
                            const newImg = document.createElement('img');
                            newImg.src = event.target.result;
                            newImg.style.maxWidth = '200px';
                            newImg.style.maxHeight = '200px';
                            orderCard.insertBefore(newImg, addPhotoBtn);
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });

            ordersContainer.appendChild(orderCard);
        });

        saveOrders();
    }

    // Add search functionality for orders
    const orderSearch = document.getElementById('order-search');
    if (orderSearch) {
        orderSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            // Filter orders based on search term
            const filteredOrders = orders.filter(order => 
                order.orderNumber.toLowerCase().includes(searchTerm) ||
                order.manufacturer.toLowerCase().includes(searchTerm) ||
                order.person.toLowerCase().includes(searchTerm) ||
                order.location.toLowerCase().includes(searchTerm) ||
                order.description.toLowerCase().includes(searchTerm)
            );

            renderOrdersList(filteredOrders);
        });
    }

    // Function to trigger photo capture for orders
    window.triggerOrderPhotoCapture = () => {
        document.getElementById('order-photo').click();
    }

    if (ordersForm) {
        ordersForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Photo handling
            const orderPhotoInput = document.getElementById('order-photo');
            const orderPhoto = orderPhotoInput.files.length > 0 ? URL.createObjectURL(orderPhotoInput.files[0]) : null;

            const newOrder = {
                orderNumber: document.getElementById('order-number-input').value,
                manufacturer: document.getElementById('order-manufacturer-input').value,
                person: document.getElementById('order-person-input').value,
                location: document.getElementById('order-location-input').value,
                quantity: document.getElementById('order-quantity-input').value,
                description: document.getElementById('order-description-input').value,
                photo: orderPhoto
            };
            
            // Only add order if at least the order number is provided
            if (newOrder.orderNumber) {
                orders.push(newOrder);
                renderOrdersList();
                ordersForm.reset();
            } else {
                alert('Por favor, ingrese al menos el número de pedido');
            }
        });
    }

    // Render initial materials list on page load
    renderMaterialsList();

    // Render stock alerts on page load
    renderStockAlerts();

    // Render initial orders list on page load
    renderOrdersList();

    // Expose openSection to global scope for button clicks
    window.openSection = openSection;

});