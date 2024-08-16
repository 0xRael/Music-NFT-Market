from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
#import ipfsApi
import os
import json

app = Flask(__name__)
#ipfs = ipfsApi.Client('127.0.0.1', 5002)
CORS(app)  # Enable CORS for all routes

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/mint")
def mint():
    return render_template('mint.html')

@app.route("/view")
def view():
    return render_template('NFTDisplay.html', contract_address='0', token_id='0')

@app.route('/view/<contract_address>/<token_id>')
def view2(contract_address, token_id):
    return render_template('NFTDisplay.html', contract_address=contract_address, token_id=token_id)

@app.route("/market")
def market():
    return render_template('Marketplace.html')

@app.route('/upload-metadata', methods=['POST'])
def upload_metadata():
    data = request.json
    name = data.get('name')
    artist = data.get('artist')
    if not name:
        return jsonify({"error": "Name is required"}), 400

    # Save metadata to a JSON file in the static directory

    #file_hash = ipfs.add_json(data)
    #file_path = os.path.join('static', 'NFTs', f"{file_hash}.json")
    file_path = os.path.join('static', 'NFTs', f"{artist}-{name}.json")
    with open(file_path, 'w') as f:
        json.dump(data, f)

    #return jsonify("url:" f"ipfs://{file_hash}")
    return jsonify({"url": f"http://localhost:5000/static/NFTs/{artist}-{name}.json"}), 200

if __name__ == '__main__':
    app.run(debug=True)