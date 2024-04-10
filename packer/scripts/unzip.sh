#!/bin/bash

sudo dnf -y install unzip

unzip /tmp/webapp.zip -d /tmp/webapp/

cd /tmp/webapp/

# Change ownership of the entire /tmp/webapp/ directory
sudo chown -R csye6225:csye6225 /tmp/webapp/
sudo chmod 750 /tmp/webapp/
# Install Node.js dependencies using npm
sudo npm install

# Uninstall bcrypt
sudo npm uninstall bcrypt

# Uninstall bcrypt
sudo npm install bcrypt

sudo chown csye6225:csye6225 /tmp/webapp/server.js

sudo chmod +x /tmp/webapp/server.js
echo "Script execution completed."
