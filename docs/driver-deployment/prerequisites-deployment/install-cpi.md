<!-- markdownlint-disable MD014 -->
# Installing VMware Cloud Provider Interface (CPI)

Following the VMware CPI guide [here](https://github.com/kubernetes/cloud-provider-vsphere/blob/master/docs/book/tutorials/kubernetes-on-vsphere-with-kubeadm.md)

Login to the Master Node and create a config map file */etc/kubernetes/vsphere.conf* that is passed into CPI on initialization. This is also where the topology is defined.

```bash
# Contents of /etc/kubernetes/vsphere.conf
[Global]
# user = "administrator@vsphere.local.com"  # (Do Not Use) Login to vCenter
# password = "DoNotUse"                     # (Do Not Use) Password to vCenter
port = "443"                                # vCenter Server port (Default: 443)
insecure-flag = "true"                      # Set to true to use self-signed certificate
secret-name = "cpi-global-secret"           # k8s secret name <- we will create this later
secret-namespace = "kube-system"            # k8s secret namespace  <- we will create this later

[VirtualCenter "10.1.1.21"]                 # IP of the vCenter to connect to
datacenters = "Datacenter"                  # Comma separated list of datacenters where kubernetes node VMs are present

### Examples of adding additional vCenters
# [VirtualCenter "192.168.0.1"]
# datacenters = "hr"

# [VirtualCenter "10.0.0.1"]
# datacenters = "engineering"
# secret-name = "cpi-engineering-secret"
# secret-namespace = "kube-system"

### Enable regions and zones to the topology
# [Labels]
# region = k8s-region
# zone = k8s-zone
```

Create a Cloud-Config for Kubernetes

```text
$ cd /etc/kubernetes
$ kubectl create configmap cloud-config --from-file=vsphere.conf --namespace=kube-system
```

Check that the Cloud Config was created

```text
$ kubectl get configmap cloud-config --namespace=kube-system
NAME           DATA   AGE
cloud-config   1      2m19s
```

Create a K8s Secret YAML

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: cpi-global-secret             # same secret-name provided in vsphere.conf
  namespace: kube-system              # same secret-namespace provided in vsphere.conf
stringData:
  10.0.0.1.username: "administrator"    # UPDATE the IP to match the vCenter IP
  10.0.0.1.password: "password"         # UPDATE the IP to match the vCenter IP
  # 192.168.0.1.username: "administrator@vsphere.local"  # to add another vCenter to the same secret
  # 192.168.0.1.password: "password"
```

Create the Secret

```text
$ kubectl create -f cpi-global-secret.yaml
```

## Topologies: Setting up Regions and Zones

Kubernetes allows you to place Pods and Persisent Volumes on specific parts of the underlying infrastructure, e.g. different DataCenters or different vCenters, using the concept of Zones and Regions. However, to use placement controls, the required configuration steps needs to be put in place at Kubernetes deployment time, and require additional settings in the vSphere.conf of the CPI. For more information on how to implement zones/regions support, there is a zones/regions tutorial on how to do it [here](https://github.com/kubernetes/cloud-provider-vsphere/blob/master/docs/book/tutorials/deploying_cpi_and_csi_with_multi_dc_vc_aka_zones.md).

If you are not interested in K8s object placement, this section can be ignored, and you can proceed with the remaining CPI setup steps.

## Check that all the nodes have Taints

```text
$ kubectl describe nodes | egrep "Taints:|Name:"
Name:               k8s-master
Taints:             node-role.kubernetes.io/master:NoSchedule
Name:               k8s-worker
Taints:             node.kubernetes.io/not-ready:NoExecute
```

Deploy cloud controller modules

```text
$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/cloud-provider-vsphere/master/manifests/controller-manager/cloud-controller-manager-roles.yaml
clusterrole.rbac.authorization.k8s.io/system:cloud-controller-manager created

$ kubectl apply -f https://raw.githubusercontent.com/kubernetes/cloud-provider-vsphere/master/manifests/controller-manager/cloud-controller-manager-role-bindings.yaml
rolebinding.rbac.authorization.k8s.io/servicecatalog.k8s.io:apiserver-authentication-reader created
clusterrolebinding.rbac.authorization.k8s.io/system:cloud-controller-manager created

$ kubectl apply -f https://github.com/kubernetes/cloud-provider-vsphere/raw/master/manifests/controller-manager/vsphere-cloud-controller-manager-ds.yaml
serviceaccount/cloud-controller-manager created
daemonset.apps/vsphere-cloud-controller-manager created
service/vsphere-cloud-controller-manager created
```

Verify that the Cloud Controllers were deployed

```text
$ kubectl get pods --namespace=kube-system
NAME                                        READY   STATUS    RESTARTS   AGE
coredns-7988585f4-ts5b5                     1/1     Running   1          4d7h
coredns-7988585f4-wb2bk                     1/1     Running   1          4d7h
etcd-k8s-master                             1/1     Running   2          4d7h
kube-apiserver-k8s-master                   1/1     Running   2          4d7h
kube-controller-manager-k8s-master          1/1     Running   3          4d7h
kube-flannel-ds-amd64-lfh7s                 1/1     Running   2          7h3m
kube-flannel-ds-amd64-r5pl6                 1/1     Running   1          11h
kube-proxy-b2qv4                            1/1     Running   2          4d7h
kube-proxy-w4bdj                            1/1     Running   0          7h3m
kube-scheduler-k8s-master                   1/1     Running   2          4d7h
vsphere-cloud-controller-manager-n8pn2      1/1     Running   1          4h54m
```

Check the taints

```text
$ sudo kubectl describe nodes | egrep "Taints:|Name:"
Name:               k8s-master
Taints:             node-role.kubernetes.io/master:NoSchedule
Name:               k8s-worker
Taints:             <none>
```

The `node-role.kubernetes.io/master=:NoSchedule` taint is required to be present on the master nodes to prevent scheduling of the node plugin pods for the csi node daemonset on the master nodes. Should you need to re-add the taint, you can use the following command:

```text
$ kubectl taint nodes k8s-master node-role.kubernetes.io/master=:NoSchedule
```

With the master and worker nodes setup, enabling snapshots is the next piece to setup for the HPE SimpliVity CSI.  This requires the installation of the CSI snapshot controller.
