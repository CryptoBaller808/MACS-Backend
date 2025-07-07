from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import requests
import os
import atexit

app = Flask(__name__)
CORS(app)

# Start Node.js server as subprocess
node_process = None
NODE_PORT = 5004

def start_node_server():
    global node_process
    try:
        # Start Node.js server
        env = os.environ.copy()
        env['PORT'] = str(NODE_PORT)
        node_process = subprocess.Popen(
            ['node', 'start.js'],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        print(f"Started Node.js server on port {NODE_PORT}")
        return True
    except Exception as e:
        print(f"Failed to start Node.js server: {e}")
        return False

def stop_node_server():
    global node_process
    if node_process:
        node_process.terminate()
        node_process.wait()

# Register cleanup function
atexit.register(stop_node_server)

# Start Node.js server when Flask starts
start_node_server()

# Proxy all requests to Node.js server
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
def proxy(path):
    try:
        url = f'http://localhost:{NODE_PORT}/{path}'
        
        # Forward the request to Node.js server
        if request.method == 'GET':
            resp = requests.get(url, params=request.args)
        elif request.method == 'POST':
            resp = requests.post(url, json=request.get_json(), params=request.args)
        elif request.method == 'PUT':
            resp = requests.put(url, json=request.get_json(), params=request.args)
        elif request.method == 'DELETE':
            resp = requests.delete(url, params=request.args)
        elif request.method == 'PATCH':
            resp = requests.patch(url, json=request.get_json(), params=request.args)
        
        # Return the response from Node.js
        return resp.content, resp.status_code, {'Content-Type': resp.headers.get('Content-Type', 'application/json')}
        
    except requests.exceptions.ConnectionError:
        return jsonify({
            'success': False,
            'message': 'Backend service unavailable',
            'data': {'error': 'Node.js server not responding'}
        }), 503
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Proxy error',
            'data': {'error': str(e)}
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)

