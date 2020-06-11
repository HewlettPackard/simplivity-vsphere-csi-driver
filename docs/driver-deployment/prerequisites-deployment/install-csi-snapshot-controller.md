<!-- markdownlint-disable MD014 -->
# Installing CSI Snapshot Controller

To enable the HPE SimpliVity CSI to take snapshots install the [CSI Snapshot Controller](https://github.com/kubernetes-csi/external-snapshotter) on each cluster

Download the yaml files from

- [CSI Snapshot CRDs](https://github.com/kubernetes-csi/external-snapshotter/tree/master/config/crd)
- [CSI Snapshot Controller](https://github.com/kubernetes-csi/external-snapshotter/tree/master/deploy/kubernetes/snapshot-controller)

In the below examples we are using namespace ***kube-system***, which is a good place to store infrastructure related resources in Kubernetes

Update the namespace value in *setup-snapshot-controller.yaml*

```yaml
6 metadata:
7   name: snapshot-controller
8   namespace: kube-system    # Use kube-system namespace
9 spec:
```

Update the namespace values in *rbac-snapshot-controller.yaml*

```yaml
3  kind: ServiceAccount
4  metadata:
5    name: snapshot-controller
6    namespace: kube-system    # Use kube-system namespace
7  ---
```

```yaml
9  kind: ClusterRole
10 apiVersion: rbac.authorization.k8s.io/v1
11 metadata:
12   # rename if there are conflicts
13   name: snapshot-controller-runner
14   namespace: kube-system    # Use kube-system namespace
15 rules:
```

```yaml
42 kind: ClusterRoleBinding
43 apiVersion: rbac.authorization.k8s.io/v1
44 metadata:
45   name: snapshot-controller-role
46 subjects:
47   - kind: ServiceAccount
48     name: snapshot-controller
49     # replace with non-default namespace name
50     namespace: kube-system    # Use kube-system namespace
51 roleRef:
```

```yaml
59 kind: Role
60 apiVersion: rbac.authorization.k8s.io/v1
61 metadata:
62   namespace: kube-system    # Use kube-system namespace
63   name: snapshot-controller-leaderelection
```

```yaml
71 kind: RoleBinding
72 apiVersion: rbac.authorization.k8s.io/v1
73 metadata:
74   name: snapshot-controller-leaderelection
75   namespace: kube-system    # Use kube-system namespace
76 subjects:
77   - kind: ServiceAccount
78     name: snapshot-controller
79     namespace: kube-system    # Use kube-system namespace
```

## (Optional) Enabling Fault Tolerance

Update "replica" and "leader-election" values in *setup-snapshot-controller.yaml*

```yaml
9  spec:
10   serviceName: "snapshot-controller"
11   replicas: 2  # Update value to 2
12   selector:
```

```yaml
24           args:
25             - "--v=5"
26             - "--leader-election=true" # Update value to True
27           imagePullPolicy: Always
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
