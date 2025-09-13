from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server(port=8080):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    print(f"Dashboard server running on http://localhost:{port}")
    print("Press Ctrl+C to stop the server")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()