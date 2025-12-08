#!/usr/bin/env python3
"""
Nexus Lore Backend API Testing Suite
Tests all CRUD operations, graph data, stats, tags, and export functionality
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

class NexusLoreAPITester:
    def __init__(self, base_url="https://loreatlas.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_entities = []
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, data: Dict = None) -> tuple:
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                if response.text:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success and response.content:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            return success, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_entity_crud(self):
        """Test entity CRUD operations"""
        print("\n🔍 Testing Entity CRUD Operations...")
        
        # Test entity creation
        test_entities = [
            {
                "name": "Test Character",
                "entity_type": "character",
                "content": "<p>A brave warrior from the northern lands.</p>",
                "theme": "fantasy",
                "tags": ["warrior", "north", "brave"],
                "connections": []
            },
            {
                "name": "Test Place",
                "entity_type": "place",
                "content": "<p>A mystical forest filled with ancient magic.</p>",
                "theme": "fantasy",
                "tags": ["forest", "magic", "ancient"],
                "connections": []
            },
            {
                "name": "Test Event",
                "entity_type": "event",
                "content": "<p>The great battle that changed everything.</p>",
                "theme": "fantasy",
                "tags": ["battle", "war", "historic"],
                "connections": []
            }
        ]

        # Create entities
        for entity_data in test_entities:
            success, response = self.run_test(
                f"Create Entity ({entity_data['entity_type']})",
                "POST",
                "entities",
                201,
                entity_data
            )
            if success and 'id' in response:
                self.created_entities.append(response['id'])

        # Test invalid entity creation
        invalid_entity = {
            "name": "Invalid Entity",
            "entity_type": "invalid_type",
            "content": "Test content",
            "theme": "fantasy"
        }
        self.run_test("Create Invalid Entity Type", "POST", "entities", 400, invalid_entity)

        # Test invalid theme
        invalid_theme = {
            "name": "Invalid Theme Entity",
            "entity_type": "character",
            "content": "Test content",
            "theme": "invalid_theme"
        }
        self.run_test("Create Invalid Theme", "POST", "entities", 400, invalid_theme)

        # Test getting all entities
        self.run_test("Get All Entities", "GET", "entities", 200)

        # Test getting entities with filters
        self.run_test("Get Entities by Type", "GET", "entities?entity_type=character", 200)
        self.run_test("Get Entities by Tag", "GET", "entities?tag=warrior", 200)
        self.run_test("Search Entities", "GET", "entities?search=Test", 200)

        # Test getting individual entities
        for entity_id in self.created_entities:
            self.run_test(f"Get Entity {entity_id}", "GET", f"entities/{entity_id}", 200)

        # Test updating entities
        if self.created_entities:
            entity_id = self.created_entities[0]
            update_data = {
                "name": "Updated Test Character",
                "content": "<p>Updated content for the character.</p>",
                "tags": ["warrior", "north", "brave", "updated"]
            }
            self.run_test(f"Update Entity {entity_id}", "PUT", f"entities/{entity_id}", 200, update_data)

        # Test getting non-existent entity
        self.run_test("Get Non-existent Entity", "GET", "entities/non-existent-id", 404)

        # Test updating non-existent entity
        self.run_test("Update Non-existent Entity", "PUT", "entities/non-existent-id", 404, {"name": "Test"})

    def test_connections(self):
        """Test entity connections"""
        print("\n🔍 Testing Entity Connections...")
        
        if len(self.created_entities) >= 2:
            # Create connection between first two entities
            entity1_id = self.created_entities[0]
            entity2_id = self.created_entities[1]
            
            connection_data = {
                "connections": [
                    {"entity_id": entity2_id, "relationship": "allies"}
                ]
            }
            
            success, _ = self.run_test(
                "Create Entity Connection",
                "PUT",
                f"entities/{entity1_id}",
                200,
                connection_data
            )
            
            if success:
                # Verify connection was created
                success, response = self.run_test(
                    "Verify Connection Created",
                    "GET",
                    f"entities/{entity1_id}",
                    200
                )
                if success and 'connections' in response:
                    has_connection = any(c['entity_id'] == entity2_id for c in response['connections'])
                    self.log_test("Connection Exists in Entity", has_connection, 
                                f"Expected connection to {entity2_id}")

    def test_graph_data(self):
        """Test graph data endpoint"""
        print("\n🔍 Testing Graph Data...")
        
        success, response = self.run_test("Get Graph Data", "GET", "graph", 200)
        if success:
            # Verify graph structure
            has_nodes = 'nodes' in response and isinstance(response['nodes'], list)
            has_links = 'links' in response and isinstance(response['links'], list)
            
            self.log_test("Graph Has Nodes", has_nodes, "Graph should have nodes array")
            self.log_test("Graph Has Links", has_links, "Graph should have links array")
            
            # Test filtered graph data
            self.run_test("Get Filtered Graph Data", "GET", "graph?entity_type=character", 200)

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        print("\n🔍 Testing Stats Endpoint...")
        
        success, response = self.run_test("Get Stats", "GET", "stats", 200)
        if success:
            # Verify stats structure
            has_by_type = 'by_type' in response and isinstance(response['by_type'], dict)
            has_total = 'total' in response and isinstance(response['total'], int)
            
            self.log_test("Stats Has by_type", has_by_type, "Stats should have by_type dict")
            self.log_test("Stats Has total", has_total, "Stats should have total count")

    def test_tags_endpoint(self):
        """Test tags endpoint"""
        print("\n🔍 Testing Tags Endpoint...")
        
        success, response = self.run_test("Get Tags", "GET", "tags", 200)
        if success:
            # Verify tags structure
            is_list = isinstance(response, list)
            self.log_test("Tags is List", is_list, "Tags should return a list")
            
            if is_list and len(response) > 0:
                first_tag = response[0]
                has_tag_field = 'tag' in first_tag
                has_count_field = 'count' in first_tag
                
                self.log_test("Tag Has tag Field", has_tag_field, "Each tag should have 'tag' field")
                self.log_test("Tag Has count Field", has_count_field, "Each tag should have 'count' field")

    def test_export_endpoint(self):
        """Test export endpoint"""
        print("\n🔍 Testing Export Endpoint...")
        
        success, response = self.run_test("Export Data", "GET", "export", 200)
        if success:
            # Verify export structure
            has_entities = 'entities' in response and isinstance(response['entities'], list)
            has_exported_at = 'exported_at' in response
            
            self.log_test("Export Has Entities", has_entities, "Export should have entities array")
            self.log_test("Export Has Timestamp", has_exported_at, "Export should have exported_at timestamp")

    def test_delete_entities(self):
        """Test entity deletion"""
        print("\n🔍 Testing Entity Deletion...")
        
        # Delete created entities (except keep one for final verification)
        entities_to_delete = self.created_entities[:-1] if len(self.created_entities) > 1 else []
        
        for entity_id in entities_to_delete:
            self.run_test(f"Delete Entity {entity_id}", "DELETE", f"entities/{entity_id}", 200)
            
            # Verify entity is deleted
            self.run_test(f"Verify Entity Deleted {entity_id}", "GET", f"entities/{entity_id}", 404)

        # Test deleting non-existent entity
        self.run_test("Delete Non-existent Entity", "DELETE", "entities/non-existent-id", 404)

    def cleanup(self):
        """Clean up remaining test entities"""
        print("\n🧹 Cleaning up test entities...")
        for entity_id in self.created_entities:
            try:
                requests.delete(f"{self.base_url}/entities/{entity_id}", timeout=5)
            except:
                pass

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Nexus Lore Backend API Tests")
        print(f"🎯 Testing against: {self.base_url}")
        print("=" * 60)

        try:
            self.test_health_endpoints()
            self.test_entity_crud()
            self.test_connections()
            self.test_graph_data()
            self.test_stats_endpoint()
            self.test_tags_endpoint()
            self.test_export_endpoint()
            self.test_delete_entities()
            
        except KeyboardInterrupt:
            print("\n⚠️ Tests interrupted by user")
        except Exception as e:
            print(f"\n💥 Unexpected error: {str(e)}")
        finally:
            self.cleanup()

        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Return results for further processing
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    tester = NexusLoreAPITester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    return 0 if results["failed_tests"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())