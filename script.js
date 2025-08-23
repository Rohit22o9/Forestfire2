
// Global variables
let riskMap;
let simulationMap;
let isSimulationRunning = false;
let simulationTime = 0;
let simulationInterval;
let fireSpreadLayers = [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeMaps();
    initializeCharts();
    initializeSimulation();
    startDataUpdates();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Smooth scroll navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // Update active nav on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.section');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            
            if (scrollPos >= top && scrollPos <= bottom) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// Initialize maps
function initializeMaps() {
    // Fire Risk Map
    riskMap = L.map('risk-map').setView([30.0668, 79.0193], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(riskMap);
    
    // Add risk zones for Uttarakhand districts
    addRiskZones();
    
    // Simulation Map
    simulationMap = L.map('simulation-map').setView([30.0668, 79.0193], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(simulationMap);
    
    // Add click listener for fire simulation
    simulationMap.on('click', function(e) {
        startFireSimulation(e.latlng);
    });
    
    // Add forest areas
    addForestAreas();
}

// Add risk zones to the map
function addRiskZones() {
    const riskZones = [
        {
            name: 'Nainital District',
            coords: [[29.2, 79.3], [29.6, 79.3], [29.6, 79.8], [29.2, 79.8]],
            risk: 'very-high',
            color: '#ff4444'
        },
        {
            name: 'Almora District',
            coords: [[29.5, 79.5], [29.9, 79.5], [29.9, 80.0], [29.5, 80.0]],
            risk: 'high',
            color: '#ffa726'
        },
        {
            name: 'Dehradun District',
            coords: [[30.1, 77.8], [30.5, 77.8], [30.5, 78.3], [30.1, 78.3]],
            risk: 'moderate',
            color: '#66bb6a'
        }
    ];
    
    riskZones.forEach(zone => {
        const polygon = L.polygon(zone.coords, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.4
        }).addTo(riskMap);
        
        polygon.bindPopup(`
            <div>
                <h4>${zone.name}</h4>
                <p>Risk Level: ${zone.risk.replace('-', ' ').toUpperCase()}</p>
            </div>
        `);
    });
}

// Add forest areas to simulation map
function addForestAreas() {
    const forestAreas = [
        {
            name: 'Jim Corbett National Park',
            coords: [[29.4, 78.7], [29.7, 78.7], [29.7, 79.1], [29.4, 79.1]],
            color: '#2d5a2d'
        },
        {
            name: 'Valley of Flowers',
            coords: [[30.7, 79.5], [30.8, 79.5], [30.8, 79.7], [30.7, 79.7]],
            color: '#2d5a2d'
        }
    ];
    
    forestAreas.forEach(forest => {
        const polygon = L.polygon(forest.coords, {
            color: forest.color,
            fillColor: forest.color,
            fillOpacity: 0.6
        }).addTo(simulationMap);
        
        polygon.bindPopup(`<h4>${forest.name}</h4>`);
    });
}

// Initialize charts
function initializeCharts() {
    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
        type: 'doughnut',
        data: {
            labels: ['Accurate Predictions', 'False Positives'],
            datasets: [{
                data: [97, 3],
                backgroundColor: ['#66bb6a', '#ff6b35'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
    
    // Risk Timeline Chart
    const riskCtx = document.getElementById('riskChart').getContext('2d');
    new Chart(riskCtx, {
        type: 'line',
        data: {
            labels: ['6AM', '12PM', '6PM', '12AM', '6AM', '12PM'],
            datasets: [{
                label: 'Risk Level',
                data: [30, 45, 70, 85, 65, 40],
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Initialize simulation controls
function initializeSimulation() {
    const playBtn = document.getElementById('play-simulation');
    const pauseBtn = document.getElementById('pause-simulation');
    const resetBtn = document.getElementById('reset-simulation');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    
    playBtn.addEventListener('click', () => {
        if (!isSimulationRunning) {
            startSimulation();
        }
    });
    
    pauseBtn.addEventListener('click', pauseSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    
    speedSlider.addEventListener('input', (e) => {
        const speed = e.target.value;
        speedValue.textContent = `${speed}x`;
        updateSimulationSpeed(speed);
    });
    
    // Toggle prediction button
    document.getElementById('toggle-prediction').addEventListener('click', togglePrediction);
}

// Fire simulation functions
function startFireSimulation(latlng) {
    // Add fire origin marker
    const fireMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'fire-marker',
            html: '<i class="fas fa-fire" style="color: #ff4444; font-size: 20px;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(simulationMap);
    
    fireSpreadLayers.push(fireMarker);
}

function startSimulation() {
    isSimulationRunning = true;
    const speed = document.getElementById('speed-slider').value;
    
    simulationInterval = setInterval(() => {
        simulationTime += 1;
        updateSimulationTime();
        simulateFireSpread();
    }, 1000 / speed);
}

function pauseSimulation() {
    isSimulationRunning = false;
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
}

function resetSimulation() {
    pauseSimulation();
    simulationTime = 0;
    updateSimulationTime();
    
    // Clear fire spread layers
    fireSpreadLayers.forEach(layer => {
        simulationMap.removeLayer(layer);
    });
    fireSpreadLayers = [];
}

function updateSimulationSpeed(speed) {
    if (isSimulationRunning) {
        pauseSimulation();
        startSimulation();
    }
}

function simulateFireSpread() {
    // Simple fire spread simulation
    if (fireSpreadLayers.length > 0) {
        const lastFire = fireSpreadLayers[fireSpreadLayers.length - 1];
        const latlng = lastFire.getLatLng();
        
        // Simulate spread in random direction (simplified)
        const spreadRadius = 0.01;
        const angle = Math.random() * 2 * Math.PI;
        const newLat = latlng.lat + Math.cos(angle) * spreadRadius;
        const newLng = latlng.lng + Math.sin(angle) * spreadRadius;
        
        const spreadCircle = L.circle([newLat, newLng], {
            color: '#ff6b35',
            fillColor: '#ff6b35',
            fillOpacity: 0.6,
            radius: 500
        }).addTo(simulationMap);
        
        fireSpreadLayers.push(spreadCircle);
    }
}

function updateSimulationTime() {
    const hours = Math.floor(simulationTime / 60);
    const minutes = simulationTime % 60;
    document.getElementById('simulation-time').textContent = 
        hours > 0 ? `${hours}h ${minutes}m` : `${minutes} minutes`;
}

// Toggle prediction functionality
function togglePrediction() {
    const btn = document.getElementById('toggle-prediction');
    const isNextDay = btn.textContent.includes('Current');
    
    if (isNextDay) {
        btn.innerHTML = '<i class="fas fa-clock"></i> Show Next Day Prediction';
        // Show current day data
    } else {
        btn.innerHTML = '<i class="fas fa-calendar"></i> Show Current Day';
        // Show next day prediction
    }
}

// Start real-time data updates
function startDataUpdates() {
    // Update environmental parameters
    setInterval(updateEnvironmentalData, 30000); // Every 30 seconds
    
    // Update alerts
    setInterval(updateAlerts, 60000); // Every minute
    
    // Update time stamps
    setInterval(updateTimeStamps, 60000); // Every minute
}

function updateEnvironmentalData() {
    // Simulate real-time environmental data updates
    const windSpeed = Math.floor(Math.random() * 20) + 5;
    const temperature = Math.floor(Math.random() * 15) + 25;
    const humidity = Math.floor(Math.random() * 40) + 30;
    
    document.getElementById('wind-speed').textContent = `${windSpeed} km/h`;
    document.getElementById('temperature').textContent = `${temperature}°C`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    
    // Update wind direction randomly
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    document.getElementById('wind-direction').textContent = randomDirection;
}

function updateAlerts() {
    // Update alert timestamps
    const alertTimes = document.querySelectorAll('.alert-time');
    alertTimes.forEach((timeEl, index) => {
        const baseTime = (index + 1) * 15; // 15, 30, 45 minutes etc.
        timeEl.textContent = `${baseTime} minutes ago`;
    });
}

function updateTimeStamps() {
    // Update last update time
    document.getElementById('last-update').textContent = 'Just now';
    
    // Reset after a few seconds
    setTimeout(() => {
        document.getElementById('last-update').textContent = '1 minute ago';
    }, 5000);
}

// Export functionality
document.addEventListener('click', function(e) {
    if (e.target.closest('.action-btn')) {
        const btn = e.target.closest('.action-btn');
        const exportType = btn.textContent.trim();
        
        if (exportType.includes('GeoTIFF') || exportType.includes('Shapefiles')) {
            // Simulate export
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Exported!';
                setTimeout(() => {
                    btn.innerHTML = exportType.includes('GeoTIFF') 
                        ? '<i class="fas fa-download"></i> Export GeoTIFF'
                        : '<i class="fas fa-file-export"></i> Export Shapefiles';
                }, 2000);
            }, 3000);
        }
    }
});

// Add some CSS for fire marker
const style = document.createElement('style');
style.textContent = `
    .fire-marker {
        background: transparent !important;
        border: none !important;
    }
`;
document.head.appendChild(style);
