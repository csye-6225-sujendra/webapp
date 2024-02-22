# packer.pkr.hcl

# Load variables from variables.pkr.hcl file
variable "gcp_project_id" {
  type    = string
  default = "dev-gcp-414923"
}

variable "gcp_source_image" {
  type    = string
  default = "centos-stream-8"
}

variable "gcp_zone" {
  type    = string
  default = "us-central1-a"
}

variable "gcp_ssh_username" {
  type    = string
  default = "packer"
}

packer {
  required_plugins {
    googlecompute = {
      version = ">= 0.0.1"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

source "googlecompute" "centos-stream-8" {
  project_id              = var.gcp_project_id
  source_image_project_id = ["centos-cloud"]
  image_name              = "centos-8-packer-${formatdate("YYYYMMDDHHmmss", timestamp())}"
  source_image_family     = var.gcp_source_image
  machine_type            = "n1-standard-1"
  zone                    = var.gcp_zone
  disk_size               = 100
  disk_type               = "pd-balanced"
  network                 = "default"
  image_description       = "Custom image with node js & MySQL"
  image_labels = {
    environment = "dev"
  }
  ssh_username     = "packer"
  credentials_file = "./packer/packer-svc.json"
}

build {
  sources = ["source.googlecompute.centos-stream-8"]

  provisioner "shell" {
    scripts = [
      "./packer/scripts/install_node.sh",
      "./packer/scripts/install_mysql.sh"
    ]
  }

  provisioner "file" {
    source      = "./webapp.zip"
    destination = "/tmp/"
  }

  provisioner "shell" {
    script = "./packer/scripts/create_user.sh"
  }

  provisioner "shell" {
    scripts = [
      "./packer/scripts/unzip.sh",
      "./packer/scripts/install_node.sh",
      "./packer/scripts/install_node_dependencies.sh"
      //  "./packer/scripts/run_server.sh"

    ]
  }

  provisioner "file" {
    source      = "./packer/scripts/csye6225.service"
    destination = "/tmp/csye6225.service"
  }


  // provisioner "shell" {
  //   script = "./packer/scripts/systemd.sh"
  // }
}
