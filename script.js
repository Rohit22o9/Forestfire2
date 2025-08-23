
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
    // Performance Chart (Original)
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
    
    // Fire Risk Level Over Time Chart
    const riskTimelineCtx = document.getElementById('riskTimelineChart').getContext('2d');
    const riskTimelineChart = new Chart(riskTimelineCtx, {
        type: 'line',
        data: {
            labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM', '12AM', '3AM'],
            datasets: [
                {
                    label: 'Dehradun',
                    data: [25, 35, 55, 75, 85, 65, 45, 30],
                    borderColor: '#66bb6a',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Nainital',
                    data: [45, 55, 70, 85, 90, 80, 60, 50],
                    borderColor: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Haridwar',
                    data: [30, 40, 60, 70, 75, 55, 40, 35],
                    borderColor: '#ffa726',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Rishikesh',
                    data: [20, 30, 45, 65, 70, 50, 35, 25],
                    borderColor: '#42a5f5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1
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
                    min: 0,
                    max: 100,
                    ticks: {
                        color: '#ffffff',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    // Fire Spread Simulation Timeline Chart
    const fireSpreadCtx = document.getElementById('fireSpreadChart').getContext('2d');
    let fireSpreadChart = new Chart(fireSpreadCtx, {
        type: 'line',
        data: {
            labels: ['0h', '1h', '2h', '3h', '4h', '5h', '6h'],
            datasets: [{
                label: 'Area Burned (hectares)',
                data: [0, 12, 35, 78, 145, 225, 320],
                borderColor: '#ff6b35',
                backgroundColor: createGradient(fireSpreadCtx, '#ff6b35', '#ff4444'),
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
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return 'Burned: ' + context.parsed.y + ' hectares';
                        }
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
                        color: '#ffffff',
                        callback: function(value) {
                            return value + ' ha';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

    // Gauge Charts
    initializeGaugeCharts();

    // Alert Statistics Pie Chart
    const alertStatsCtx = document.getElementById('alertStatsChart').getContext('2d');
    new Chart(alertStatsCtx, {
        type: 'doughnut',
        data: {
            labels: ['Fire Risk Warnings', 'Active Fire Detected', 'Evacuation Alerts', 'All Clear/Safe Zones'],
            datasets: [{
                data: [35, 25, 20, 20],
                backgroundColor: ['#ffa726', '#ff4444', '#ff6b35', '#66bb6a'],
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + percentage + '%';
                        }
                    }
                }
            }
        }
    });

    // Store chart references for updates
    window.chartInstances = {
        riskTimeline: riskTimelineChart,
        fireSpread: fireSpreadChart
    };
}

// Create gradient for fire spread chart
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1 + '80');
    gradient.addColorStop(1, color2 + '20');
    return gradient;
}

// Initialize Gauge Charts
function initializeGaugeCharts() {
    // Accuracy Gauge
    const accuracyCtx = document.getElementById('accuracyGauge').getContext('2d');
    new Chart(accuracyCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [97, 3],
                backgroundColor: ['#66bb6a', 'rgba(255, 255, 255, 0.1)'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });

    // Uptime Gauge
    const uptimeCtx = document.getElementById('uptimeGauge').getContext('2d');
    new Chart(uptimeCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [99.8, 0.2],
                backgroundColor: ['#66bb6a', 'rgba(255, 255, 255, 0.1)'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });

    // Speed Gauge
    const speedCtx = document.getElementById('speedGauge').getContext('2d');
    new Chart(speedCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [85, 15],
                backgroundColor: ['#ffa726', 'rgba(255, 255, 255, 0.1)'],
                borderWidth: 0,
                cutout: '75%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
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
    // Add animated fire origin marker with enhanced visuals
    const fireMarker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'fire-marker origin-fire',
            html: `
                <div class="fire-icon-container">
                    <i class="fas fa-fire fire-flame"></i>
                    <div class="fire-glow"></div>
                    <div class="fire-sparks"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(simulationMap);
    
    fireSpreadLayers.push(fireMarker);
    
    // Add initial burn circle
    const initialBurn = L.circle([latlng.lat, latlng.lng], {
        color: '#ff6b35',
        fillColor: '#ff4444',
        fillOpacity: 0.7,
        radius: 200,
        className: 'fire-burn-area'
    }).addTo(simulationMap);
    
    fireSpreadLayers.push(initialBurn);
}

function startSimulation() {
    isSimulationRunning = true;
    const speed = parseInt(document.getElementById('speed-slider').value) || 1;
    
    // Limit minimum interval to prevent overwhelming the browser
    const minInterval = 500; // Minimum 500ms between updates
    const interval = Math.max(minInterval, 2000 / speed);
    
    simulationInterval = setInterval(() => {
        simulationTime += 1;
        updateSimulationTime();
        
        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
            simulateFireSpread();
        });
    }, interval);
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
    // Optimized fire spread simulation to prevent hanging
    if (fireSpreadLayers.length > 0) {
        // Limit processing to prevent overwhelming the browser
        if (fireSpreadLayers.length > 100) {
            // Remove oldest layers first to maintain performance
            const excessLayers = fireSpreadLayers.splice(0, 20);
            excessLayers.forEach(layer => {
                try {
                    simulationMap.removeLayer(layer);
                } catch (e) {
                    // Ignore errors for layers already removed
                }
            });
        }
        
        // Get environmental parameters
        const windSpeed = parseInt(document.getElementById('wind-speed').textContent) || 15;
        const windDirection = document.getElementById('wind-direction').textContent || 'NE';
        const temperature = parseInt(document.getElementById('temperature').textContent) || 32;
        const humidity = parseInt(document.getElementById('humidity').textContent) || 45;
        
        // Convert wind direction to angle
        const windAngles = {
            'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
            'S': 180, 'SW': 225, 'W': 270, 'NW': 315
        };
        const windAngle = (windAngles[windDirection] || 0) * Math.PI / 180;
        
        // Limit the number of fire sources processed per cycle
        const fireSources = fireSpreadLayers.filter(layer => 
            layer instanceof L.Marker && layer.options.icon.options.className.includes('fire-marker')
        ).slice(-10); // Only process the 10 most recent fire sources
        
        let newSpreadCount = 0;
        const maxNewSpreads = 3; // Limit new spreads per cycle
        
        fireSources.forEach((fireSource) => {
            if (newSpreadCount >= maxNewSpreads) return; // Stop if we've reached the limit
            
            if (Math.random() < 0.4) { // Reduced chance to 40% for better performance
                const sourceLatlng = fireSource.getLatLng();
                
                // Simplified spread calculation
                const baseSpread = 0.005; // Reduced spread distance
                const windFactor = windSpeed / 20;
                const tempFactor = temperature / 35;
                const humidityFactor = (100 - humidity) / 120;
                
                const spreadDistance = baseSpread * windFactor * tempFactor * humidityFactor;
                
                // Calculate new position
                const spreadAngle = windAngle + (Math.random() - 0.5) * Math.PI / 3;
                const newLat = sourceLatlng.lat + Math.cos(spreadAngle) * spreadDistance;
                const newLng = sourceLatlng.lng + Math.sin(spreadAngle) * spreadDistance;
                
                // Create simplified fire marker
                const spreadMarker = L.marker([newLat, newLng], {
                    icon: L.divIcon({
                        className: 'fire-marker spread-fire',
                        html: '<i class="fas fa-fire fire-flame"></i>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(simulationMap);
                
                // Create smaller burn area
                const burnRadius = 100 + Math.random() * 50;
                const burnArea = L.circle([newLat, newLng], {
                    color: '#ff4444',
                    fillColor: '#cc0000',
                    fillOpacity: 0.3,
                    radius: burnRadius,
                    weight: 1
                }).addTo(simulationMap);
                
                fireSpreadLayers.push(spreadMarker);
                fireSpreadLayers.push(burnArea);
                newSpreadCount++;
                
                // Reduced smoke frequency
                if (Math.random() < 0.1 && newSpreadCount < 2) {
                    const smokeMarker = L.marker([newLat + 0.001, newLng + 0.001], {
                        icon: L.divIcon({
                            className: 'smoke-marker',
                            html: '<i class="fas fa-cloud smoke-cloud"></i>',
                            iconSize: [15, 15],
                            iconAnchor: [7, 7]
                        })
                    }).addTo(simulationMap);
                    
                    fireSpreadLayers.push(smokeMarker);
                }
            }
        });
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
        showCurrentDayPrediction();
    } else {
        btn.innerHTML = '<i class="fas fa-calendar"></i> Show Current Day';
        // Show next day prediction
        showNextDayPrediction();
    }
}

// Show current day prediction data
function showCurrentDayPrediction() {
    // Update risk zones to current day values
    updateRiskZones([
        { name: 'Nainital District', risk: 'very-high', percentage: 85 },
        { name: 'Almora District', risk: 'high', percentage: 68 },
        { name: 'Dehradun District', risk: 'moderate', percentage: 42 }
    ]);
    
    // Update map polygons with current colors
    updateMapRiskColors('current');
    
    // Update last update time
    document.getElementById('last-update').textContent = '2 minutes ago';
}

// Show next day prediction data
function showNextDayPrediction() {
    // Update risk zones to next day predicted values (generally higher)
    updateRiskZones([
        { name: 'Nainital District', risk: 'very-high', percentage: 92 },
        { name: 'Almora District', risk: 'very-high', percentage: 78 },
        { name: 'Dehradun District', risk: 'high', percentage: 65 }
    ]);
    
    // Update map polygons with predicted colors
    updateMapRiskColors('predicted');
    
    // Update last update time
    document.getElementById('last-update').textContent = 'Predicted for tomorrow';
}

// Update risk zones display
function updateRiskZones(zones) {
    const riskContainer = document.querySelector('.risk-zones');
    riskContainer.innerHTML = '';
    
    zones.forEach(zone => {
        const riskClass = zone.risk === 'very-high' ? 'high-risk' : 
                         zone.risk === 'high' ? 'moderate-risk' : 'low-risk';
        
        const riskItem = document.createElement('div');
        riskItem.className = `risk-item ${riskClass}`;
        riskItem.innerHTML = `
            <div class="risk-color"></div>
            <div class="risk-info">
                <span class="risk-level">${zone.risk.replace('-', ' ').toUpperCase()} Risk</span>
                <span class="risk-area">${zone.name}</span>
            </div>
            <div class="risk-percentage">${zone.percentage}%</div>
        `;
        riskContainer.appendChild(riskItem);
    });
}

// Update map risk colors
function updateMapRiskColors(type) {
    // Clear existing layers
    riskMap.eachLayer(layer => {
        if (layer instanceof L.Polygon) {
            riskMap.removeLayer(layer);
        }
    });
    
    // Define zones based on prediction type
    const zones = type === 'current' ? [
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
    ] : [
        {
            name: 'Nainital District',
            coords: [[29.2, 79.3], [29.6, 79.3], [29.6, 79.8], [29.2, 79.8]],
            risk: 'very-high',
            color: '#cc0000'  // Darker red for higher predicted risk
        },
        {
            name: 'Almora District',
            coords: [[29.5, 79.5], [29.9, 79.5], [29.9, 80.0], [29.5, 80.0]],
            risk: 'very-high',
            color: '#ff4444'  // Red for elevated risk
        },
        {
            name: 'Dehradun District',
            coords: [[30.1, 77.8], [30.5, 77.8], [30.5, 78.3], [30.1, 78.3]],
            risk: 'high',
            color: '#ffa726'  // Orange for increased risk
        }
    ];
    
    // Add updated zones to map
    zones.forEach(zone => {
        const polygon = L.polygon(zone.coords, {
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: type === 'predicted' ? 0.6 : 0.4,
            weight: type === 'predicted' ? 3 : 2
        }).addTo(riskMap);
        
        const riskLevel = zone.risk.replace('-', ' ').toUpperCase();
        const prefix = type === 'predicted' ? 'Predicted: ' : '';
        
        polygon.bindPopup(`
            <div>
                <h4>${zone.name}</h4>
                <p>${prefix}Risk Level: ${riskLevel}</p>
            </div>
        `);
    });
}

// Start real-time data updates
function startDataUpdates() {
    // Update environmental parameters
    setInterval(updateEnvironmentalData, 30000); // Every 30 seconds
    
    // Update alerts
    setInterval(updateAlerts, 60000); // Every minute
    
    // Update time stamps
    setInterval(updateTimeStamps, 60000); // Every minute
    
    // Update charts
    setInterval(updateChartData, 45000); // Every 45 seconds
    
    // Update fire spread chart during simulation
    setInterval(updateFireSpreadChart, 10000); // Every 10 seconds during simulation
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

// Update chart data with realistic variations
function updateChartData() {
    if (window.chartInstances && window.chartInstances.riskTimeline) {
        const chart = window.chartInstances.riskTimeline;
        
        // Update each region's data with small realistic variations
        chart.data.datasets.forEach((dataset, index) => {
            dataset.data = dataset.data.map(value => {
                const variation = (Math.random() - 0.5) * 10; // ±5 point variation
                return Math.max(0, Math.min(100, value + variation));
            });
        });
        
        chart.update('none'); // Update without animation for smoother real-time feel
    }
    
    // Update gauge values
    updateGaugeValues();
    
    // Update alert statistics
    updateAlertStatistics();
}

// Update fire spread chart during simulation
function updateFireSpreadChart() {
    if (isSimulationRunning && window.chartInstances && window.chartInstances.fireSpread) {
        const chart = window.chartInstances.fireSpread;
        const lastValue = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
        
        // Add new data point based on simulation time
        const timeLabel = simulationTime + 'h';
        const newArea = lastValue + Math.random() * 50 + 20; // Realistic fire spread
        
        // Limit data points to prevent chart overflow
        if (chart.data.labels.length > 10) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        
        chart.data.labels.push(timeLabel);
        chart.data.datasets[0].data.push(Math.round(newArea));
        
        chart.update('none');
    }
}

// Update gauge values
function updateGaugeValues() {
    // Accuracy gauge (minor fluctuations around 97%)
    const newAccuracy = Math.max(95, Math.min(99, 97 + (Math.random() - 0.5) * 2));
    document.getElementById('accuracyValue').textContent = newAccuracy.toFixed(1) + '%';
    
    // Uptime gauge (very stable around 99.8%)
    const newUptime = Math.max(99.5, Math.min(100, 99.8 + (Math.random() - 0.5) * 0.3));
    document.getElementById('uptimeValue').textContent = newUptime.toFixed(1) + '%';
    
    // Speed gauge (more variable around 85%)
    const newSpeed = Math.max(70, Math.min(95, 85 + (Math.random() - 0.5) * 10));
    document.getElementById('speedValue').textContent = Math.round(newSpeed) + '%';
}

// Update alert statistics
function updateAlertStatistics() {
    // Generate realistic alert counts
    const totalAlerts = Math.floor(Math.random() * 20) + 130; // 130-150 range
    const activeFires = Math.floor(Math.random() * 5) + 5; // 5-10 range
    const responseTime = Math.floor(Math.random() * 8) + 8; // 8-16 minutes
    
    document.getElementById('totalAlerts').textContent = totalAlerts;
    document.getElementById('activeFires').textContent = activeFires;
    document.getElementById('responseTime').textContent = responseTime + ' min';
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

// Add click instruction popup when simulation map loads
simulationMap.on('load', function() {
    setTimeout(() => {
        const popup = L.popup()
            .setLatLng([30.2, 79.2])
            .setContent('<div style="text-align: center;"><i class="fas fa-hand-pointer" style="color: #ff6b35; margin-right: 5px;"></i><strong>Click anywhere on the map to start a fire!</strong></div>')
            .openOn(simulationMap);
        
        setTimeout(() => {
            simulationMap.closePopup(popup);
        }, 4000);
    }, 1000);
});
