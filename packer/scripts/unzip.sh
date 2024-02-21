#!/bin/bash

echo "Installing unzip package..."
sudo dnf -y install unzip
echo "Unzipping webapp.zip..."
unzip /tmp/webapp.zip -d /tmp/webapp/
echo "Changing ownership of /tmp/webapp to csye6225:csye6225..."
sudo chown csye6225:csye6225 /tmp/webapp
echo "Changing permissions of /tmp/webapp to make it executable..."
sudo chmod +x /tmp/webapp
echo "Script execution completed."
