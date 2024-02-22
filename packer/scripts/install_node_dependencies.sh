#!/bin/bash

source ~/.bashrc

# Change directory to the temporary directory where the web application resides
cd /tmp/webapp/webapp

# Install Node.js dependencies using npm
npm install

# Uninstall bcrypt
npm uninstall bcrypt

# Uninstall bcrypt
npm install bcrypt