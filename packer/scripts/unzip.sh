#!/bin/bash

# sudo dnf -y install unzip

# unzip /opt/webapp.zip -d /opt/

# sudo chown csye6225:csye6225 /opt/server.js

# sudo chmod +x /opt/server.js

# echo "Script execution completed."

sudo dnf -y install unzip

unzip /tmp/webapp.zip -d /tmp/webapp/

sudo chown csye6225:csye6225 /tmp/webapp/webapp/server.js

sudo chmod +x /tmp/webapp/webapp/server.js
echo "Script execution completed."
