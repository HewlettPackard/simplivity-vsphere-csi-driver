# Quickstart Guide for HPE SimpliVity CSI Driver

[Prerequisites](./driver-deployment/prerequisites-deployment/prerequisites.md) must be installed prior to following this quickstart guide.

## Create a Storage Class

Create a storage class that points to the desired datastore using either the datastore URL or the storage policy name. Below is an example of a storageclass.yaml

```yaml
# Contents of storageclass.yaml
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

```text
$ kubectl apply -f storageclass.yaml

$ kubectl get storageclass
NAME            PROVISIONER              RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
simplivity-sc   csi.simplivity.hpe.com   Delete          Immediate           false                  9m2s
```

## Dynamically Create a Volume

In a StatefulSet or Pod definition define a volume claim that points to the storage class. Below is an example that uses Nginx with a Persistent Volume (PV) that uses the previously defined storage class.

```yaml
# Content of nginx-ss.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nginx
spec:
  serviceName: nginx-service
  replicas: 1
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginxd-container
        image: nginx
        resources:
          requests:
            cpu: 0.2
            memory: 200Mi
        ports:
        - containerPort: 80
        volumeMounts:
        - name: nginx-pvc
          mountPath: /data/ng
  volumeClaimTemplates:
  - metadata:
      name: nginx-pvc
      annotations:
        volume.beta.kubernetes.io/storage-class: "simplivity-sc"  # Name of StorageClass
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Gi
```

Apply the StatefulSet to create the resources. This will take a little while as the volume will need to be created as part of the deployment in this example

```text
$ kubectl apply -f nginx-ss.yaml
statefulset.apps/nginx created

$ kubectl get pod
NAME      READY   STATUS    RESTARTS   AGE
nginx-0   1/1     Running   0          9m57s

$ kubectl get pvc
NAME                STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS    AGE
nginx-pvc-nginx-0   Bound    pvc-ff1dbada-3cfc-40c1-b5ee-ee9669e5a3ed   1Gi        RWO            simplivity-sc   10m

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                       STORAGECLASS    REASON   AGE
pvc-ff1dbada-3cfc-40c1-b5ee-ee9669e5a3ed   1Gi        RWO            Delete           Bound    default/nginx-pvc-nginx-0   simplivity-sc            10m
```

Lets add some data to the Volume

```text
$ kubectl exec -it nginx-0 -- sh
# echo "Nginx is Alive!!" > /data/ng/index.html
# exit
```

Now we have added data to a persistent volume in the Nginx app.
