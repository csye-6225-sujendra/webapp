#!/bin/bash

# Change directory to the temporary directory where the web application resides
cd /tmp/webapp/

# Install Node.js dependencies using npm
sudo npm install

# Uninstall bcrypt
npm uninstall bcrypt

# Uninstall bcrypt
npm install bcrypt