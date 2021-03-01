<!-- markdownlint-disable MD014 -->
# Setting up a base template - Create Ubuntu 18.04 LTS Template

On a separate system install PowerShell, [PowerCLI](https://code.vmware.com/web/dp/tool/vmware-powercli), [govc](https://github.com/vmware/govmomi/tree/master/govc) and download the base OS to use for your Kubernetes installation. It is recommended to use [Ubuntu 18.04LTS](https://cloud-images.ubuntu.com/releases/18.04/release/ubuntu-18.04-server-cloudimg-amd64.ova) as the base OS for Kubernetes on VMware. DHCP should be configured on the subnet that the Kubernetes nodes are being deployed to.

Creating the template follows this [guide](https://blah.cloud/kubernetes/creating-an-ubuntu-18-04-lts-cloud-image-for-cloning-on-vmware/)

## Configure PowerCLI

PowerCLI will need to be configured to bypass certificate validation and the system proxy.

```text
# Install VMware PowerShell Module
C:\> Install-Module -name VMware.PowerCLI -Confirm:$false

# Disable VMware Customer Experience Improvement Program participation
C:\> Set-PowerCLIConfiguration -ProxyPolicy NoProxy -Scope User -ParticipateInCEIP $false -Confirm:$false

Scope    ProxyPolicy     DefaultVIServerMode InvalidCertificateAction  DisplayDeprecationWarnings WebOperationTimeout
                                                                                                  Seconds
-----    -----------     ------------------- ------------------------  -------------------------- -------------------
Session  NoProxy         Multiple            Unset                     True                       300
User
AllUsers

# Check Version
PS C:\> Get-Module -Name VMware.VimAutomation.Sdk | select Name, Version

Name                     Version
----                     -------
VMware.VimAutomation.Sdk 11.5.0.14898111

# Ignore certificate errors
C:\> Set-PowerCLIConfiguration -InvalidCertificateAction Ignore -Confirm:$false

Scope    ProxyPolicy     DefaultVIServerMode InvalidCertificateAction  DisplayDeprecationWarnings WebOperationTimeout
                                                                                                  Seconds
-----    -----------     ------------------- ------------------------  -------------------------- -------------------
Session  NoProxy         Multiple            Ignore                    True                       300
User                                         Ignore
AllUsers
```

## Setup govc

Configure some environment variables for govc, these values determine where the Ubuntu image and Kubernetes nodes are placed.

```text
$ export GOVC_INSECURE=1                  # Don't verify SSL certs on vCenter
$ export GOVC_URL=10.10.10.10             # vCenter IP/FQDN
$ export GOVC_USERNAME=administrator      # vCenter username
$ export GOVC_PASSWORD=password           # vCenter password
$ export GOVC_DATASTORE=Datastore         # Default datastore to deploy to
$ export GOVC_NETWORK="VM Network"        # Default network to deploy to
$ export GOVC_RESOURCE_POOL='*/Resources' # Default resource pool to deploy to
```

Check that govc has access to your vcenter

```text
$ govc about
Name:         VMware vCenter Server
Vendor:       VMware, Inc.
Version:      6.7.0
Build:        10244857
OS type:      linux-x64
API type:     VirtualCenter
API version:  6.7.1
Product ID:   vpx
UUID:         1bd33d4e-555f-4d8b-9b77-8d155f612155
```

Create OVF Spec from Ubuntu OVA

```text
$ govc import.spec ~/Downloads/ubuntu-18.04-server-cloudimg-amd64.ova | python -m json.tool > ubuntu.json
```

Create a new SSH key and store it ~/.ssh

* Setting SSH key for [Linux](https://www.ssh.com/ssh/keygen)
* Setting SSH key for [Windows](https://www.ssh.com/ssh/putty/windows/puttygen)

Customize the OVF Spec by updating "Value" for these key fields **hostname, public-keys, password, network and name**

```json
{
    "DiskProvisioning": "thin",
    "IPAllocationPolicy": "dhcpPolicy",
    "IPProtocol": "IPv4",
    "PropertyMapping": [
        {
            "Key": "instance-id",
            "Value": "id-ovf"
        },
        {
            "Key": "hostname",
            "Value": "Ubuntu1804Template"
        },
        {
            "Key": "seedfrom",
            "Value": ""
        },
        {
            "Key": "public-keys",
            "Value": "ssh-rsa [YOUR PUBLIC KEY] [username]"
        },
        {
            "Key": "user-data",
            "Value": ""
        },
        {
            "Key": "password",
            "Value": "password"
        }
    ],
    "NetworkMapping": [
        {
            "Name": "VM Network",
            "Network": "VM Network"
        }
    ],
    "MarkAsTemplate": false,
    "PowerOn": false,
    "InjectOvfEnv": false,
    "WaitForIP": false,
    "Name": "Ubuntu1804Template"
}
```

If using Windows you'll need to convert the ubuntu.json to unix format using [dos2unix](http://dos2unix.sourceforge.net/)

## Deploy the OVA

Import the OVA

```text
$ govc import.ova -options=ubuntu.json ~/Downloads/ubuntu-18.04-server-cloudimg-amd64.ova
```

Set the VM's resources

```text
$ govc vm.change -vm Ubuntu1804Template -c 4 -m 4096 -e="disk.enableUUID=1"
$ govc vm.disk.change -vm Ubuntu1804Template -disk.label "Hard disk 1" -size 60G
```

Power on the VM and wait until IP is assigned

```text
$ govc vm.power -on=true Ubuntu1804Template
$ govc vm.info Ubuntu1804Template

Name:           Ubuntu1804Template
Path:         /vSAN-DC/vm/Discovered virtual machine/Ubuntu1804Template
UUID:         42392966-8d21-ceda-5f23-28584c18703b
Guest name:   Ubuntu Linux (64-bit)
Memory:       1024MB
CPU:          2 vCPU(s)
Power state:  poweredOn
Boot time:    2019-01-25 18:28:21.978093 +0000 UTC
IP address:   10.198.17.85
Host:         10.198.17.31
```

Update the VM with open-vm-tools package

```text
$ ssh ubuntu@10.198.17.85
$ sudo apt update
$ sudo apt install open-vm-tools -y
$ sudo apt upgrade -y
$ sudo apt autoremove -y
```

Remove grub.d from the VMs before you upgrade the hardware version.

```text
$ sudo rm -rf /etc/default/grub.d
$ sudo update-grub
$ sudo shutdown now
```

Set the Hardware version of the VM to 15. This is required for VMware to recognize the VM as a Kubernetes node.

```text
$ govc vm.upgrade -version=15 -vm '/datacenterName/vm/Ubuntu1804Template'
```

Verify that the VM's Hardware version was set

```text
$ govc vm.option.info '/datacenterName/vm/Ubuntu1804Template' | grep HwVersion
HwVersion:           15
```

## Install Docker

Power the VM back on and install the libraries needed to install docker

```text
$ govc vm.power -on=true Ubuntu1804Template
$ govc vm.info Ubuntu1804Template
$ ssh ubuntu@10.198.17.85
$ sudo apt install ca-certificates software-properties-common apt-transport-https curl -y
```

Add Docker offical GPG Key

```text
$ sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```

Add Docker apt repository

```text
$ sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable"
$ sudo curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
```

Create the file */etc/apt/sources.list.d/kubernetes.list* to point to the Kubernetes repo

```bash
# Contents of /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
```

Update apt with the new repositories just added

```bash
$ sudo apt update
```

Install DockerCE

```bash
# update to recommended version of docker for k8s 1.17
$ sudo apt install docker-ce=5:19.03.4~3-0~ubuntu-bionic -y
```

Setup Docker's Daemon file /etc/docker/daemon.json

```json
# Contents of /etc/docker/daemon.json
{
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m"
  },
  "storage-driver": "overlay2"
}
```

Restart the Docker service using the new settings

```text
$ sudo mkdir -p /etc/systemd/system/docker.service.d
$ sudo systemctl daemon-reload
$ sudo systemctl restart docker
$ sudo systemctl status docker
 docker.service - Docker Application Container Engine
   Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
   Active: active (running) since Fri 2019-09-06 12:37:27 UTC; 4min 15s ago
$ sudo docker info | egrep "Server Version|Cgroup Driver"
Server Version: 19.03.4-ce
Cgroup Driver: systemd
```

## Install Kubernetes

```text
$ sudo apt install -qy kubeadm=1.17.0-00 kubelet=1.17.0-00 kubectl=1.17.0-00
```

Hold Kubernetes packages at their installed version so they do not upgrade unexpectedly on an apt upgrade

```text
$ sudo apt-mark hold kubelet kubeadm kubectl
```

## Install Network for Pod nodes

This example uses Flannel for the kubernetes cluster network. Flannel needs to have IPv4 traffic bridged to iptables chains

```text
$ sudo sysctl net.bridge.bridge-nf-call-iptables=1
```

Disable cloud-init on VM and use VMware Guest Customization specs instead

```text
$ sudo cloud-init clean --logs
$ sudo touch /etc/cloud/cloud-init.disabled
$ sudo rm -rf /etc/netplan/50-cloud-init.yaml
$ sudo apt purge cloud-init -y
$ sudo apt autoremove -y

# Don't clear /tmp
$ sudo sed -i 's/D \/tmp 1777 root root -/#D \/tmp 1777 root root -/g' /usr/lib/tmpfiles.d/tmp.conf

# Remove cloud-init and rely on dbus for open-vm-tools
$ sudo sed -i 's/Before=cloud-init-local.service/After=dbus.service/g' /lib/systemd/system/open-vm-tools.service

# cleanup current ssh keys so templated VMs get fresh key
$ sudo rm -f /etc/ssh/ssh_host_*
```

Add check for ssh keys on reboot, create */etc/rc.local*

```bash
# Contents of /etc/rc.local

#!/bin/sh -e
#
# rc.local
#
# This script is executed at the end of each multiuser runlevel.
# Make sure that the script will "" on success or any other
# value on error.
#
# In order to enable or disable this script just change the execution
# bits.
#

# By default this script does nothing.
test -f /etc/ssh/ssh_host_dsa_key || dpkg-reconfigure openssh-server
exit 0
```

Clean the VM before making it a template

```text
# make the script executable
$ sudo chmod +x /etc/rc.local

# cleanup apt
$ sudo apt clean

# reset the machine-id (DHCP leases in 18.04 are generated based on this... not MAC...)
$ echo "" | sudo tee /etc/machine-id >/dev/null

# disable swap for K8s
$ sudo swapoff --all
$ sudo sed -ri '/\sswap\s/s/^#?/#/' /etc/fstab

# cleanup shell history and shutdown for templating
$ history -c
$ history -w
$ sudo shutdown -h now
```

Turn the VM into a Template

```text
$ govc vm.markastemplate Ubuntu1804Template
```

Define a Customization spec with DNS, Domain, and OSType defined

```text
$ Connect-VIServer <vCenter IP> -User <vCenter Username> -Password <vCenter Password>
$ New-OSCustomizationSpec -Name CustomizationName -OSType Linux -DnsServer 1.1.1.1, 8.8.8.8 -DnsSuffix mydomain.net -Domain mydomain.net -NamingScheme vm

Name                                         Description            Type          OSType  LastUpdate           Server
----                                         -----------            ----          ------  ----------           ------
CustomizationName                                                   Persistent    Linux   27/01/2019 21:43:40  <vCenter IP>
```

Create Kubernetes master and worker nodes

```text
$ govc vm.clone -vm Ubuntu1804Template -customization=CustomizationName  k8s-master
$ govc vm.clone -vm Ubuntu1804Template -customization=CustomizationName  k8s-worker1
$ govc vm.clone -vm Ubuntu1804Template -customization=CustomizationName  k8s-worker2
$ govc vm.clone -vm Ubuntu1804Template -customization=CustomizationName  k8s-worker3
```

Now that there are some Kubernetes nodes created it is time to setup a master node and the worker nodes.
