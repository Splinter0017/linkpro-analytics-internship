// LinkPro Analytics Dashboard JavaScript

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

// Setup event listeners
function setupEventListeners() {
    const refreshBtn = document.getElementById('refreshBtn');
    const profileSelector = document.getElementById('profileSelector');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }
    
    if (profileSelector) {
        profileSelector.addEventListener('change', function(e) {
            profileId = parseInt(e.target.value);
            refreshData();
        });
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    // Handle window resize for charts
    window.addEventListener('resize', debounce(resizeCharts, 250));
}

// Start auto-refresh timer
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    refreshInterval = setInterval(refreshData, 30000); // 30 seconds
}

// Main data refresh function
async function refreshData() {
    if (isLoading) {
        console.log('Already loading, skipping refresh...');
        return;
    }

    isLoading = true;
    showLoading(true);
    
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
        
        // Update UI
        updateQuickStats(quickStats, comparison);
        updateTrafficChart(traffic);
        updateTimeChart(timeData);
        updateLinksTable(profileData);
        updateRecommendations(timeData);
        updateLastRefreshTime();
        
        console.log('Data refresh completed');
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        showError(getErrorMessage(error));
    } finally {
        isLoading = false;
        showLoading(false);
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

// UI Update Functions
function updateQuickStats(stats, comparison) {
    try {
        // Update main numbers
        updateElement('totalClicks', stats.summary.total_clicks.toLocaleString());
        updateElement('totalViews', stats.summary.total_views.toLocaleString());
        updateElement('ctr', stats.summary.click_through_rate.toFixed(1) + '%');
        updateElement('uniqueVisitors', stats.summary.unique_visitors.toLocaleString());
        
        // Update change indicators
        updateChangeIndicator('clicksChange', comparison.changes.clicks);
        updateChangeIndicator('viewsChange', comparison.changes.views);
        updateChangeIndicator('ctrChange', comparison.changes.ctr);
        
    } catch (error) {
        console.error('Error updating quick stats:', error);
    }
}

function updateChangeIndicator(elementId, change) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const isPositive = change.percentage >= 0;
    const icon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';
    
    element.className = colorClass;
    element.innerHTML = `<i class="fas ${icon}"></i> ${Math.abs(change.percentage).toFixed(1)}%`;
}

function updateTrafficChart(trafficData) {
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
        const colors = ['#E1306C', '#000000', '#1DA1F2', '#10B981', '#6B7280'];

        trafficChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        padding: 12,
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

        console.log('Traffic chart updated');
        
    } catch (error) {
        console.error('Error updating traffic chart:', error);
        showError('Failed to update traffic chart');
    }
}

function updateTimeChart(timeData) {
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
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Views',
                        data: viewsData,
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        console.log('Time chart updated');
        
    } catch (error) {
        console.error('Error updating time chart:', error);
        showError('Failed to update time chart');
    }
}

function updateLinksTable(profileData) {
    const tbody = document.getElementById('linksTableBody');
    if (!tbody) return;

    try {
        tbody.innerHTML = '';
        
        if (!profileData.links_analytics || profileData.links_analytics.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No links data available
                    </td>
                </tr>
            `;
            return;
        }
        
        profileData.links_analytics.forEach((link, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition';
            
            const trendLabel = index === 0 ? 'Top Performer' : 'Active';
            const trendClass = index === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                        ${link.position}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(link.title)}</div>
                    <div class="text-xs text-gray-500">
                        ${link.url.length > 40 ? link.url.substring(0, 40) + '...' : link.url}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${link.metrics.total_clicks.toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${link.metrics.click_through_rate.toFixed(1)}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trendClass}">
                        ${trendLabel}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error updating links table:', error);
    }
}

function updateRecommendations(timeData) {
    const element = document.getElementById('recommendationText');
    if (!element) return;

    try {
        if (timeData.best_time_recommendation) {
            element.textContent = timeData.best_time_recommendation + 
                '. Consider scheduling your content during peak engagement times for maximum visibility.';
        } else {
            element.textContent = 'Keep tracking your analytics to discover optimal posting times and improve engagement.';
        }
    } catch (error) {
        console.error('Error updating recommendations:', error);
        element.textContent = 'Analytics recommendations will appear here as data becomes available.';
    }
}

// Utility Functions
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        if (show) {
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    }
}

function showError(message) {
    // Remove existing error toasts
    const existingToasts = document.querySelectorAll('.error-toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create new error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>${escapeHtml(message)}</span>
            <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

function updateLastRefreshTime() {
    const element = document.getElementById('lastUpdate');
    if (element) {
        const now = new Date();
        element.textContent = `Last updated: ${now.toLocaleTimeString()}`;
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