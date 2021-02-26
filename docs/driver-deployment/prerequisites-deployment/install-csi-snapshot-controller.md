<!-- markdownlint-disable MD014 -->
# Installing CSI Snapshot Controller

To enable the HPE SimpliVity CSI to take snapshots install the [CSI Snapshot Controller](https://github.com/kubernetes-csi/external-snapshotter) on each cluster

Download the yaml files from

- [CSI Snapshot CRDs](https://github.com/kubernetes-csi/external-snapshotter/tree/master/client/config/crd)
- [CSI Snapshot Controller](https://github.com/kubernetes-csi/external-snapshotter/tree/master/deploy/kubernetes/snapshot-controller)

In the below examples we are using namespace ***kube-system***, which is a good place to store infrastructure related resources in Kubernetes.

In *setup-snapshot-controller.yaml*, update the namespace and image version. The CSI snapshot controller image version should be a compatible version from the table in [Support Information](../../support-information.md).

```yaml
11 metadata:
12   name: snapshot-controller
13   namespace: kube-system    # Use kube-system namespace
14 spec:
```

```yaml
27         - name: snapshot-controller
28           image: quay.io/k8scsi/snapshot-controller:v2.1.1
```

Update the namespace values in *rbac-snapshot-controller.yaml*

```yaml
9  kind: ServiceAccount
10 metadata:
11   name: snapshot-controller
12   namespace: kube-system    # Use kube-system namespace
13
14 ---
```

```yaml
47 kind: ClusterRoleBinding
48 apiVersion: rbac.authorization.k8s.io/v1
49 metadata:
50   name: snapshot-controller-role
51 subjects:
52   - kind: ServiceAccount
53     name: snapshot-controller
54     # replace with non-default namespace name
55     namespace: kube-system    # Use kube-system namespace
56 roleRef:
```

```yaml
62 kind: Role
63 apiVersion: rbac.authorization.k8s.io/v1
64 metadata:
65   namespace: kube-system    # Use kube-system namespace
66   name: snapshot-controller-leaderelection
```

```yaml
73 kind: RoleBinding
74 apiVersion: rbac.authorization.k8s.io/v1
75 metadata:
76   name: snapshot-controller-leaderelection
77   namespace: kube-system    # Use kube-system namespace
78 subjects:
79   - kind: ServiceAccount
80     name: snapshot-controller
81     namespace: kube-system    # Use kube-system namespace
```

## (Optional) Enabling Fault Tolerance

Update "replica" and "leader-election" values in *setup-snapshot-controller.yaml*

```yaml
14 spec:
15   serviceName: "snapshot-controller"
16   replicas: 2  # Update value to 2
17   selector:
```

```yaml
29           args:
30             - "--v=5"
31             - "--leader-election=true" # Update value to True
32           imagePullPolicy: Always
```

## Install the custom resource definition (CRD) for the Snapshot side car

```text
$ kubectl create -f snapshot.storage.k8s.io_volumesnapshotclasses.yaml
$ kubectl create -f snapshot.storage.k8s.io_volumesnapshotcontents.yaml
$ kubectl create -f snapshot.storage.k8s.io_volumesnapshots.yaml
```

## Install the snapshot-controller

```text
$ kubectl create -f rbac-snapshot-controller.yaml
$ kubectl create -f setup-snapshot-controller.yaml
```
