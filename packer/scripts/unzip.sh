#!/bin/bash

sudo dnf -y install unzip

unzip /tmp/webapp.zip -d /tmp/webapp/

sudo chown csye6225:csye6225 /tmp/webapp/server.js

sudo chmod +x /tmp/webapp/server.js
echo "Script execution completed."
