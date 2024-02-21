#!/bin/bash

# Download Node.js version 18.15.0
curl -o- https://nodejs.org/dist/v18.15.0/node-v18.15.0-linux-x64.tar.xz | tar xJ

# Move the Node.js files to /usr/local
sudo mv node-v18.15.0-linux-x64 /usr/local/node-v18.15.0

# Add Node.js to the system PATH
echo 'export PATH=/usr/local/node-v18.15.0/bin:$PATH' >> ~/.bashrc

# Apply the changes to the current shell
source ~/.bashrc
