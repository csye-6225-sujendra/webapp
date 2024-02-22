#!/bin/bash

# Install MySQL
sudo dnf install -y mysql-server

# Start MySQL service
sudo systemctl start mysqld.service 

# Enable MySQL service to start on boot
sudo systemctl enable mysqld

# Set MySQL root password
sudo mysqladmin -u root password Sujendra@123
