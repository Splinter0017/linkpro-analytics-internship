class Dashboard {
    constructor() {
        this.api = new AnalyticsAPI();
        this.chartManager = new ChartManager();
        this.profileId = 1;
        this.refreshInterval = null;
        this.forceRefresh = false;
        
        // Store data for lazy loading
        this.chartsData = null;
        this.tableData = null;
        this.activityData = null;
        
        // Make dashboard instance globally accessible for lazy loader
        window.dashboardInstance = this;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    async loadDashboard() {
        try {
            this.showLoading();
            this.updateCacheIndicator(false); // Show loading state
            
            if (this.forceRefresh) {
                this.api.clearCache();
                this.forceRefresh = false;
            }
            
            const startDate = document.getElementById('startDate').value || null;
            const endDate = document.getElementById('endDate').value || null;

            // Load critical data first (metric cards)
            const quickStats = await this.api.fetchQuickStats(this.profileId, 7);
            const comparison = await this.api.fetchComparison(this.profileId, 7, 7);
            
            // Update metric cards immediately
            this.updateMetricCardsQuick(quickStats, comparison);
            
            // Then load the rest of the data
            const [profileData, trafficData, timeData, hourlyData] = 
                await Promise.all([
                    this.api.fetchProfileAnalytics(this.profileId, startDate, endDate),
                    this.api.fetchTrafficAnalytics(this.profileId, startDate, endDate),
                    this.api.fetchTimeAnalytics(this.profileId, 'daily', startDate, endDate),
                    this.api.fetchTimeAnalytics(this.profileId, 'hourly', startDate, endDate)
                ]);

            // Store data for lazy loading
            this.chartsData = { profileData, trafficData, timeData, hourlyData };
            this.tableData = profileData.links_analytics;
            this.activityData = profileData;

            // Update full metric cards
            this.updateMetricCards(profileData, quickStats, comparison);
            
            // Only render visible sections immediately
            this.renderVisibleSections();
            
            this.hideLoading();
            this.updateCacheIndicator(true);
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showError('Failed to load analytics data. Please try again.');
            this.updateCacheIndicator(false);
        }
    }

    renderVisibleSections() {
        // Check if charts section is visible
        if (window.lazyLoader && window.lazyLoader.loaded.has('charts')) {
            this.renderCharts();
        }
        
        // Check if table is visible
        if (window.lazyLoader && window.lazyLoader.loaded.has('table')) {
            this.renderTable();
        }
        
        // Check if activity feed is visible
        if (window.lazyLoader && window.lazyLoader.loaded.has('activity')) {
            this.renderActivityFeed();
        }
    }

    renderCharts() {
        if (!this.chartsData) return;
        
        const { profileData, trafficData, timeData, hourlyData } = this.chartsData;
        this.chartManager.updateAllCharts(profileData, trafficData, timeData, hourlyData);
    }

    renderTable() {
        if (!this.tableData) return;
        this.updateLinksTable(this.tableData);
    }

    renderActivityFeed() {
        if (!this.activityData) return;
        this.updateActivityFeed(this.activityData);
    }

    updateMetricCardsQuick(quickStats, comparison) {
        // Quick update with just the essential data
        if (quickStats) {
            document.getElementById('totalClicks').textContent = 
                quickStats.summary.total_clicks.toLocaleString();
            document.getElementById('totalViews').textContent = 
                quickStats.summary.total_views.toLocaleString();
            document.getElementById('clickRate').textContent = 
                `${quickStats.summary.click_through_rate}%`;
                
            if (quickStats.top_performing_link) {
                document.getElementById('topLink').textContent = 
                    quickStats.top_performing_link.title;
                document.getElementById('topLinkClicks').textContent = 
                    `${quickStats.top_performing_link.clicks} clicks`;
            }
        }
        
        if (comparison && comparison.changes) {
            this.updateChangeIndicator('clicksChange', comparison.changes.clicks);
            this.updateChangeIndicator('viewsChange', comparison.changes.views);
            this.updateChangeIndicator('ctrChange', comparison.changes.ctr);
        }
    }

    updateCacheIndicator(cached) {
        const indicator = document.getElementById('cacheIndicator');
        if (indicator) {
            if (cached) {
                indicator.textContent = 'Cached';
                indicator.className = 'cache-indicator cached';
            } else {
                indicator.textContent = 'Loading...';
                indicator.className = 'cache-indicator loading';
            }
        }
    }

    
    updateChangeIndicator(elementId, change) {
        const element = document.getElementById(elementId);
        if (!element || !change) return;

        const isPositive = change.percentage >= 0;
        const arrow = isPositive ? '↑' : '↓';
        const sign = isPositive ? '+' : '';
        
        element.textContent = `${arrow} ${sign}${change.percentage}%`;
        element.className = `metric-change ${isPositive ? 'positive' : 'negative'}`;
    }
    updateLinksTable(links) {
        const tbody = document.getElementById('linksTableBody');
        tbody.innerHTML = '';

        links.forEach(link => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${link.position}</td>
                <td>${link.title}</td>
                <td><a href="${link.url}" target="_blank">${link.url}</a></td>
                <td>${link.metrics.total_clicks}</td>
                <td>${link.metrics.total_views}</td>
                <td>${link.metrics.click_through_rate}%</td>
            `;
        });
    }

    updateActivityFeed(profileData) {
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = '';

        const recentActivity = [
            {
                type: 'stat',
                message: `Total CTR: ${profileData.total_metrics.click_through_rate}%`,
                time: new Date().toLocaleTimeString()
            },
            {
                type: 'stat',
                message: `${profileData.links_analytics.length} active links`,
                time: new Date().toLocaleTimeString()
            },
            {
                type: 'update',
                message: 'Dashboard refreshed',
                time: new Date().toLocaleTimeString()
            }
        ];

        recentActivity.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div>${activity.message}</div>
                <div class="activity-time">${activity.time}</div>
            `;
            activityList.appendChild(item);
        });
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadDashboard();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    showLoading() {
        const container = document.querySelector('.dashboard-main');
        if (!document.querySelector('.loading')) {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading';
            loadingDiv.textContent = 'Loading analytics data...';
            container.prepend(loadingDiv);
        }
    }

    hideLoading() {
        const loadingDiv = document.querySelector('.loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showError(message) {
        this.hideLoading();
        const container = document.querySelector('.dashboard-main');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        container.prepend(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
class DataExporter {
    constructor() {
        this.addExportButtons();
    }

    addExportButtons() {
        const header = document.querySelector('.dashboard-header');
        const exportDiv = document.createElement('div');
        exportDiv.className = 'export-controls';
        exportDiv.innerHTML = `
            <button id="exportCSV" class="export-btn">Export CSV</button>
            <button id="exportPDF" class="export-btn">Export PDF</button>
        `;
        header.appendChild(exportDiv);

        document.getElementById('exportCSV').addEventListener('click', () => this.exportToCSV());
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
    }

    async exportToCSV() {
        const profileId = document.getElementById('profileId').value;
        const api = new AnalyticsAPI();
        const data = await api.fetchProfileAnalytics(profileId);
        
        let csv = 'Link Title,URL,Position,Clicks,Views,CTR\n';
        
        data.links_analytics.forEach(link => {
            csv += `"${link.title}","${link.url}",${link.position},`;
            csv += `${link.metrics.total_clicks},${link.metrics.total_views},`;
            csv += `${link.metrics.click_through_rate}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkpro_analytics_${profileId}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }

    exportToPDF() {
        // Simple print-to-PDF functionality
        window.print();
    }
}
class ComparisonView {
    constructor(chartManager) {
        this.chartManager = chartManager;
        this.setupComparisonControls();
    }

    setupComparisonControls() {
        const controlsHTML = `
            <div class="comparison-controls" style="display: none;">
                <h3>Comparison Mode</h3>
                <div class="period-selector">
                    <label>Period 1:</label>
                    <input type="date" id="compare-start-1">
                    <input type="date" id="compare-end-1">
                </div>
                <div class="period-selector">
                    <label>Period 2:</label>
                    <input type="date" id="compare-start-2">
                    <input type="date" id="compare-end-2">
                </div>
                <button id="runComparison">Compare</button>
                <button id="exitComparison">Exit Comparison</button>
            </div>
        `;
        
        const container = document.querySelector('.dashboard-header');
        container.insertAdjacentHTML('afterend', controlsHTML);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('runComparison').addEventListener('click', async () => {
            await this.runComparison();
        });

        document.getElementById('exitComparison').addEventListener('click', () => {
            this.exitComparisonMode();
        });
    }

    async runComparison() {
        const profileId = document.getElementById('profileId').value;
        const api = new AnalyticsAPI();
        
        const period1Start = document.getElementById('compare-start-1').value;
        const period1End = document.getElementById('compare-end-1').value;
        const period2Start = document.getElementById('compare-start-2').value;
        const period2End = document.getElementById('compare-end-2').value;

        const [data1, data2] = await Promise.all([
            api.fetchProfileAnalytics(profileId, period1Start, period1End),
            api.fetchProfileAnalytics(profileId, period2Start, period2End)
        ]);

        this.displayComparisonCharts(data1, data2);
    }

    displayComparisonCharts(data1, data2) {
        // Create comparison visualization
        const ctx = document.getElementById('timeChart').getContext('2d');
        
        const comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Period 1', 'Period 2'],
                datasets: [
                    {
                        label: 'Total Clicks',
                        data: [data1.total_metrics.total_clicks, data2.total_metrics.total_clicks],
                        backgroundColor: ['#667eea', '#48bb78']
                    },
                    {
                        label: 'Total Views',
                        data: [data1.total_metrics.total_views, data2.total_metrics.total_views],
                        backgroundColor: ['#9f7aea', '#68d391']
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Period Comparison'
                    }
                }
            }
        });
    }

    exitComparisonMode() {
        document.querySelector('.comparison-controls').style.display = 'none';
        // Reload normal dashboard
        new Dashboard().loadDashboard();
    }
}
class InsightsEngine {
    constructor() {
        this.insights = [];
    }

    analyzeData(profileData, trafficData, timeData) {
        this.insights = [];
        
        // Analyze CTR
        if (profileData.total_metrics.click_through_rate < 5) {
            this.insights.push({
                type: 'warning',
                title: 'Low Click-Through Rate',
                message: 'Your CTR is below 5%. Consider updating your link titles to be more engaging.',
                priority: 'high'
            });
        }

        // Analyze traffic sources
        const topSource = trafficData.sources[0];
        if (topSource && topSource.percentage > 70) {
            this.insights.push({
                type: 'info',
                title: 'Traffic Concentration',
                message: `${topSource.source} accounts for ${topSource.percentage}% of your traffic. Consider diversifying your promotion channels.`,
                priority: 'medium'
            });
        }

        // Analyze link performance
        const underperformingLinks = profileData.links_analytics.filter(
            link => link.metrics.click_through_rate < 2
        );
        
        if (underperformingLinks.length > 0) {
            this.insights.push({
                type: 'suggestion',
                title: 'Underperforming Links',
                message: `${underperformingLinks.length} links have CTR below 2%. Consider repositioning or removing them.`,
                priority: 'low'
            });
        }

        // Time-based insights
        if (timeData.best_time_recommendation) {
            this.insights.push({
                type: 'success',
                title: 'Best Posting Time',
                message: timeData.best_time_recommendation,
                priority: 'medium'
            });
        }

        this.displayInsights();
    }

    displayInsights() {
        const insightsHTML = `
            <section class="insights-panel">
                <h3>Smart Insights</h3>
                <div class="insights-list">
                    ${this.insights.map(insight => `
                        <div class="insight-card ${insight.type}">
                            <h4>${insight.title}</h4>
                            <p>${insight.message}</p>
                            <span class="priority ${insight.priority}">${insight.priority} priority</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
        
        const mainContainer = document.querySelector('.dashboard-main');
        const existingPanel = document.querySelector('.insights-panel');
        
        if (existingPanel) {
            existingPanel.outerHTML = insightsHTML;
        } else {
            mainContainer.insertAdjacentHTML('afterbegin', insightsHTML);
        }
    }
}