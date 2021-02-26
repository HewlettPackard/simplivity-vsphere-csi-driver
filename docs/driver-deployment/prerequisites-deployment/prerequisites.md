# Prerequisites for Installing HPE SimpliVity CSI Driver

The following software must be installed prior to installing the HPE SimpliVity Container Storage Interface (CSI) Driver for vSphere:

* HPE OmniStack for vSphere
* VMware vSphere
* Kubernetes
* [vSphere CPI Driver](https://github.com/kubernetes/cloud-provider-vsphere/blob/master/docs/book/tutorials/kubernetes-on-vsphere-with-kubeadm.md)
* [CSI Snapshot Controller](https://github.com/kubernetes-csi/external-snapshotter)

Consult [Support Information](../../support-information.md) for software version compatibility.

## Installing Prerequisites

1. Have an [OS Template with Kubernetes Installed](setup-base-template.md)
2. [Setup Master and Worker Nodes in VMware](setup-master-and-worker-nodes.md)
3. [Install VMware Cloud Provider Interface (CPI)](install-cpi.md)
4. For snapshot support [install Kubernetes CSI Snapshot Controller](install-csi-snapshot-controller.md)
