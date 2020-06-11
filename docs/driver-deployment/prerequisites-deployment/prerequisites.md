# Prerequisites for Installing HPE SimpliVity CSI Driver

* VMware 6.7u3 ***Note:*** *the vSphere and ESXi versions should to be the same*.
* Kubernetes 1.17+
* HPE SimpliVity CSI for VMware 4.1.0+
* [vSphere CPI Driver](https://github.com/kubernetes/cloud-provider-vsphere/blob/master/docs/book/tutorials/kubernetes-on-vsphere-with-kubeadm.md)
* [CSI Snapshot Controller v2.0.1](https://github.com/kubernetes-csi/external-snapshotter)

## Installing Prerequisites

1. Have a OS Template with Kubernetes Installed [Base Template Link](setup-base-template.md)
2. Setup a Master and Worker Nodes in VMware [Setup Nodes Link](setup-master-and-worker-nodes.md)
3. Install VMware Cloud Provider Interface (CPI) [Install CPI Link](install-cpi.md)
4. Install Kubernetes CSI Snapshot Controller [Install CSI Snapshot Controller Link](install-csi-snapshot-controller.md)
