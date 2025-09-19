// LinkPro Analytics Dashboard JavaScript - Enhanced with linkpro.ma styling

// Configuration
const API_BASE_URL = 'http://localhost:8000';
let profileId = 1;
let refreshInterval = null;
let trafficChart = null;
let timeChart = null;
let isLoading = false;

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing LinkPro Analytics Dashboard...');
    initializeDashboard();
    initializeAnimations();
});

// Main initialization function
async function initializeDashboard() {
    try {
        setupEventListeners();
        await refreshData();
        startAutoRefresh();
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Failed to initialize dashboard. Please refresh the page.');
    }
}

// Initialize animations and visual effects
function initializeAnimations() {
    // Add fade-in animation to elements as they become visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });

    // Add interactive hover effects to icons
    document.querySelectorAll('.fas').forEach(icon => {
        icon.classList.add('interactive-icon');
    });
}

// Setup event listeners
function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshBtn');
    const profileSelector = document.getElementById('profileSelector');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            // Add visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
            await refreshData();
        });
    }
    
    if (profileSelector) {
        profileSelector.addEventListener('change', function(e) {
            profileId = parseInt(e.target.value);
            // Add visual feedback
            this.style.transform = 'scale(1.02)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
            refreshData();
        });
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    // Handle window resize for charts
    window.addEventListener('resize', debounce(resizeCharts, 250));
    
    // Add smooth scrolling to any anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Start auto-refresh timer
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(refreshData, 30000); // 30 seconds
}

// Main data refresh function with enhanced visual feedback
async function refreshData() {
    if (isLoading) {
        console.log('Already loading, skipping refresh...');
        return;
    }

    isLoading = true;
    showLoading(true);
    
    // Add pulse effect to refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.classList.add('pulse-custom');
    }
    
    try {
        console.log('Fetching analytics data for profile', profileId);
        
        // Fetch all data
        const [quickStats, comparison, traffic, timeData, profileData] = await Promise.all([
            fetchQuickStats(),
            fetchComparison(),
            fetchTrafficAnalytics(),
            fetchTimeAnalytics(),
            fetchProfileAnalytics()
        ]);
        
        // Update UI with staggered animations
        await updateQuickStats(quickStats, comparison);
        await updateTrafficChart(traffic);
        await updateTimeChart(timeData);
        await updateLinksTable(profileData);
        updateRecommendations(timeData);
        updateLastRefreshTime();
        
        // Show success feedback
        showSuccessToast('Data updated successfully!');
        
        console.log('Data refresh completed');
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        showError(getErrorMessage(error));
    } finally {
        isLoading = false;
        showLoading(false);
        
        // Remove pulse effect from refresh button
        if (refreshBtn) {
            refreshBtn.classList.remove('pulse-custom');
        }
    }
}

// API Functions 
async function fetchQuickStats() {
    const response = await fetch(`${API_BASE_URL}/api/analytics/quick-stats/${profileId}?days=7`);
    if (!response.ok) {
        throw new Error(`Quick stats API error: ${response.status}`);
    }
    return response.json();
}

async function fetchComparison() {
    const response = await fetch(`${API_BASE_URL}/api/analytics/compare/${profileId}?current_days=7&previous_days=7`);
    if (!response.ok) {
        throw new Error(`Comparison API error: ${response.status}`);
    }
    return response.json();
}

async function fetchTrafficAnalytics() {
    const response = await fetch(`${API_BASE_URL}/api/analytics/traffic/${profileId}`);
    if (!response.ok) {
        throw new Error(`Traffic analytics API error: ${response.status}`);
    }
    return response.json();
}

async function fetchTimeAnalytics() {
    const response = await fetch(`${API_BASE_URL}/api/analytics/time/${profileId}?granularity=daily`);
    if (!response.ok) {
        throw new Error(`Time analytics API error: ${response.status}`);
    }
    return response.json();
}

async function fetchProfileAnalytics() {
    const response = await fetch(`${API_BASE_URL}/api/analytics/profile/${profileId}`);
    if (!response.ok) {
        throw new Error(`Profile analytics API error: ${response.status}`);
    }
    return response.json();
}

// UI Update Functions with animations
async function updateQuickStats(stats, comparison) {
    try {
        // main numbers with counting animation
        await animateCounter('totalClicks', 0, stats.summary.total_clicks);
        await animateCounter('totalViews', 0, stats.summary.total_views);
        await animateCounter('uniqueVisitors', 0, stats.summary.unique_visitors);
        
        // CTR with decimal animation
        const ctrElement = document.getElementById('ctr');
        if (ctrElement) {
            animateDecimal(ctrElement, 0, stats.summary.click_through_rate, 1, '%');
        }
        
        // change indicators 
        updateChangeIndicator('clicksChange', comparison.changes.clicks);
        updateChangeIndicator('viewsChange', comparison.changes.views);
        updateChangeIndicator('ctrChange', comparison.changes.ctr);
        
    } catch (error) {
        console.error('Error updating quick stats:', error);
    }
}

// Animate counter with easing
async function animateCounter(elementId, start, end, duration = 1000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    return new Promise(resolve => {
        const startTime = Date.now();
        const range = end - start;
        
        const timer = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (range * easeOut));
            
            element.textContent = current.toLocaleString();
            
            if (progress === 1) {
                clearInterval(timer);
                resolve();
            }
        }, 16); // ~60fps
    });
}

// Animate decimal values
function animateDecimal(element, start, end, decimals, suffix = '') {
    const duration = 1000;
    const startTime = Date.now();
    const range = end - start;
    
    const timer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (range * easeOut);
        
        element.textContent = current.toFixed(decimals) + suffix;
        
        if (progress === 1) {
            clearInterval(timer);
        }
    }, 16);
}

function updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = change.percentage >= 0;
    const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    element.className = `${colorClass} transition-all duration-300`;
    element.innerHTML = `<i class="fas ${icon} mr-1"></i> ${Math.abs(change.percentage).toFixed(1)}%`;
    
    // Add bounce animation
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
        element.style.transform = 'scale(1)';
    }, 200);
}

async function updateTrafficChart(trafficData) {
    const canvas = document.getElementById('trafficChart');
    if (!canvas) {
        console.error('Traffic chart canvas not found');
        return;
    }

    try {
        // Destroy existing chart
        if (trafficChart) {
            trafficChart.destroy();
            trafficChart = null;
        }

        const ctx = canvas.getContext('2d');
        
        // Prepare data
        const labels = trafficData.sources.map(s => 
            s.source.charAt(0).toUpperCase() + s.source.slice(1)
        );
        const data = trafficData.sources.map(s => s.clicks);
        
        // Enhanced color palette matching linkpro.ma theme
        const colors = [
            '#312783', // Primary blue
            '#E23216', // Primary orange
            '#10b981', // Green
            '#8b5cf6', // Purple
            '#f59e0b', // Amber
            '#ef4444'  // Red
        ];

        trafficChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 4,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { 
                                size: 12,
                                family: 'Poppins',
                                weight: '500'
                            },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(49, 39, 131, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 12,
                        padding: 16,
                        titleFont: {
                            family: 'Poppins',
                            weight: '600'
                        },
                        bodyFont: {
                            family: 'Poppins',
                            weight: '400'
                        },
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                return `${label}: ${value} clicks (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log('Traffic chart updated with enhanced styling');
        
    } catch (error) {
        console.error('Error updating traffic chart:', error);
        showError('Failed to update traffic chart');
    }
}

async function updateTimeChart(timeData) {
    const canvas = document.getElementById('timeChart');
    if (!canvas) {
        console.error('Time chart canvas not found');
        return;
    }

    try {
        // Destroy existing chart
        if (timeChart) {
            timeChart.destroy();
            timeChart = null;
        }

        const ctx = canvas.getContext('2d');
        
        // Prepare data
        const labels = timeData.data.map(d => {
            const date = new Date(d.period);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const clicksData = timeData.data.map(d => d.clicks);
        const viewsData = timeData.data.map(d => d.views);

        timeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Clicks',
                        data: clicksData,
                        borderColor: '#312783',
                        backgroundColor: 'rgba(49, 39, 131, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3,
                        pointBackgroundColor: '#312783',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Views',
                        data: viewsData,
                        borderColor: '#E23216',
                        backgroundColor: 'rgba(226, 50, 22, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 3,
                        pointBackgroundColor: '#E23216',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1500,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { 
                                size: 12,
                                family: 'Poppins',
                                weight: '500'
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(49, 39, 131, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 12,
                        padding: 16,
                        titleFont: {
                            family: 'Poppins',
                            weight: '600'
                        },
                        bodyFont: {
                            family: 'Poppins',
                            weight: '400'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(49, 39, 131, 0.1)',
                            borderDash: [5, 5]
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                weight: '400'
                            },
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                weight: '400'
                            },
                            color: '#666'
                        }
                    }
                }
            }
        });

        console.log('Time chart updated with enhanced styling');
        
    } catch (error) {
        console.error('Error updating time chart:', error);
        showError('Failed to update time chart');
    }
}

async function updateLinksTable(profileData) {
    const tbody = document.getElementById('linksTableBody');
    if (!tbody) return;

    try {
        tbody.innerHTML = '';
        
        if (!profileData.links_analytics || profileData.links_analytics.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
                            <span class="text">No links data available</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        profileData.links_analytics.forEach((link, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-all duration-200';
            
            const isTopPerformer = index === 0;
            const trendLabel = isTopPerformer ? 'Top Performer' : 'Active';
            const badgeClass = isTopPerformer ? 'badge-top' : 'badge-active';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-custom text-white font-bold text-lg">
                        ${link.position}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm title text-blue-custom">${escapeHtml(link.title)}</div>
                    <div class="text-xs text text-gray-500 mt-1">
                        <i class="fas fa-link mr-1"></i>
                        ${link.url.length > 40 ? link.url.substring(0, 40) + '...' : link.url}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-lg title text-orange-custom">
                        ${link.metrics.total_clicks.toLocaleString()}
                    </span>
                    <div class="text-xs text text-gray-500">clicks</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-lg title text-blue-custom">
                        ${link.metrics.click_through_rate.toFixed(1)}%
                    </span>
                    <div class="text-xs text text-gray-500">CTR</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="${badgeClass}">
                        <i class="fas ${isTopPerformer ? 'fa-trophy' : 'fa-chart-line'} mr-1"></i>
                        ${trendLabel}
                    </span>
                </td>
            `;
            
            // Add staggered animation
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            tbody.appendChild(row);
            
            setTimeout(() => {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, index * 100);
        });
        
    } catch (error) {
        console.error('Error updating links table:', error);
    }
}

function updateRecommendations(timeData) {
    const element = document.getElementById('recommendationText');
    if (!element) return;

    try {
        let recommendationText;
        
        if (timeData.best_time_recommendation) {
            recommendationText = timeData.best_time_recommendation + 
                '. Consider scheduling your content during peak engagement times for maximum visibility.';
        } else {
            recommendationText = 'Keep tracking your analytics to discover optimal posting times and improve engagement.';
        }
        
        // Typewriter effect for recommendations
        typewriterEffect(element, recommendationText);
        
    } catch (error) {
        console.error('Error updating recommendations:', error);
        element.textContent = 'Analytics recommendations will appear here as data becomes available.';
    }
}

// Typewriter effect for text
function typewriterEffect(element, text, speed = 50) {
    element.textContent = '';
    let i = 0;
    
    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

// Enhanced Utility Functions
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        // Add a subtle animation when updating
        element.style.transform = 'scale(1.05)';
        element.textContent = value;
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
}

function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        if (show) {
            indicator.classList.remove('hidden');
            indicator.style.animation = 'slideIn 0.3s ease-out';
        } else {
            indicator.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 300);
        }
    }
}

function showError(message) {
    // Remove existing error toasts
    const existingToasts = document.querySelectorAll('.error-toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create new error toast with enhanced styling
    const toast = document.createElement('div');
    toast.className = 'error-toast fixed top-20 right-4 px-6 py-4 shadow-lg z-50';
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-3 text-lg"></i>
            <span class="title">${escapeHtml(message)}</span>
            <button class="ml-4 text-white hover:text-gray-200 transition-colors" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times text-lg"></i>
            </button>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-4 bg-gradient-custom px-6 py-4 rounded-xl shadow-lg z-50 text-white';
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-3 text-lg"></i>
            <span class="title">${escapeHtml(message)}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

function updateLastRefreshTime() {
    const element = document.getElementById('lastUpdate');
    if (element) {
        const now = new Date();
        element.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        
        // Add a subtle pulse effect
        element.style.color = '#10b981';
        setTimeout(() => {
            element.style.color = '';
        }, 1000);
    }
}

function resizeCharts() {
    if (trafficChart) {
        trafficChart.resize();
    }
    if (timeChart) {
        timeChart.resize();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getErrorMessage(error) {
    if (error.message.includes('fetch')) {
        return 'Cannot connect to analytics API. Please ensure the server is running on http://localhost:8000';
    }
    if (error.message.includes('404')) {
        return 'Analytics endpoint not found. Please check your API configuration.';
    }
    if (error.message.includes('500')) {
        return 'Server error occurred. Please check the API logs.';
    }
    return `Error loading analytics data: ${error.message}`;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function cleanup() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    if (trafficChart) {
        trafficChart.destroy();
        trafficChart = null;
    }
    
    if (timeChart) {
        timeChart.destroy();
        timeChart = null;
    }
    
    console.log('Dashboard cleanup completed');
}