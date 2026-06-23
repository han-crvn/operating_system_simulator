import os
import sys
import unittest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)

from app import app


class RouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_main_routes_available(self):
        routes = [
            '/','/cpu_scheduling','/virtual_memory','/contacts','/projects'
        ]

        for route in routes:
            with self.subTest(route=route):
                response = self.client.get(route)
                self.assertEqual(response.status_code, 200,
                    f"Route {route} should return 200")


if __name__ == '__main__':
    unittest.main()
