// Add this at the beginning of api.js, before the AnalyticsAPI class
class DataCache {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute
    }

    set(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clear() {
        this.cache.clear();
    }

    generateKey(endpoint, params) {
        return `${endpoint}_${JSON.stringify(params)}`;
    }
}

// Now modify the AnalyticsAPI class to use caching
class AnalyticsAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.cache = new DataCache(); // Add cache instance
    }

    async fetchProfileAnalytics(profileId, startDate = null, endDate = null) {
        // Generate cache key
        const cacheKey = this.cache.generateKey('profile', {profileId, startDate, endDate});
        
        // Check cache first
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            console.log('Returning cached profile analytics');
            return cachedData;
        }

        // If not in cache, fetch from API
        let url = `${this.baseURL}/analytics/profile/${profileId}`;
        const params = new URLSearchParams();
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Store in cache before returning
            this.cache.set(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Error fetching profile analytics:', error);
            throw error;
        }
    }

    async fetchTrafficAnalytics(profileId, startDate = null, endDate = null) {
        // Generate cache key
        const cacheKey = this.cache.generateKey('traffic', {profileId, startDate, endDate});
        
        // Check cache first
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            console.log('Returning cached traffic analytics');
            return cachedData;
        }

        let url = `${this.baseURL}/analytics/traffic/${profileId}`;
        const params = new URLSearchParams();
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Store in cache
            this.cache.set(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Error fetching traffic analytics:', error);
            throw error;
        }
    }

    async fetchTimeAnalytics(profileId, granularity = 'daily', startDate = null, endDate = null) {
        // Generate cache key
        const cacheKey = this.cache.generateKey('time', {profileId, granularity, startDate, endDate});
        
        // Check cache first
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            console.log('Returning cached time analytics');
            return cachedData;
        }

        let url = `${this.baseURL}/analytics/time/${profileId}`;
        const params = new URLSearchParams();
        
        params.append('granularity', granularity);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        url += `?${params.toString()}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Store in cache
            this.cache.set(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Error fetching time analytics:', error);
            throw error;
        }
    }

    async fetchQuickStats(profileId, days = 7) {
        // Generate cache key
        const cacheKey = this.cache.generateKey('quickstats', {profileId, days});
        
        // Check cache first
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            console.log('Returning cached quick stats');
            return cachedData;
        }

        const url = `${this.baseURL}/analytics/quick-stats/${profileId}?days=${days}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Store in cache
            this.cache.set(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Error fetching quick stats:', error);
            throw error;
        }
    }

    async fetchComparison(profileId, currentDays = 7, previousDays = 7) {
        // Generate cache key
        const cacheKey = this.cache.generateKey('comparison', {profileId, currentDays, previousDays});
        
        // Check cache first
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            console.log('Returning cached comparison');
            return cachedData;
        }

        const url = `${this.baseURL}/analytics/compare/${profileId}?current_days=${currentDays}&previous_days=${previousDays}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Store in cache
            this.cache.set(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Error fetching comparison:', error);
            throw error;
        }
    }

    // Add method to clear cache when needed
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }
}