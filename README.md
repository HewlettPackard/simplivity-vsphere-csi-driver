# HPE SimpliVity Container Storage Interface (CSI) Driver for vSphere

This repository provides tools and scripts for building and testing the HPE SimpliVity CSI driver. This driver is in a stable `GA` state and is suitable for production use. The HPE SimpliVity CSI Driver for VMware is based on the [VMware CSI Driver v1.0.2](https://github.com/kubernetes-sigs/vsphere-csi-driver)

## Requirements

The HPE SimpliVity CSI Driver for VMware requires a software stack consisting of HPE SimpliVity, VMware vSphere, Kubernetes and vSphere CPI Driver.  The appropriate versions of this software can be found [here](docs/support-information.md)

For help with installing these requirements go [here](docs/driver-deployment/prerequisites-deployment/prerequisites.md)

## Installation

Install instructions for the CSI driver are available [here](docs/driver-deployment/installation.md)

## CSI Driver Images

The CSI driver container images are available here:

- docker.io/hpesimplivity/vsphere-csi-driver:v1.0.0
- docker.io/hpesimplivity/vsphere-csi-syncer:v1.0.0

## Getting started with HPE SimpliVity CSI

Follow the [documentation](https://hewlettpackard.github.io/simplivity-vsphere-csi-driver/) to get started using the HPE SimpliVity CSI Driver
