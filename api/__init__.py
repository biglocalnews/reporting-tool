import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)

# leaving in as placeholder
# app.config["SQLALCHEMY_DATABASE_URI"] = ""
# db = SQLAlchemy(app)

@app.route('/')
def hello():
    return 'Hello!'

if __name__ == '__main__':  
    app.run(debug=True)

