<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD014 -->
# HPE SimpliVity CSI Driver - Offline Volume Expansion

CSI Volume Expansion was introduced as an alpha feature in Kubernetes 1.14 and it was promoted to beta in Kubernetes 1.16. CSI Offline Volume Expansion is available from v2.0.0 of the HPE SimpliVity Driver. Currently, online expansion(ie, When the PVC is being used by a Pod i.e it is mounted on a node, the resulting volume expansion) is not supported.

The offline volume expansion feature of CSI is basically the ability to extend / grow a Kubernetes Persistent Volume (PV) when it is not attached to a node. Currently, Offline Volume Expansion is supported only on dynamically created volumes.

## Requirements

Make sure all the ESXi hosts of the cluster are on the same version as the vCenter. For volume expansion to work, the vCenter and all the ESX hosts of the cluster need to be on the supported versions of the feature i.e version 7.0 and above, otherwise volume resize operation fails with A general system error occurred: Failed to lock the file: api = DiskLib_Grow error.

### Offline Volume Expansion

Create a new StorageClass or edit the existing StorageClass to set allowVolumeExpansion to true.

```yaml
# Contents of example-sc.yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: simplivity-sc
  annotations:
    storageclass.kubernetes.io/is-default-class: "false"
provisioner: csi.simplivity.hpe.com
allowVolumeExpansion: true
reclaimPolicy: Delete
parameters:
  # datastoreurl and storagepolicyname are mutually exclusive.
  # datastoreurl: "ds:///vmfs/volumes/9c8391e9-05250c25/"  # Storage URL, found under storage tab in vCenter
  # storagepolicyname: "policy-name"  # Policy on selected datastore, from vCenter
  # Optional Parameter
  fstype: "ext4"
```

Create this StorageClass into the Kubernetes Cluster:

```text
$ kubectl create -f example-sc.yaml
```

Define a PersistentVolumeClaim using the above StorageClass and create a PersistentVolumeClaim in the Kubernetes Cluster:

```yaml
# Contents of example-pvc.yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: example-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: simplivity-sc
```

```text
$ kubectl create -f example-pvc.yaml
```

Now patch the created PVC to increase its requested storage size (in this case, to 4Gi):

```text
# Alternatively, the size can be changed by modifying the spec using kubectl edit pvc example-pvc
$ kubectl patch pvc example-pvc -p '{"spec": {"resources": {"requests": {"storage": "4Gi"}}}}'
persistentvolumeclaim/example-pvc patched
```

This will trigger an expansion in the volume associated with the PVC in vSphere Cloud Native Storage and also gets reflected on the capacity of the corresponding PV

```text
$ kubectl describe pvc example-pvc
Name:          example-pvc
Namespace:     default
StorageClass:  simplivity-sc
Status:        Bound
Volume:        pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
Labels:        <none>
Annotations:   pv.kubernetes.io/bind-completed: yes
               pv.kubernetes.io/bound-by-controller: yes
               volume.beta.kubernetes.io/storage-provisioner: csi.simplivity.hpe.com
Finalizers:    [kubernetes.io/pvc-protection]
Capacity:      4Gi
Access Modes:  RWO
VolumeMode:    Filesystem
Mounted By:    <none>
Events:
  Type    Reason                 Age                   From                                                                              Message
  ----    ------                 ----                  ----                                                                              -------
  Normal  Provisioning           3m48s                 csi.simplivity.hpe.com_svt-csi-controller-0_e9cdfeaf-603c-45a4-837b-3e5b86beb6d7  External provisioner is provisioning volume for claim "default/example-pvc"
  Normal  ExternalProvisioning   3m8s (x4 over 3m48s)  persistentvolume-controller                                                       waiting for a volume to be created, either by external provisioner "csi.simplivity.hpe.com" or manually created by system administrator
  Normal  ProvisioningSucceeded  2m56s                 csi.simplivity.hpe.com_svt-csi-controller-0_e9cdfeaf-603c-45a4-837b-3e5b86beb6d7  Successfully provisioned volume pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
```

```text
$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                         STORAGECLASS    REASON   AGE
pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da   4Gi        RWO            Delete           Bound    default/example-pvc           simplivity-sc            8m27s

$ kubectl describe pv pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
Name:            pvc-f6fb41c4-fda5-4768-9a68-3cb8b27967da
Labels:          <none>
Annotations:     pv.kubernetes.io/provisioned-by: csi.simplivity.hpe.com
Finalizers:      [kubernetes.io/pv-protection]
StorageClass:    simplivity-sc
Status:          Bound
Claim:           default/example-pvc
Reclaim Policy:  Delete
Access Modes:    RWO
VolumeMode:      Filesystem
Capacity:        4Gi
Node Affinity:   <none>
Message:
Source:
    Type:              CSI (a Container Storage Interface (CSI) volume source)
    Driver:            csi.simplivity.hpe.com
    VolumeHandle:      d3cff17d-334a-4217-b55d-e478648c5b8d
    ReadOnly:          false
    VolumeAttributes:      datastoreurl=ds:///vmfs/volumes/9c8391e9-05250c25/
                          fstype=ext4
                          storage.kubernetes.io/csiProvisionerIdentity=1589547226925-8081-csi.simplivity.hpe.com
                          type=HPE SimpliVity CNS Block Volume
Events:                <none>
```

Note that if a PVC, that is being used by a pod, is expanded, then the expansion will fail. However, once the pod is no longer using the PVC, then the expansion that failed  earlier, will be attempted.
