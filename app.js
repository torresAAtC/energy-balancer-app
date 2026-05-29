// ========== BASE DE DATOS OFICIAL (Energy Star) ==========
const officialDatabase = {
    refrigerators: [
        { brand: "LG", model: "LFXS28968", watts: 185, category: "Refrigerador", type: "refrigerator", source: "official" },
        { brand: "Samsung", model: "RF28R7351", watts: 178, category: "Refrigerador", type: "refrigerator", source: "official" },
        { brand: "Whirlpool", model: "WRF535SWHZ", watts: 195, category: "Refrigerador", type: "refrigerator", source: "official" },
        { brand: "GE", model: "GSE25GSHSS", watts: 190, category: "Refrigerador", type: "refrigerator", source: "official" }
    ],
    washingMachines: [
        { brand: "LG", model: "WM4000HBA", watts: 250, category: "Lavadora", type: "washing", source: "official" },
        { brand: "Samsung", model: "WW22K6800AW", watts: 240, category: "Lavadora", type: "washing", source: "official" },
        { brand: "Whirlpool", model: "WTW7120HW", watts: 260, category: "Lavadora", type: "washing", source: "official" },
        { brand: "Bosch", model: "WAW285H2UC", watts: 230, category: "Lavadora", type: "washing", source: "official" }
    ],
    dryers: [
        { brand: "LG", model: "DLE7300WE", watts: 3200, category: "Secadora", type: "dryer", source: "official" },
        { brand: "Samsung", model: "DVE45R6100", watts: 3100, category: "Secadora", type: "dryer", source: "official" },
        { brand: "Whirlpool", model: "WED5620HW", watts: 3150, category: "Secadora", type: "dryer", source: "official" }
    ],
    tvs: [
        { brand: "Samsung", model: "QN55Q80T", watts: 120, category: "TV", type: "tv", source: "official" },
        { brand: "LG", model: "OLED55CXPUA", watts: 135, category: "TV", type: "tv", source: "official" },
        { brand: "Sony", model: "XBR-55X900H", watts: 125, category: "TV", type: "tv", source: "official" },
        { brand: "TCL", model: "55S435", watts: 90, category: "TV", type: "tv", source: "official" }
    ],
    computers: [
        { brand: "Dell", model: "Inspiron", watts: 65, category: "Computadora", type: "computer", source: "official" },
        { brand: "HP", model: "Pavilion", watts: 70, category: "Computadora", type: "computer", source: "official" },
        { brand: "Apple", model: "Mac Mini", watts: 45, category: "Computadora", type: "computer", source: "official" },
        { brand: "Lenovo", model: "ThinkCentre", watts: 55, category: "Computadora", type: "computer", source: "official" }
    ],
    commonAppliances: [
        { brand: "Generic", model: "Microwave", watts: 1000, category: "Microondas", type: "other", source: "official" },
        { brand: "Generic", model: "Dishwasher", watts: 1200, category: "Lavavajillas", type: "other", source: "official" },
        { brand: "Generic", model: "LED Bulb", watts: 9, category: "Bombilla LED", type: "lighting", source: "official" },
        { brand: "Generic", model: "Ceiling Fan", watts: 50, category: "Ventilador", type: "other", source: "official" },
        { brand: "Generic", model: "Vacuum Cleaner", watts: 1400, category: "Aspiradora", type: "other", source: "official" }
    ]
};

// ========== TARIFA PROGRESIVA CUBA ==========
const energyRates = [
    { min: 0, max: 100, rate: 0.33 },
    { min: 101, max: 150, rate: 1.07 },
    { min: 151, max: 200, rate: 1.43 },
    { min: 201, max: 250, rate: 2.46 },
    { min: 251, max: 300, rate: 3.00 },
    { min: 301, max: 350, rate: 4.00 },
    { min: 351, max: 400, rate: 5.00 },
    { min: 401, max: 450, rate: 6.00 },
    { min: 451, max: 500, rate: 7.00 },
    { min: 501, max: 600, rate: 11.50 },
    { min: 601, max: 700, rate: 11.81 },
    { min: 701, max: 1000, rate: 12.31 },
    { min: 1001, max: 1800, rate: 13.50 },
    { min: 1801, max: 2600, rate: 14.75 },
    { min: 2601, max: 3400, rate: 16.13 },
    { min: 3401, max: 4200, rate: 17.44 },
    { min: 4201, max: 5000, rate: 18.75 },
    { min: 5001, max: Infinity, rate: 25.00 }
];

// ========== VARIABLES GLOBALES ==========
let userDevices = [];
let communityAppliances = [];

// ========== FUNCIONES DE CÁLCULO ==========
function calculateProgressiveCost(monthlyKWh) {
    let remainingKWh = monthlyKWh;
    let totalCost = 0;
    
    for (const rate of energyRates) {
        if (remainingKWh <= 0) break;
        const rangeKWh = rate.max - rate.min + 1;
        const applicableKWh = Math.min(remainingKWh, rangeKWh);
        totalCost += applicableKWh * rate.rate;
        remainingKWh -= applicableKWh;
    }
    return totalCost;
}

// ========== FUNCIONES DE LOCALSTORAGE ==========
function loadSavedData() {
    const saved = localStorage.getItem('energyBalancer_devices');
    if (saved) {
        userDevices = JSON.parse(saved);
        renderDevices();
        updateBalance();
    }
}

function saveDevices() {
    localStorage.setItem('energyBalancer_devices', JSON.stringify(userDevices));
}

// ========== FUNCIONES DE FIREBASE ==========
async function loginAnonymously() {
    try {
        const result = await auth.signInAnonymously();
        currentUserId = result.user.uid;
        localStorage.setItem('firebase_userId', currentUserId);
        console.log("Usuario conectado:", currentUserId);
        return currentUserId;
    } catch (error) {
        console.error("Error de autenticación:", error);
        return null;
    }
}

async function syncCommunityAppliances() {
    return new Promise((resolve) => {
        communityDB.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const appliances = Object.values(data);
                localStorage.setItem('community_db_cache', JSON.stringify(appliances));
                communityAppliances = appliances;
                resolve(appliances);
            } else {
                resolve([]);
            }
        });
    });
}

async function addToCommunityDatabase(appliance) {
    const key = `${appliance.brand}_${appliance.model}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const snapshot = await communityDB.child(key).once('value');
    
    if (snapshot.exists()) {
        const existing = snapshot.val();
        if (!existing.voters || !existing.voters.includes(currentUserId)) {
            const newVotes = (existing.votes || 0) + 1;
            await communityDB.child(key).update({
                votes: newVotes,
                voters: [...(existing.voters || []), currentUserId],
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true, updated: true, votes: newVotes };
        }
        return { success: false, message: "Ya votaste por este equipo" };
    } else {
        await communityDB.child(key).set({
            ...appliance,
            source: "community",
            votes: 1,
            voters: [currentUserId],
            addedBy: currentUserId,
            addedAt: firebase.database.ServerValue.TIMESTAMP
        });
        return { success: true, new: true, votes: 1 };
    }
}

async function voteForCommunityDevice(brand, model) {
    const key = `${brand}_${model}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const snapshot = await communityDB.child(key).once('value');
    
    if (snapshot.exists()) {
        const appliance = snapshot.val();
        if (!appliance.voters || !appliance.voters.includes(currentUserId)) {
            const newVotes = (appliance.votes || 0) + 1;
            await communityDB.child(key).update({
                votes: newVotes,
                voters: [...(appliance.voters || []), currentUserId],
                lastUpdated: firebase.database.ServerValue.TIMESTAMP
            });
            return { success: true, votes: newVotes };
        }
        return { success: false, message: "Ya votaste por este equipo" };
    }
    return { success: false, message: "Equipo no encontrado" };
}

async function saveUserDevicesToCloud(devices) {
    if (!currentUserId) return;
    await usersDB.child(currentUserId).child('devices').set(devices);
    await usersDB.child(currentUserId).child('lastSync').set(firebase.database.ServerValue.TIMESTAMP);
}

async function loadUserDevicesFromCloud() {
    if (!currentUserId) return [];
    const snapshot = await usersDB.child(currentUserId).child('devices').once('value');
    return snapshot.val() || [];
}

// ========== FUNCIONES DE BÚSQUEDA ==========
function getAllAppliances() {
    const official = [
        ...officialDatabase.refrigerators,
        ...officialDatabase.washingMachines,
        ...officialDatabase.dryers,
        ...officialDatabase.tvs,
        ...officialDatabase.computers,
        ...officialDatabase.commonAppliances
    ];
    
    const all = [...official, ...communityAppliances];
    return all.sort((a, b) => {
        if (a.source === 'official' && b.source !== 'official') return -1;
        if (a.source !== 'official' && b.source === 'official') return 1;
        if (a.votes && b.votes) return b.votes - a.votes;
        return 0;
    });
}

async function performSearch() {
    const brand = document.getElementById('brandInput').value.trim();
    const model = document.getElementById('modelInput').value.trim();
    
    if (!brand) {
        alert('Por favor ingresa al menos la marca del equipo');
        return;
    }
    
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<div class="loading">Buscando en Energy Star + Base de datos comunitaria...</div>';
    
    const allAppliances = getAllAppliances();
    const results = allAppliances.filter(item => 
        item.brand.toLowerCase().includes(brand.toLowerCase()) &&
        (model === "" || item.model.toLowerCase().includes(model.toLowerCase()))
    );
    
    if (results.length === 0) {
        resultsDiv.innerHTML = `
            <div class="result-item">
                <div class="result-info">
                    <h4>No se encontraron resultados</h4>
                    <p>Prueba a buscar con otra marca o usa el formulario manual.</p>
                </div>
            </div>
        `;
        return;
    }
    
    resultsDiv.innerHTML = results.map(result => `
        <div class="result-item">
            <div class="result-info">
                <h4>${result.brand} ${result.model}</h4>
                <p>Categoría: ${result.category} | Consumo: ${result.watts} Watts</p>
                ${result.source === 'community' ? `<p class="community-badge">👥 Comunidad • 👍 ${result.votes || 0} votos</p>` : '<p class="official-badge">✓ Energy Star certified</p>'}
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <input type="number" id="hours_${(result.brand + result.model).replace(/[\s\W]/g, '')}" 
                       placeholder="Horas/día" value="1" step="0.5" 
                       style="width: 100px; padding: 5px;">
                <button class="btn btn-primary" onclick="addDeviceFromSearch('${result.brand.replace(/'/g, "\\'")}', '${result.model.replace(/'/g, "\\'")}', ${result.watts}, '${result.category}', '${result.type}')">
                    Agregar
                </button>
                ${result.source === 'community' ? `
                    <button class="btn btn-outline" style="padding: 5px 10px; font-size: 12px;" onclick="voteForDevice('${result.brand.replace(/'/g, "\\'")}', '${result.model.replace(/'/g, "\\'")}')">
                        👍 Votar (${result.votes || 0})
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showSuggestions(query) {
    const suggestionsDiv = document.getElementById('suggestions');
    if (query.length < 2) {
        suggestionsDiv.innerHTML = '';
        return;
    }
    
    const allAppliances = getAllAppliances();
    const allBrands = [...new Set(allAppliances.map(item => item.brand))];
    const filtered = allBrands.filter(brand => 
        brand.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
    
    suggestionsDiv.innerHTML = filtered.map(brand => `
        <div class="suggestion-item" onclick="selectBrand('${brand.replace(/'/g, "\\'")}')">
            ${brand}
            ${communityAppliances.some(c => c.brand === brand) ? ' 👥' : ''}
        </div>
    `).join('');
}

window.selectBrand = function(brand) {
    document.getElementById('brandInput').value = brand;
    document.getElementById('suggestions').innerHTML = '';
    document.getElementById('modelInput').focus();
};

window.addDeviceFromSearch = function(brand, model, watts, category, type) {
    const hoursInput = document.getElementById(`hours_${(brand + model).replace(/[\s\W]/g, '')}`);
    const hoursPerDay = hoursInput ? parseFloat(hoursInput.value) : 1;
    
    const device = {
        id: Date.now(),
        brand: brand,
        model: model,
        watts: watts,
        category: category,
        type: type,
        hoursPerDay: hoursPerDay,
        dateAdded: new Date().toISOString()
    };
    
    userDevices.push(device);
    saveDevices();
    saveUserDevicesToCloud(userDevices);
    renderDevices();
    updateBalance();
    
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('brandInput').value = '';
    document.getElementById('modelInput').value = '';
};

async function addManualDevice() {
    const brand = document.getElementById('manualBrand').value.trim();
    const model = document.getElementById('manualModel').value.trim();
    const watts = parseFloat(document.getElementById('manualWatts').value);
    const category = document.getElementById('manualCategory').options[document.getElementById('manualCategory').selectedIndex].text;
    const type = document.getElementById('manualCategory').value;
    const hoursPerDay = parseFloat(document.getElementById('manualHours').value);
    
    if (!brand || !watts || isNaN(watts)) {
        alert('Por favor completa marca y consumo en Watts');
        return;
    }
    
    showLoading("Guardando en la comunidad...");
    
    const result = await addToCommunityDatabase({
        brand: brand,
        model: model || "Modelo no especificado",
        watts: watts,
        category: category,
        type: type
    });
    
    if (result.success) {
        showToast(result.new ? "✓ Nuevo equipo agregado a la comunidad" : `✓ Voto registrado (${result.votes} votos totales)`);
        await syncCommunityAppliances();
    }
    
    const device = {
        id: Date.now(),
        brand: brand,
        model: model || "Modelo no especificado",
        watts: watts,
        category: category,
        type: type,
        hoursPerDay: hoursPerDay || 1,
        dateAdded: new Date().toISOString(),
        isManual: true
    };
    
    userDevices.push(device);
    saveDevices();
    await saveUserDevicesToCloud(userDevices);
    renderDevices();
    updateBalance();
    
    document.getElementById('manualBrand').value = '';
    document.getElementById('manualModel').value = '';
    document.getElementById('manualWatts').value = '';
    document.getElementById('manualHours').value = '1';
    
    hideLoading();
}

window.voteForDevice = async function(brand, model) {
    showLoading("Registrando voto...");
    const result = await voteForCommunityDevice(brand, model);
    if (result.success) {
        showToast(`👍 Voto registrado! Ahora tiene ${result.votes} votos`);
        await syncCommunityAppliances();
        performSearch();
    } else {
        showToast(result.message || "No se pudo registrar el voto", "error");
    }
    hideLoading();
};

function renderDevices() {
    const devicesList = document.getElementById('devicesList');
    
    if (userDevices.length === 0) {
        devicesList.innerHTML = `
            <div class="empty-state">
                <span class="material-icons">devices</span>
                <p>No hay equipos agregados. Busca o añade manualmente.</p>
            </div>
        `;
        return;
    }
    
    devicesList.innerHTML = userDevices.map(device => `
        <div class="device-item">
            <div class="device-info">
                <div class="device-name">${device.brand} ${device.model}</div>
                <div class="device-details">
                    ${device.category} • ${device.watts} Watts • ${device.hoursPerDay} horas/día
                </div>
            </div>
            <div class="device-stats">
                <div class="device-watts">${(device.watts * device.hoursPerDay / 1000).toFixed(2)} kWh/día</div>
                <div class="device-hours">
                    <input type="range" min="0" max="24" step="0.5" 
                           value="${device.hoursPerDay}" 
                           onchange="updateHours(${device.id}, this.value)"
                           style="width: 100px;">
                </div>
            </div>
            <button class="delete-btn" onclick="deleteDevice(${device.id})">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `).join('');
}

window.updateHours = function(id, hours) {
    const device = userDevices.find(d => d.id === id);
    if (device) {
        device.hoursPerDay = parseFloat(hours);
        saveDevices();
        saveUserDevicesToCloud(userDevices);
        renderDevices();
        updateBalance();
    }
};

window.deleteDevice = function(id) {
    if (confirm('¿Seguro que quieres eliminar este equipo?')) {
        userDevices = userDevices.filter(d => d.id !== id);
        saveDevices();
        saveUserDevicesToCloud(userDevices);
        renderDevices();
        updateBalance();
    }
};

function updateBalance() {
    const totalWatts = userDevices.reduce((sum, device) => sum + device.watts, 0);
    const totalDailyKWh = userDevices.reduce((sum, device) => sum + (device.watts * device.hoursPerDay / 1000), 0);
    const totalMonthlyKWh = totalDailyKWh * 30;
    const totalCost = calculateProgressiveCost(totalMonthlyKWh);
    
    document.getElementById('totalWatts').textContent = totalWatts.toFixed(0);
    document.getElementById('totalDailyKWh').textContent = totalDailyKWh.toFixed(2);
    document.getElementById('totalMonthlyKWh').textContent = totalMonthlyKWh.toFixed(2);
    document.getElementById('totalCost').textContent = totalCost.toFixed(2);
}

function exportToCSV() {
    if (userDevices.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const totalMonthlyKWh = userDevices.reduce((sum, d) => sum + (d.watts * d.hoursPerDay / 1000), 0) * 30;
    const totalCost = calculateProgressiveCost(totalMonthlyKWh);
    
    const headers = ['Marca', 'Modelo', 'Categoría', 'Watts', 'Horas/día', 'kWh/día', 'kWh/mes', 'Costo/mes (pesos)', 'Fecha'];
    const rows = userDevices.map(device => [
        device.brand, device.model, device.category, device.watts, device.hoursPerDay,
        (device.watts * device.hoursPerDay / 1000).toFixed(2),
        ((device.watts * device.hoursPerDay / 1000) * 30).toFixed(2),
        calculateProgressiveCost((device.watts * device.hoursPerDay / 1000) * 30).toFixed(2),
        new Date(device.dateAdded).toLocaleDateString()
    ]);
    
    rows.push(['TOTAL', '', '', '', '', '', totalMonthlyKWh.toFixed(2), totalCost.toFixed(2), '']);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `energy_balance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function clearAll() {
    if (confirm('⚠️ ¿Seguro que quieres eliminar TODOS los equipos?')) {
        userDevices = [];
        saveDevices();
        saveUserDevicesToCloud(userDevices);
        renderDevices();
        updateBalance();
    }
}

function setupManualToggle() {
    const toggleBtn = document.getElementById('toggleManualBtn');
    const manualForm = document.getElementById('manualForm');
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            manualForm.classList.toggle('hidden');
            const icon = toggleBtn.querySelector('.material-icons');
            icon.textContent = manualForm.classList.contains('hidden') ? 'expand_more' : 'expand_less';
        };
    }
}

function showLoading(message) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `<div class="loader-content"><div class="spinner"></div><p>${message}</p></div>`;
        document.body.appendChild(loader);
    } else {
        loader.querySelector('p').textContent = message;
        loader.style.display = 'flex';
    }
}

function hideLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: ${type === 'error' ? '#f44336' : '#4CAF50'}; color: white;
        padding: 12px 24px; border-radius: 8px; z-index: 2000;
        animation: slideUp 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function initializeApp() {
    showLoading("Conectando a la comunidad...");
    await loginAnonymously();
    await syncCommunityAppliances();
    await loadSavedData();
    const cloudDevices = await loadUserDevicesFromCloud();
    if (cloudDevices.length > 0 && userDevices.length === 0) {
        userDevices = cloudDevices;
        saveDevices();
    }
    renderDevices();
    updateBalance();
    hideLoading();
}

// Event Listeners
document.getElementById('searchBtn').addEventListener('click', performSearch);
document.getElementById('addManualBtn').addEventListener('click', addManualDevice);
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
document.getElementById('clearAllBtn').addEventListener('click', clearAll);
document.getElementById('brandInput').addEventListener('input', (e) => showSuggestions(e.target.value));
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) document.getElementById('suggestions').innerHTML = '';
});

setupManualToggle();
initializeApp();