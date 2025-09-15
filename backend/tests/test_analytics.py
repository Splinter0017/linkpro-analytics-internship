import requests
import json
from datetime import datetime, timedelta
import random
import time

# Configuration
BASE_URL = "http://localhost:8000"
TEST_PROFILE_ID = 1  # Ensure this profile exists in your database

class AnalyticsTestSuite:
    def __init__(self):
        self.base_url = BASE_URL
        self.profile_id = TEST_PROFILE_ID
        
    def test_connection(self):
        """Test if the API is running"""
        try:
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                print("API connection successful")
                print(f"Status: {response.json().get('status')}")
                return True
            else:
                print("API connection failed")
                return False
        except Exception as e:
            print(f"API connection error: {e}")
            return False
    
    def generate_test_data(self, num_clicks=50, num_views=100):
        """Generate sample click and view data for testing"""
        print(f"\nGenerating {num_clicks} clicks and {num_views} views...")
        
        # Sample referrers for traffic source testing
        referrers = [
            "https://instagram.com",
            "https://tiktok.com",
            "https://twitter.com",
            "https://t.co/abc123",
            "",  # Direct traffic
            "https://google.com",
            "https://facebook.com"
        ]
        
        success_count = 0
        
        # Generate page views
        for i in range(num_views):
            try:
                referrer = random.choice(referrers)
                response = requests.post(
                    f"{self.base_url}/api/track/view",
                    params={
                        "profile_id": self.profile_id,
                        "referrer": referrer if referrer else None
                    }
                )
                if response.status_code == 200:
                    success_count += 1
                
                time.sleep(random.uniform(0.1, 0.3))
                
            except Exception as e:
                print(f"Error generating view {i}: {e}")
        
        # Generate clicks (assume link_id=1 exists)
        for i in range(num_clicks):
            try:
                referrer = random.choice(referrers)
                response = requests.post(
                    f"{self.base_url}/api/track/click",
                    params={
                        "link_id": 1,  # Assuming first link exists
                        "profile_id": self.profile_id,
                        "referrer": referrer if referrer else None
                    }
                )
                if response.status_code == 200:
                    success_count += 1
                
                time.sleep(random.uniform(0.1, 0.3))
                
            except Exception as e:
                print(f"Error generating click {i}: {e}")
        
        print(f"Generated test data: {success_count}/{num_clicks + num_views} events successful")
    
    def test_profile_analytics(self):
        """Test the profile analytics endpoint"""
        print("\nTesting profile analytics...")
        
        try:
            response = requests.get(f"{self.base_url}/api/analytics/profile/{self.profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                print("Profile analytics working")
                print(f"Total clicks: {data['total_metrics']['total_clicks']}")
                print(f"Total views: {data['total_metrics']['total_views']}")
                print(f"CTR: {data['total_metrics']['click_through_rate']}%")
                print(f"Links analyzed: {len(data['links_analytics'])}")
                return True
            else:
                print(f"Profile analytics failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"Profile analytics error: {e}")
            return False
    
    def test_traffic_analytics(self):
        """Test the traffic source analytics endpoint"""
        print("\nTesting traffic source analytics...")
        
        try:
            response = requests.get(f"{self.base_url}/api/analytics/traffic/{self.profile_id}")
            
            if response.status_code == 200:
                data = response.json()
                print("Traffic analytics working")
                print(f"Total clicks tracked: {data['total_clicks']}")
                print(f"Total views tracked: {data['total_views']}")
                print(f"Traffic sources found: {len(data['sources'])}")
                
                for source in data['sources'][:3]:  # Show top 3
                    print(f"- {source['source']}: {source['clicks']} clicks ({source['percentage']}%)")
                
                return True
            else:
                print(f"Traffic analytics failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"Traffic analytics error: {e}")
            return False
    
    def test_time_analytics(self):
        """Test the time-based analytics endpoint"""
        print("\nTesting time analytics...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/analytics/time/{self.profile_id}",
                params={"granularity": "daily"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("Time analytics working")
                print(f"Granularity: {data['granularity']}")
                print(f"Data points: {len(data['data'])}")
                
                if data['peak_day']:
                    print(f"Peak day: {data['peak_day']}")
                
                if data['best_time_recommendation']:
                    print(f"Recommendation: {data['best_time_recommendation']}")
                
                return True
            else:
                print(f"Time analytics failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"Time analytics error: {e}")
            return False
    
    def test_quick_stats(self):
        """Test the quick stats endpoint"""
        print("\nTesting quick stats...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/analytics/quick-stats/{self.profile_id}",
                params={"days": 7}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("Quick stats working")
                print(f"Period: {data['period_days']} days")
                print(f"Total clicks: {data['summary']['total_clicks']}")
                print(f"Total views: {data['summary']['total_views']}")
                print(f"CTR: {data['summary']['click_through_rate']}%")
                
                if data['top_performing_link']:
                    print(f"Top link: {data['top_performing_link']['title']}")
                
                return True
            else:
                print(f"Quick stats failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"Quick stats error: {e}")
            return False
    
    def test_period_comparison(self):
        """Test the period comparison endpoint"""
        print("\nTesting period comparison...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/analytics/compare/{self.profile_id}",
                params={"current_days": 7, "previous_days": 7}
            )
            
            if response.status_code == 200:
                data = response.json()
                print("Period comparison working")
                print(f"Current period clicks: {data['current_period']['metrics']['total_clicks']}")
                print(f"Previous period clicks: {data['previous_period']['metrics']['total_clicks']}")
                print(f"Change in clicks: {data['changes']['clicks']['absolute']} ({data['changes']['clicks']['percentage']}%)")
                return True
            else:
                print(f"Period comparison failed: {response.status_code}")
                print(f"Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"Period comparison error: {e}")
            return False
    
    def run_all_tests(self, generate_data=True):
        """Run the complete test suite"""
        print("=" * 50)
        print("LINKPRO ANALYTICS TEST SUITE")
        print("=" * 50)
        
        results = []
        
        # Test connection
        results.append(("Connection", self.test_connection()))
        
        # Generate test data if requested
        if generate_data:
            print("\nGenerating test data to ensure meaningful results...")
            self.generate_test_data(num_clicks=25, num_views=50)
        
        # Run analytics tests
        results.append(("Profile Analytics", self.test_profile_analytics()))
        results.append(("Traffic Analytics", self.test_traffic_analytics()))
        results.append(("Time Analytics", self.test_time_analytics()))
        results.append(("Quick Stats", self.test_quick_stats()))
        results.append(("Period Comparison", self.test_period_comparison()))
        
        # Summary
        print("\n" + "=" * 50)
        print("TEST RESULTS SUMMARY")
        print("=" * 50)
        
        passed = 0
        for test_name, result in results:
            status = "PASS" if result else "FAIL"
            print(f"{test_name:<20}: {status}")
            if result:
                passed += 1
        
        print(f"\nOverall: {passed}/{len(results)} tests passed")
        
        if passed == len(results):
            print("\nAll tests passed. The analytics system is working correctly.")
            print("\nNext steps:")
            print("- Visit http://localhost:8000/docs to explore the API")
            print("- Test with real data from your LinkPro frontend")
            print("- Start building the dashboard (Week 3)")
        else:
            print("\nSome tests failed. Check the errors above and resolve them before proceeding.")

if __name__ == "__main__":
    # Run the test suite
    tester = AnalyticsTestSuite()
    
    print("Starting LinkPro Analytics Test Suite...")
    print(f"Testing against: {BASE_URL}")
    print(f"Using profile ID: {TEST_PROFILE_ID}")
    print("\nEnsure your API server is running.")
    print("Command: python src/main.py")
    
    input("\nPress Enter to continue...")
    
    tester.run_all_tests(generate_data=True)