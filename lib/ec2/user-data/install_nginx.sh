#!/bin/bash

# -x to display the command to be executed
set -xeu

# Redirect /var/log/user-data.log and /dev/console
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

# Install Packages
dnf install nginx -y
systemctl enable nginx --now