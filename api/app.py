from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def say_hello_world():
    return "Hello, world!"

if __name__ == '__main__':
    app.run(debug=True)