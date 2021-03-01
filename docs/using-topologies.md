<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD024 -->
# Volume Topology for HPE SimpliVity CSI Driver for vSphere

Prerequisite : Enable topology in the Kubernetes Cluster. Follow steps mentioned in [Configuring Topologies](./driver-deployment/configuring-topologies.md).

HPE SimpliVity datastores are only accessible to the hosts that form the local cluster. This is fine if the Kubernetes cluster nodes are all contained on a single HPE SimpliVity/ESXi cluster. However, there may be a need to create a Kubernetes cluster that spans multiple HPE SimpliVity clusters to provide additional fault tolerance or simply to create really large Kubernetes clusters. In this case, worker nodes will only have access to datastores hosted by the local HPE SimpliVity cluster. So how will Kubernetes know which persistent volumes are accessible from which nodes to be able to intelligently provision storage and recover from faults?

The topology aware provisioning feature was added to Kubernetes to handle this scenario. Cloud providers (vSphere in this case) provide region and zone information to Kubernetes so that volumes will get provisioned in an appropriate zone that can run a pod allowing for an ease of deployment and scale of stateful workloads across failure domains to provide high availability and fault tolerance. For additional information see [Kubernetes best practices for running in multiple zones](https://kubernetes.io/docs/setup/best-practices/multiple-zones/).

- [Deploy workloads using topology with immediate volume binding mode](#deploy_workload_using_topology_immediate)
- [Deploy workloads using topology with WaitForFirstConsumer volume binding mode](#deploy_workload_using_topology_WaitForFirstConsumer)

## Immediate volume binding mode <a id="deploy_workload_using_topology_immediate"></a>

When topology is enabled in the cluster, you can deploy a Kubernetes workload to a specific region or zone defined in the topology.

Use the sample workflow to provision and verify your workloads.

1. Create a StorageClass that defines zone and region mapping.

    To the StorageClass YAML file, add zone-a and region-1 in the allowedTopologies field. For datastoreurl specify a datastore that is accessible to all nodes in zone-a.

    ```text
    $ tee example-zone-sc.yaml >/dev/null <<'EOF'
    kind: StorageClass
    apiVersion: storage.k8s.io/v1
    metadata:
      name: example-zone-sc
    provisioner: csi.simplivity.hpe.com
    parameters:
      datastoreurl: ds:///vmfs/volumes/0e65b0b0-00cd0c66/
    allowedTopologies:
    - matchLabelExpressions:
      - key: failure-domain.beta.kubernetes.io/zone
        values:
        - zone-a
      - key: failure-domain.beta.kubernetes.io/region
        values:
        - region-1
    EOF
    ```

    **Note:** Here `volumeBindingMode` will be `Immediate`, as it is default when not specified.

    ```text
    $ kubectl create -f example-zone-sc.yaml
    storageclass.storage.k8s.io/example-zone-sc created
    ```

2. Create a PersistenceVolumeClaim.

    ```text
    $ tee example-zone-pvc.yaml >/dev/null <<'EOF'
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: example-zone-pvc
    spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 5Gi
        storageClassName: example-zone-sc
    EOF
    ```

    ```text
    $ kubectl create -f example-zone-pvc.yaml
    persistentvolumeclaim/example-zone-pvc created
    ```

3. Verify that a volume is created for the PersistentVolumeClaim.

    ```text
    $ kubectl get pvc example-zone-pvc
    NAME               STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS      AGE
    example-zone-pvc   Bound    pvc-4f98579d-2550-4cf2-98bc-dbd117c5906f   5Gi        RWO            example-zone-sc   76s
    ```

4. Verify that the persistent volume is provisioned with the `Node Affinity` rules containing zone and region specified in the StorageClass.

    ```text
    $ kubectl describe pv pvc-4f98579d-2550-4cf2-98bc-dbd117c5906f
    Name:              pvc-4f98579d-2550-4cf2-98bc-dbd117c5906f
    Labels:            <none>
    Annotations:       pv.kubernetes.io/provisioned-by: csi.simplivity.hpe.com
    Finalizers:        [kubernetes.io/pv-protection]
    StorageClass:      example-zone-sc
    Status:            Bound
    Claim:             default/example-zone-pvc
    Reclaim Policy:    Delete
    Access Modes:      RWO
    VolumeMode:        Filesystem
    Capacity:          5Gi
    Node Affinity:
      Required Terms:
        Term 0:        failure-domain.beta.kubernetes.io/zone in [zone-a]
                      failure-domain.beta.kubernetes.io/region in [region-1]
    Message:
    Source:
        Type:              CSI (a Container Storage Interface (CSI) volume source)
        Driver:            csi.simplivity.hpe.com
        VolumeHandle:      ffc618b7-75a6-4183-ae2a-a5a590dfe3b8
        ReadOnly:          false
        VolumeAttributes:      datastoreurl=ds:///vmfs/volumes/0e65b0b0-00cd0c66/
                              storage.kubernetes.io/csiProvisionerIdentity=1589983635272-8081-csi.simplivity.hpe.com
                              type=HPE SimpliVity CNS Block Volume
    Events:                <none>
    ```

5. Create a pod.

    ```text
    $ tee example-zone-pod.yaml >/dev/null <<'EOF'
    apiVersion: v1
    kind: Pod
    metadata:
      name: example-zone-pod
    spec:
      containers:
      - name: test-container
        image: gcr.io/google_containers/busybox:1.24
        command: ["/bin/sh", "-c", "echo
    'hello' > /mnt/volume1/index.html  && chmod o+rX /mnt
    /mnt/volume1/index.html && while true ; do sleep 2 ; done"]
        volumeMounts:
        - name: test-volume
          mountPath: /mnt/volume1
      restartPolicy: Never
      volumes:
      - name: test-volume
        persistentVolumeClaim:
          claimName: example-zone-pvc
    EOF
    ```

    ```text
    $ kubectl create -f example-zone-pod.yaml
    pod/example-zone-pod created
    ```

    Pod is scheduled on the node k8s-node1 which belongs to zone: "zone-a" and region: "region-1"

    ```text
    $ kubectl describe pod example-zone-pod | egrep "Node:"
    Node:         k8s-r1za-w01/10.74.48.26
    ```

## WaitForFirstConsumer volume binding mode <a id="deploy_workload_using_topology_WaitForFirstConsumer"></a>

The HPE SimpliVity CSI Driver for vSphere supports topology-aware volume provisioning with `WaitForFirstConsumer`

Topology-aware provisioning allows Kubernetes to make intelligent decisions and find the best place to dynamically provision a volume for a pod. In multi-zone clusters, volumes are provisioned in an appropriate zone that can run your pod, allowing you to easily deploy and scale your stateful workloads across failure domains to provide high availability and fault tolerance.

`external-provisioner` must be deployed with the `--strict-topology` arguments.

This argument controls which topology information is passed to `CreateVolumeRequest.AccessibilityRequirements` in case of a delayed binding.

For information on how this option changes the result, see the table at [https://github.com/kubernetes-csi/external-provisioner#topology-support](https://github.com/kubernetes-csi/external-provisioner#topology-support). This option has no effect if the topology feature is disabled or the immediate volume binding mode is used.

1. Create a StorageClass with the `volumeBindingMode` parameter set to `WaitForFirstConsumer`.

    For this example, a `storagepolicyname` is specified that contains datastores from all three zones (zone-a, zone-b, zone-c).

    ```text
    $ tee topology-aware-standard.yaml >/dev/null <<'EOF'
    apiVersion: v1
    kind: StorageClass
    apiVersion: storage.k8s.io/v1
    metadata:
      name: topology-aware-standard
    provisioner: csi.simplivity.hpe.com
    volumeBindingMode: WaitForFirstConsumer
    parameters:
      storagepolicyname: "SvtGoldPolicy"
    EOF
    ```

    ```text
    $ kubectl create -f topology-aware-standard.yaml
    storageclass.storage.k8s.io/topology-aware-standard created
    ```

    This new setting instructs the volume provisioner, instead of creating a volume immediately, to wait until a pod using an associated PVC runs through scheduling. Note that in the previous StorageClass, `failure-domain.beta.kubernetes.io/zone` and `failure-domain.beta.kubernetes.io/region` were specified in the allowedTopologies entry. You **do not** need to specify them again, as pod policies now drive the decision of which zone to use for a volume provisioning.
    <br><br>

2. Create a pod and PVC using the StorageClass created previously.

    The following example demonstrates multiple pod constraints and scheduling policies.

    ```text
    $ tee topology-aware-statefulset.yaml >/dev/null <<'EOF'
    ---
    apiVersion: apps/v1
    kind: StatefulSet
    metadata:
      name: web
    spec:
      replicas: 2
      selector:
        matchLabels:
          app: nginx
      serviceName: nginx
      template:
        metadata:
          labels:
            app: nginx
        spec:
          affinity:
            nodeAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                nodeSelectorTerms:
                  -
                    matchExpressions:
                      -
                        key: failure-domain.beta.kubernetes.io/zone
                        operator: In
                        values:
                          - zone-a
                          - zone-b
            podAntiAffinity:
              requiredDuringSchedulingIgnoredDuringExecution:
                -
                  labelSelector:
                    matchExpressions:
                      -
                        key: app
                        operator: In
                        values:
                          - nginx
                  topologyKey: failure-domain.beta.kubernetes.io/zone
          containers:
            - name: nginx
              image: gcr.io/google_containers/nginx-slim:0.8
              ports:
                - containerPort: 80
                  name: web
              volumeMounts:
                - name: www
                  mountPath: /usr/share/nginx/html
                - name: logs
                  mountPath: /logs
      volumeClaimTemplates:
        - metadata:
            name: www
          spec:
            accessModes: [ "ReadWriteOnce" ]
            storageClassName: topology-aware-standard
            resources:
              requests:
                storage: 5Gi
        - metadata:
            name: logs
          spec:
            accessModes: [ "ReadWriteOnce" ]
            storageClassName: topology-aware-standard
            resources:
              requests:
                storage: 1Gi
    EOF
    ```

    ```text
    $ kubectl create -f topology-aware-statefulset.yaml
    statefulset.apps/web created
    ```

3. Verify statefulset is up and running.

    ```text
    $ kubectl get statefulset
    NAME   READY   AGE
    web    2/2     9m8s
    ```

4. Review your pods and your nodes.

    Pods are created in `zone-a` and `zone-b` specified in the nodeAffinity entry. `web-0` is scheduled on the node `k8s-r1zb-w01`, which belongs to `zone-b`. `web-1` is scheduled on the node `k8s-r1za-w02`, which belongs to `zone-a`.

    ```text
    $ kubectl get pods -o wide
    NAME    READY   STATUS    RESTARTS   AGE   IP             NODE           NOMINATED NODE   READINESS GATES
    web-0   1/1     Running   0          17m   10.233.125.2   k8s-r1zb-w01   <none>           <none>
    web-1   1/1     Running   0          13m   10.233.99.3    k8s-r1za-w02   <none>           <none>

    $ kubectl get nodes k8s-r1zb-w01 k8s-r1za-w02 -L failure-domain.beta.kubernetes.io/zone -L failure-domain.beta.kubernetes.io/region --no-headers
    k8s-r1zb-w01   Ready   <none>   16h   v1.17.5   zone-b   region-1
    k8s-r1za-w02   Ready   <none>   16h   v1.17.5   zone-a   region-1
    ```

5. Verify volumes are provisioned in zones according to the policies set by the pod.

    ```text
    $ kubectl describe pvc www-web-0 | egrep "volume.kubernetes.io/selected-node"
                  volume.kubernetes.io/selected-node: k8s-r1zb-w01

    $ kubectl describe pvc logs-web-0 | egrep "volume.kubernetes.io/selected-node"
                  volume.kubernetes.io/selected-node: k8s-r1zb-w01

    $ kubectl describe pvc www-web-1 | egrep "volume.kubernetes.io/selected-node"
                  volume.kubernetes.io/selected-node: k8s-r1za-w02

    $ kubectl describe pvc logs-web-1 | egrep "volume.kubernetes.io/selected-node"
                  volume.kubernetes.io/selected-node: k8s-r1za-w02

    $ kubectl get pv -o=jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.claimRef.name}{"\t"}{.spec.nodeAffinity}{"\n"}{end}'
    pvc-359c8f41-f60a-4538-bd52-e36d6fe2aa54        logs-web-1      map[required:map[nodeSelectorTerms:[map[matchExpressions:[map[key:failure-domain.beta.kubernetes.io/zone operator:In values:[zone-a]] map[key:failure-domain.beta.kubernetes.io/region operator:In values:[region-1]]]]]]]
    pvc-c0cf4ed1-c4a7-4499-a88b-4153e9a0f461        www-web-1       map[required:map[nodeSelectorTerms:[map[matchExpressions:[map[key:failure-domain.beta.kubernetes.io/zone operator:In values:[zone-a]] map[key:failure-domain.beta.kubernetes.io/region operator:In values:[region-1]]]]]]]
    pvc-c54feadd-af93-44de-87a4-afc5d92e9054        www-web-0       map[required:map[nodeSelectorTerms:[map[matchExpressions:[map[key:failure-domain.beta.kubernetes.io/region operator:In values:[region-1]] map[key:failure-domain.beta.kubernetes.io/zone operator:In values:[zone-b]]]]]]]
    pvc-de8e825c-cd87-4865-968c-324672da0c6d        logs-web-0      map[required:map[nodeSelectorTerms:[map[matchExpressions:[map[key:failure-domain.beta.kubernetes.io/zone operator:In values:[zone-b]] map[key:failure-domain.beta.kubernetes.io/region operator:In values:[region-1]]]]]]]
    ```

6. If required, specify allowedTopologies.

    When a cluster operator specifies the WaitForFirstConsumer volume binding mode, it is no longer necessary to restrict provisioning to specific topologies in most situations. However, if required, you can specify allowedTopologies.

    The following example demonstrates how to restrict the topology to specific zone.

    ```yaml
    kind: StorageClass
    apiVersion: storage.k8s.io/v1
    metadata:
      name: example-sc
    provisioner: csi.simplivity.hpe.com
    volumeBindingMode: WaitForFirstConsumer
    parameters:
      datastoreurl: ds:///vmfs/volumes/0e65b0b0-00cd0c66/
    allowedTopologies:
      - matchLabelExpressions:
          - key: failure-domain.beta.kubernetes.io/zone
            values:
              - zone-b
          - key: failure-domain.beta.kubernetes.io/region
            values:
              - region-1
    ```
