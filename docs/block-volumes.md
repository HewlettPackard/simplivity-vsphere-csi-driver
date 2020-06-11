<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD014 -->
# HPE SimpliVity CSI Driver - Block Volumes

There are two types of volume provisioning in a Kubernetes cluster:

1. [Dynamically Provisioning a Volume](#dynamically_provision_volume)
2. [Statically Provisioning a Volume](#statically_provision_volume)

## Dynamically Provisioning a Volume <a id="dynamically_provision_volume"></a>

Dynamically provisioning a volume allows storage volumes to be created on-demand.

The dynamic provisioning eliminates the need for cluster administrators to pre-provision storage. Instead, it automatically provisions storage when it is requested by a user.

The implementation of dynamic volume provisioning is based on the API object StorageClass from the API group storage.k8s.io. A cluster administrator can define as many StorageClass objects as needed, each specifying a volume plugin (a.k.a provisioner) that provisions a volume and a set of parameters to that provisioner when provisioning. A cluster administrator can define and expose multiple flavors of storage (from the same or different storage systems) within a cluster, each with a custom set of parameters.

### How to Dynamically Provision a Block Volume on a Kubernetes Cluster

Define a StorageClass that links the datastore to Kubernetes:

```yaml
# Contents of example-sc.yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: simplivity-sc
  annotations:
    storageclass.kubernetes.io/is-default-class: "false"
provisioner: csi.simplivity.hpe.com
parameters:
  # datastoreurl and storagepolicyname are mutually exclusive.
  datastoreurl: "ds:///vmfs/volumes/9c8391e9-05250c25/"  # Storage URL, found under storage tab in vCenter
  storagepolicyname: "policy-name"  # Policy on selected datastore, from vCenter
  # Optional Parameter
  fstype: "ext4"
```

Create this StorageClass into the Kubernetes Cluster:

```text
$ kubectl create -f example-sc.yaml
```

Define a PersistentVolumeClaim:

```yaml
# Contents of example-dynamic-pvc.yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: example-dynamic-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: simplivity-sc
```

Create this PersistentVolumeClaim in the Kubernetes Cluster:

```text
$ kubectl create -f example-dynamic-pvc.yaml
```

A PersistentVolume is dynamically created and is bound to this PersistentVolumeClaim. Verify that the PersistentVolumeClaim was created and a PersistentVolume is attached to it.

The base status should show Bound if it worked and the Volume field should be populated.

```text
$ kubectl get pvc
NAME                  STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS    AGE
example-dynamic-pvc   Bound    pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da   5Gi        RWO            simplivity-sc   2m19s
```

Details of the PVC

```text
$ kubectl describe pvc example-dynamic-pvc
Name:          example-dynamic-pvc
Namespace:     default
StorageClass:  simplivity-sc
Status:        Bound
Volume:        pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
Labels:        <none>
Annotations:   pv.kubernetes.io/bind-completed: yes
              pv.kubernetes.io/bound-by-controller: yes
              volume.beta.kubernetes.io/storage-provisioner: csi.simplivity.hpe.com
Finalizers:    [kubernetes.io/pvc-protection]
Capacity:      5Gi
Access Modes:  RWO
VolumeMode:    Filesystem
Mounted By:    <none>
Events:
  Type    Reason                 Age                   From                                                                              Message
  ----    ------                 ----                  ----                                                                              -------
  Normal  Provisioning           3m48s                 csi.simplivity.hpe.com_svt-csi-controller-0_e9cdfeaf-603c-45a4-837b-3e5b86beb6d7  External provisioner is provisioning volume for claim "default/example-dynamic-pvc"
  Normal  ExternalProvisioning   3m8s (x4 over 3m48s)  persistentvolume-controller                                                       waiting for a volume to be created, either by external provisioner "csi.simplivity.hpe.com" or manually created by system administrator
  Normal  ProvisioningSucceeded  2m56s                 csi.simplivity.hpe.com_svt-csi-controller-0_e9cdfeaf-603c-45a4-837b-3e5b86beb6d7  Successfully provisioned volume pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
```

Here, ReadWriteOnce (RWO) access mode indicates that the volume provisioned is a Block Volume. In both the basic `get` information and the detailed `describe` information of the PVC, the volume is shown in the `Volume` field.

```text
$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                         STORAGECLASS    REASON   AGE
pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da   5Gi        RWO            Delete           Bound    default/example-dynamic-pvc   simplivity-sc            8m27s

$ kubectl describe pv pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
Name:            pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
Labels:          <none>
Annotations:     pv.kubernetes.io/provisioned-by: csi.simplivity.hpe.com
Finalizers:      [kubernetes.io/pv-protection]
StorageClass:    simplivity-sc
Status:          Bound
Claim:           default/example-dynamic-pvc
Reclaim Policy:  Delete
Access Modes:    RWO
VolumeMode:      Filesystem
Capacity:        5Gi
Node Affinity:   <none>
Message:
Source:
    Type:              CSI (a Container Storage Interface (CSI) volume source)
    Driver:            csi.simplivity.hpe.com
    VolumeHandle:      d3cff17d-334a-4217-b55d-e478648c5b8d
    ReadOnly:          false
    VolumeAttributes:      datastoreurl=ds:///vmfs/volumes/188e6f22-173b61ae/
                          fstype=ext4
                          storage.kubernetes.io/csiProvisionerIdentity=1589547226925-8081-csi.simplivity.hpe.com
                          type=HPE SimpliVity CNS Block Volume
Events:                <none>
```

The `Status:` in both the outputs say `bound` and the `Claim:` points to the PVC that was created earlier `default/example-dynamic-pvc`.

This created a new volume and attached it to the application for the user.

## Statically Provisioning a Volume <a id="statically_provision_volume"></a>

Use this method when there is already an existing volume that is wanted by the Kubernetes cluster. Static provisioning is a feature that is native to Kubernetes and that allows cluster administrators to make existing storage devices available to a cluster.

As a cluster administrator, you must know the details of the storage device, its supported configurations, and mount options.

To make existing storage available to a cluster user, you must manually create the storage device, a PeristentVolume, and a PersistentVolumeClaim. Because the PV and the storage device already exists, there is no need to specify a storage class name in the PVC spec. There are many ways to create static PV and PVC bindings some examples are label matching, volume size matching etc...

### Use Cases of Static Provisioning

Following are the common use cases supported for static volume provisioning:

- **Use an existing storage device:** You provisioned a persistent storage First Class Disk (FCD) directly in your VC and want to use this FCD in your cluster.

- **Make retained data available to the cluster:** You provisioned a volume with a reclaimPolicy: retain in the storage class by using dynamic provisioning. You removed the PVC, but the PV, the physical storage in the VC, and the data still exist. You want to access the retained data from an app in your cluster.

### How to Statically Provision a Block Volume on a Kubernetes Cluster

First a `FCD ID` will need to be obtained for the volume. If the volume is not already a FCD it will need to be registered as one. This command will regiseter the volume as a FCD and return the FCD ID

```text
$ govc disk.register -ds=<datastore name> <myVMDKdirectory/mydisk.vmdk> <new FCD name>
```

If the volume is already a FCD, the FCD ID can be retrieved with the `PowerCLI` or `govc` utility

- PowerCLI

```text
$ Connect-VIServer <vCenter ip> -User administrator@vsphere.local -Password <vCenter password>
$ (Get-VDisk -Name <new FCD name>).id.Split(':')[1]
3515afd9-150e-4603-9267-7f0ff165ae63
```

- GOVC

```text
$ govc disk.ls
3515afd9-150e-4603-9267-7f0ff165ae63  static-pv
```

Define a PersistentVolume (PV) that links a FCD to Kubernetes

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: static-pv-name  # Set name of new PV
  labels:
    "fcd-id": "3515afd9-150e-4603-9267-7f0ff165ae63"
    # This label is used as selector to bind with volume claim.
    # This can we any unique key-value to identify PV.
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  csi:
    driver: csi.simplivity.hpe.com  # make sure this says `csi.simplivity.hpe.com`
    fsType: ext4
    volumeAttributes:
      fstype: ""
      storage.kubernetes.io/csiProvisionerIdentity: static-pv-name-csi.simplivity.hpe.com  # update this
      type: "vSphere CNS Block Volume"
      datastoreurl: "ds:///vmfs/volumes/9c8391e9-05250c25/"  # Storage URL, found under storage tab in vCenter
    volumeHandle: 3515afd9-150e-4603-9267-7f0ff165ae63  # First Class Disk (Improved Virtual Disk) ID
```

Define a PersistentVolumeClaim (PVC), which makes the PV useable by another Kubernetes resource like a Pod or StatefulSet.

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: static-pvc-name
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  selector:
    matchLabels:
      fcd-id: 3515afd9-150e-4603-9267-7f0ff165ae63 # This label is used as selector to find matching PV with specified key and value.
  storageClassName: ""
```

Create a static PV

```text
$ kubectl apply -f static-pv.yaml
persistentvolume/static-pv-name created

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM                         STORAGECLASS    REASON   AGE
static-pv-name                             1Gi        RWO            Retain           Available                                                          5s
```

Create PVC for the static PV. The PVC will be bound to the PV in the Volume column. While the PV will be updated with a `Claim` and the `Status` will be updated to `Bound`.

```text
$ kubectl apply -f static-pvc.yaml
persistentvolumeclaim/static-pvc-name created

$ kubectl get pvc
NAME                  STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS    AGE
static-pvc-name       Bound    static-pv-name                             1Gi        RWO                            8s

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                         STORAGECLASS    REASON   AGE
static-pv-name                             1Gi        RWO            Retain           Bound    default/static-pvc-name                                2m
```

The PV is now ready to be used by Kubernetes through the PVC it is bound to.
