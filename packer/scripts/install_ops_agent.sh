#!/bin/bash

# Install the Ops Agent
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh && sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# Create Ops Agent configuration directory if it doesn't exist
sudo mkdir -p /etc/google-cloud-ops-agent/config.d/
sudo chown -R csye6225:csye6225 /etc/google-cloud-ops-agent/
sudo chmod -R 755 /etc/google-cloud-ops-agent/config.d/

# Configure the Ops Agent to collect application logs
cat <<EOF | sudo tee /etc/google-cloud-ops-agent/config.yaml
logging:
  receivers:
    my-app-receiver:
      type: files
      include_paths:
        - /var/log/csye6225-combined.log
      record_log_file_path: true
  processors:
    my-app-processor:
      type: parse_json
      time_key: time
      time_format: "%Y-%m-%dT%H:%M:%S.%L%Z"
    move_severity:
      type: modify_fields
      fields:
        severity:
          move_from: jsonPayload.severity
  service:
    pipelines:
      default_pipeline:
        receivers: [my-app-receiver]
        processors: [my-app-processor, move_severity]
EOF

# Restart the Ops Agent to apply the configuration
sudo systemctl restart google-cloud-ops-agent
