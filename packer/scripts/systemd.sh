#!/bin/bash

sudo mv /tmp/csye6225.service /etc/systemd/system/csye6225.service

sudo systemctl start csye6225

sudo systemctl enable csye6225

sudo systemctl status csye6225
