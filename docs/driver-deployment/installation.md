<!-- markdownlint-disable MD014 -->
# Install HPE SimpliVity Container Storage Interface (CSI) driver for vSphere

After the VMware CPI and CSI snapshot controller are installed successfully, install the HPE SimpliVity CSI Driver. If those have not been installed please visit the [prerequisites](./prerequisites-deployment/prerequisites.md) page before proceeding.

**Note** that this installation guide only applies to Vanilla Kubernetes clusters on VMware 6.7u3

All steps are performed from the master node

## Create a CSI Secret

For the driver to access both VMware and the HPE SimpliVity Appliance, a set of credentials need to be passed in through a Kubernetes secret. This is also where the [topology](./configuring-topologies.md) can be defined. Create a file *csi-vsphere.conf*

```bash
[Global]
cluster-id = "demo-cluster-id"        # Cluster Name, Each Kubernetes cluster should have it's own unique cluster-id set in the csi-vsphere.conf file

[VirtualCenter "1.1.1.1"]             # vCenter IP
insecure-flag = "true"                # Set to true to use self-signed certificate
user = "administrator"                # Login ID
password = "password"                 # Login Password
port = "443"                          # vCenter Server Port, Default Port 443
datacenters = "datacenter"            # Comma separated list of Datacenter names where Kubernetes node VMs are present.

[HPESimpliVity]
ip = "1.1.1.2"                        # HPE SimpliVity Management Virtual Appliance (MVA) IP Address or Management IP address
user = "simplivity_user"              # Login ID of HPE SimpliVity OVC
password = "simplivity_password"      # Password of HPE SimpliVity OVC

### Enable regions and zones to the topology
# [Labels]
# region = k8s-region
# zone = k8s-zone
```

Create the secret

```text
$ kubectl create secret generic vsphere-config-secret --from-file=csi-vsphere.conf --namespace=kube-system
$ kubectl get secret vsphere-config-secret --namespace=kube-system
NAME                    TYPE     DATA   AGE
vsphere-config-secret   Opaque   1      12s
```

After creating the secret in Kubernetes, remove the file for security.

```text
rm csi-vsphere.conf
```

## Create RBAC for HPE SimpliVity CSI Driver

Download and install the [RBAC yaml](https://github.com/HewlettPackard/simplivity-vsphere-csi-driver/blob/master/manifests/1.17/rbac/svt-csi-controller-rbac.yaml) from the HPE Simplivity CSI Driver GitHub repo. This creates a Role, ServiceAccount and ClusterRoleBindings for the HPE SimpliVity Driver.

```text
$ kubectl apply -f svt-csi-controller-rbac.yaml
serviceaccount/svt-csi-controller created
clusterrole.rbac.authorization.k8s.io/svt-csi-controller-role created
clusterrolebinding.rbac.authorization.k8s.io/svt-csi-controller-binding created
```

## Install HPE SimpliVity CSI Driver

Download and install the HPE SimpliVity [controller-deployment](https://github.com/HewlettPackard/simplivity-vsphere-csi-driver/blob/master/manifests/1.17/deploy/svt-csi-controller-deployment.yaml) and [node-ds](https://github.com/HewlettPackard/simplivity-vsphere-csi-driver/blob/master/manifests/1.17/deploy/svt-csi-node-ds.yaml) yaml files. The controller-deployment has the Deployment for the CSI controller, CSI attacher, CSI Provisioner and SVT syncer pods (the latter is used by our new Cloud Native Storage feature). The node-ds is a DaemonSet for the CSI component that will run on every worker node. It also has the definition for some of the new CRDs (Custom Resource Definitions) which we shall see shortly. Once again use kubectl to import the manifest into your cluster.

```text
$ kubectl apply -f svt-csi-controller-deployment.yaml
deployment.apps/svt-csi-controller created
csidriver.storage.k8s.io/csi.simplivity.hpe.com created

$ kubectl apply -f svt-csi-node-ds.yaml
daemonset.apps/svt-csi-node created
```

## Verify that the CSI Driver successfully installed

Verify CSI Controller

```text
$ kubectl get deployment -n kube-system
NAME                 READY   UP-TO-DATE   AVAILABLE   AGE
coredns              2/2     2            2           30d
svt-csi-controller   1/1     1            1           37m
```

Check that the CSI is running. There should be one CSI node per worker node in the cluster (this example has 2 worker nodes)

```text
$ kubectl get pods --namespace=kube-system
NAME                                                   READY   STATUS    RESTARTS   AGE
coredns-7988585f4-gww47                                1/1     Running   0          20m14s
coredns-7988585f4-z9l7l                                1/1     Running   0          20m14s
etcd-2002210051-k8s-master-1                           1/1     Running   0          20m9s
kube-apiserver-2002210051-k8s-master-1                 1/1     Running   0          20m9s
kube-controller-manager-2002210051-k8s-master-1        1/1     Running   0          20m9s
kube-flannel-ds-amd64-kbzbv                            1/1     Running   0          16m44s
kube-flannel-ds-amd64-mwpxm                            1/1     Running   0          20m7s
kube-flannel-ds-amd64-snxqz                            1/1     Running   2          15m6s
kube-proxy-4sv8n                                       1/1     Running   0          15m6s
kube-proxy-ccltk                                       1/1     Running   0          16m44s
kube-proxy-kdgm9                                       1/1     Running   0          20m15s
kube-scheduler-2002210051-k8s-master-1                 1/1     Running   0          20m9s
snapshot-controller-0                                  1/1     Running   0          11m
svt-csi-controller-0                                   6/6     Running   0          4m1s
svt-csi-node-jxrfr                                     3/3     Running   0          3m5s
svt-csi-node-rdj99                                     3/3     Running   0          4m1s
vsphere-cloud-controller-manager-twcg5                 1/1     Running   0          4m56s
```

Verify that the CSI Custom Resource Definitions are working

```text
$ kubectl get CSINode
NAME                           CREATED AT
2002210051-k8s-master-1        2020-02-21T01:04:54Z
2002210051-k8s-worker-1        2020-02-21T01:06:43Z
2002210051-k8s-worker-2        2020-02-21T01:08:22Z

$ kubectl describe CSINode
Name:         2002210051-k8s-master-1
Namespace:
Labels:       <none>
Annotations:  <none>
API Version:  storage.k8s.io/v1
Kind:         CSINode
Metadata:
  Creation Timestamp:  2020-02-21T01:04:54Z
  Owner References:
    API Version:     v1
    Kind:            Node
    Name:            2002210051-k8s-master-1
    UID:             20efb15c-3925-4ace-8800-dc3a21b26ad5
  Resource Version:  40
  Self Link:         /apis/storage.k8s.io/v1/csinodes/2002210051-k8s-master-1
  UID:               09241566-19b8-4332-9536-03ef984e671b
Spec:
  Drivers:  <nil>
Events:     <none>


Name:         2002210051-k8s-worker-1
Namespace:
Labels:       <none>
Annotations:  <none>
API Version:  storage.k8s.io/v1
Kind:         CSINode
Metadata:
  Creation Timestamp:  2020-02-21T01:06:43Z
  Owner References:
    API Version:     v1
    Kind:            Node
    Name:            2002210051-k8s-worker-1
    UID:             aef35e9d-2291-4f52-a5b6-7514e47d6781
  Resource Version:  1346
  Self Link:         /apis/storage.k8s.io/v1/csinodes/2002210051-k8s-worker-1
  UID:               a4d5abcf-51d9-438e-8567-d7f7ace93bfd
Spec:
  Drivers:
    Name:           csi.simplivity.hpe.com
    Node ID:        2002210051-k8s-worker-1
    Topology Keys:  <nil>
Events:             <none>


Name:         2002210051-k8s-worker-2
Namespace:
Labels:       <none>
Annotations:  <none>
API Version:  storage.k8s.io/v1
Kind:         CSINode
Metadata:
  Creation Timestamp:  2020-02-21T01:08:22Z
  Owner References:
    API Version:     v1
    Kind:            Node
    Name:            2002210051-k8s-worker-2
    UID:             089e54ff-7078-450b-a37f-ac57b928bd32
  Resource Version:  1822
  Self Link:         /apis/storage.k8s.io/v1/csinodes/2002210051-k8s-worker-2
  UID:               194ca6e4-e915-46bf-840f-f7f32badf361
Spec:
  Drivers:
    Name:           csi.simplivity.hpe.com
    Node ID:        2002210051-k8s-worker-2
    Topology Keys:  <nil>
Events:             <none>
```

Verify the CSI Driver

```text
$ kubectl get csidrivers
NAME                     CREATED AT
csi.simplivity.hpe.com   2020-02-21T01:09:26Z
  
$ kubectl describe csidrivers
Name:         csi.simplivity.hpe.com
Namespace:
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration:
                {"apiVersion":"storage.k8s.io/v1beta1","kind":"CSIDriver","metadata":{"annotations":{},"name":"csi.simplivity.hpe.com"},"spec":{"attachReq...
API Version:  storage.k8s.io/v1beta1
Kind:         CSIDriver
Metadata:
  Creation Timestamp:  2020-06-12T15:41:23Z
  Resource Version:    7766961
  Self Link:           /apis/storage.k8s.io/v1beta1/csidrivers/csi.simplivity.hpe.com
  UID:                 32306d10-cbaf-4091-b234-89d948e25a5a
Spec:
  Attach Required:    true
  Pod Info On Mount:  false
  Volume Lifecycle Modes:
    Persistent
Events:  <none>
```

Verify cluster setup and get the provider IDs for each Node

```text
$ kubectl get nodes
NAME                           STATUS   ROLES    AGE     VERSION
2002210051-k8s-master-1   Ready    master   13m     v1.17.0
2002210051-k8s-worker-1   Ready    <none>   11m     v1.17.0
2002210051-k8s-worker-2   Ready    <none>   9m38s   v1.17.0

$ kubectl describe nodes | grep "ProviderID"
ProviderID:                   vsphere://4238f1df-c5ba-30da-3ad6-18431ebe5f6a
ProviderID:                   vsphere://4238b026-11d2-886b-74aa-5e2ec47a5657
ProviderID:                   vsphere://42383955-c3c1-26eb-2f60-66331c393847
```
