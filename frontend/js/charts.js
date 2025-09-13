class ChartManager {
    constructor() {
        this.charts = {};
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        };
    }

    createTimeChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const chartData = {
            labels: data.data.map(item => {
                const date = new Date(item.period);
                return date.toLocaleDateString();
            }),
            datasets: [
                {
                    label: 'Clicks',
                    data: data.data.map(item => item.clicks),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Views',
                    data: data.data.map(item => item.views),
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    tension: 0.4
                }
            ]
        };

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createTrafficChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const chartData = {
            labels: data.sources.map(source => 
                source.source.charAt(0).toUpperCase() + source.source.slice(1)
            ),
            datasets: [{
                data: data.sources.map(source => source.clicks),
                backgroundColor: [
                    '#667eea',
                    '#48bb78',
                    '#ed8936',
                    '#38b2ac',
                    '#f56565'
                ]
            }]
        };

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                ...this.defaultOptions,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    createLinksChart(canvasId, linksData) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const sortedLinks = linksData.sort((a, b) => 
            b.metrics.total_clicks - a.metrics.total_clicks
        ).slice(0, 5);

        const chartData = {
            labels: sortedLinks.map(link => link.title),
            datasets: [{
                label: 'Clicks',
                data: sortedLinks.map(link => link.metrics.total_clicks),
                backgroundColor: '#667eea',
                borderColor: '#5a67d8',
                borderWidth: 1
            }]
        };

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                ...this.defaultOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createHourlyChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        const hourlyData = new Array(24).fill(0);
        
        data.data.forEach(item => {
            const hour = new Date(item.period).getHours();
            hourlyData[hour] += item.clicks;
        });

        const chartData = {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Clicks by Hour',
                data: hourlyData,
                backgroundColor: 'rgba(102, 126, 234, 0.5)',
                borderColor: '#667eea',
                borderWidth: 1
            }]
        };

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                ...this.defaultOptions,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateAllCharts(profileData, trafficData, timeData, hourlyData) {
        if (timeData && timeData.data) {
            this.createTimeChart('timeChart', timeData);
        }
        
        if (trafficData && trafficData.sources) {
            this.createTrafficChart('trafficChart', trafficData);
        }
        
        if (profileData && profileData.links_analytics) {
            this.createLinksChart('linksChart', profileData.links_analytics);
        }
        
        if (hourlyData && hourlyData.data) {
            this.createHourlyChart('hourlyChart', hourlyData);
        }
    }
}