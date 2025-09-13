class LazyLoader {
    constructor() {
        this.loaded = new Set();
        this.callbacks = new Map();
        this.chartJsLoaded = false;
        this.setupObserver();
    }

    setupObserver() {
        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    const loadType = section.dataset.load;
                    
                    if (!this.loaded.has(loadType)) {
                        this.loadSection(loadType, section);
                    }
                }
            });
        }, options);

        // Start observing lazy sections
        document.querySelectorAll('.lazy-section').forEach(section => {
            this.observer.observe(section);
        });
    }

    async loadSection(type, element) {
        console.log(`Lazy loading: ${type}`);
        this.loaded.add(type);

        switch(type) {
            case 'charts':
                await this.loadCharts(element);
                break;
            case 'table':
                this.loadTable(element);
                break;
            case 'activity':
                this.loadActivity(element);
                break;
        }

        // Stop observing this element
        this.observer.unobserve(element);
    }

    async loadCharts(element) {
        // First, load Chart.js if not already loaded
        if (!this.chartJsLoaded) {
            await this.loadChartJs();
        }

        // Hide skeleton loaders and show canvases
        element.querySelectorAll('.skeleton-loader').forEach(loader => {
            loader.style.display = 'none';
        });

        element.querySelectorAll('canvas').forEach(canvas => {
            canvas.style.display = 'block';
        });

        // Trigger chart rendering if dashboard is ready
        if (window.dashboardInstance && window.dashboardInstance.chartsData) {
            window.dashboardInstance.renderCharts();
        }
    }

    loadChartJs() {
        return new Promise((resolve, reject) => {
            if (this.chartJsLoaded) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = () => {
                this.chartJsLoaded = true;
                console.log('Chart.js loaded');
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadTable(element) {
        const loader = element.querySelector('#tableLoader');
        const table = element.querySelector('#linksTable');
        
        if (loader) loader.style.display = 'none';
        if (table) table.style.display = 'table';

        // Trigger table data loading if needed
        if (window.dashboardInstance && window.dashboardInstance.tableData) {
            window.dashboardInstance.renderTable();
        }
    }

    loadActivity(element) {
        const loader = element.querySelector('#activityLoader');
        const list = element.querySelector('#activityList');
        
        if (loader) loader.style.display = 'none';
        if (list) list.style.display = 'block';

        // Trigger activity feed loading if needed
        if (window.dashboardInstance && window.dashboardInstance.activityData) {
            window.dashboardInstance.renderActivityFeed();
        }
    }

    // Method to manually trigger loading of a section
    forceLoad(type) {
        const section = document.querySelector(`[data-load="${type}"]`);
        if (section && !this.loaded.has(type)) {
            this.loadSection(type, section);
        }
    }
}

// Initialize lazy loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new LazyLoader();
});