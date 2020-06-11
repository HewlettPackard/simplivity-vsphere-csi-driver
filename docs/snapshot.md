<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD014 -->
# HPE SimpliVity CSI Driver - Volume Snapshots

For dynamic volume creation, creating a PersistentVolumeClaim (PVC) initiates the creation of a PersistentVolume (PV) which contains the data. A PVC also specifies a StorageClass which provides additional attributes (e.g. SimpliVity datastore).

The CSI snapshot feature follows the same pattern. Creating a VolumeSnapshot triggers creation of a VolumeSnapshotContent object which contains the snapshot data. A VolumeSnapshot also specifies a VolumeSnapshotClass to provide additional attributes (e.g. retention policy).

- VolumeSnapshotContent: The Kubernetes cluster resource that represents a snapshot of a persistent volume.
- VolumeSnapshot: A snapshot request. Creating a VolumeSnapshot triggers a snapshot (VolumeSnapshotContent) and the objects are bound together. There is a one-to-one mapping between VolumeSnapshot and VolumeSnapshotContent objects.
- VolumeSnapshotClass: Dynamically provisioned snapshots specify a VolumeSnapshotClass to provide additional parameters for the snapshot operation. This is similar to how a StorageClass is used for PVs, and allows volumes created from the same StorageClass to be snapshotted with different options (e.g. retention policy).

## Volume Snapshot Provisioning

There are two types of snapshot provisioning in a Kubernetes cluster:

- [Dynamic Volume Snapshot](#dynamic_volume_snapshot): Create an on-demand snapshot.
- [Static Volume Snapshot](#static_volume_snapshot): Create a snapshot for a pre-existing HPE SimpliVity snapshot. For example, to create a Kubernetes snapshot from a scheduled backup.

### Dynamic Volume Snapshot<a id="dynamic_volume_snapshot"></a>

Volume snapshots of HPE SimpliVity volumes can be created on demand using the Kubernetes CLI. To do so, create a `VolumeSnapshot` object containing the `PersistentVolumeClaim` that you wish to snap. Kubernetes does not quiesce IO during a snapshot operation and thus the snapshot will just be crash consistent. To take an application consistent snapshot, you must take additional steps (e.g. shutdown the pod consuming the PV).

#### Dynamic Snapshot Procedure

1. Define a VolumeSnapshotClass. The `deletionPolicy` enables you to configure what happens to a VolumeSnapshotContent object when the VolumeSnapshot object to which it is bound is deleted. The `deletionPolicy` of a volume snapshot can either be `Retain` or `Delete`.

    ```yaml
    apiVersion: snapshot.storage.k8s.io/v1beta1
    kind: VolumeSnapshotClass
    metadata:
      name: hpe-simplivity-snapclass
    driver: csi.simplivity.hpe.com
    deletionPolicy: Delete
    parameters:
      description: "Snapshot created by the HPE SimpliVity vSphere CSI Driver"
    ```

2. Create the VolumeSnapshotClass object.

    ```text
    $ kubectl create -f example-snapshotclass.yaml
    ```

3. Define a VolumeSnapshot object. `volumeSnapshotClassName` specifies the snapshot options (defined in step 2) and `persistentVolumeClaim` identifies the snapshot source volume.

    ```yaml
    apiVersion: snapshot.storage.k8s.io/v1beta1
    kind: VolumeSnapshot
    metadata:
      name: www-web-snap-1
    spec:
      volumeSnapshotClassName: hpe-simplivity-snapclass
      source:
        persistentVolumeClaimName: www-web-0
    ```

4. Create the VolumeSnapshot object to request a snapshot.

    ```text
    $ kubectl create -f dynamic-snapshot.yaml
    ```

5. Verify the VolumeSnapshot object was created in Kubernetes.

    ```text
    $ kubectl describe volumesnapshot www-web-snap-1
    Name:         www-web-snap-1
    Namespace:    default
    Labels:       <none>
    Annotations:  <none>
    API Version:  snapshot.storage.k8s.io/v1beta1
    Kind:         VolumeSnapshot
    Metadata:
      Creation Timestamp:  2020-06-12T19:00:42Z
      Finalizers:
        snapshot.storage.kubernetes.io/volumesnapshot-as-source-protection
        snapshot.storage.kubernetes.io/volumesnapshot-bound-protection
      Generation:        1
      Resource Version:  8840186
      Self Link:         /apis/snapshot.storage.k8s.io/v1beta1/namespaces/default/volumesnapshots/www-web-snap-1
      UID:               7fa13b4b-f370-40c4-9946-4c7e2c72dcdc
    Spec:
      Source:
        Persistent Volume Claim Name:  www-web-0
      Volume Snapshot Class Name:      hpe-simplivity-snapclass
    Status:
      Bound Volume Snapshot Content Name:  snapcontent-7fa13b4b-f370-40c4-9946-4c7e2c72dcdc
      Creation Time:                       2020-06-12T19:01:08Z
      Ready To Use:                        true
      Restore Size:                        1Gi
    Events:                                <none>
    ```

6. You can also verify the backup from HPE SimpliVity.

    ```text
    $ svt-backup-show --pv pvc-e3fe7f3b-e00a-4b0d-9d65-89c3564081be_fcd --datastore svt-ds
    .----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------.
    | Backups for PV 'pvc-e3fe7f3b-e00a-4b0d-9d65-89c3564081be_fcd' on datastore 'svt-ds'                                                                                                        |
    +-----------------------------------------------+--------+-------------+----------------------+------------+------------+----------------+-----------+----------+------+-------------+---------+
    | Backup                                        | Backup | Consistency | Backup               | Expiration | Datacenter | Cluster Or     | Status    | Size     | Sent | Replication | Family  |
    | Name                                          | Type   | Type        | Time                 | Time       |            | External Store |           |          |      | End Time    |         |
    +-----------------------------------------------+--------+-------------+----------------------+------------+------------+----------------+-----------+----------+------+-------------+---------+
    | snapshot-7fa13b4b-f370-40c4-9946-4c7e2c72dcdc | Manual | None        | 2020-Jun-12 19:01:08 | N/A        | K8DC1      | K8Cluster1     | Protected | 656.00KB |   0B | N/A         | vSphere |
    '-----------------------------------------------+--------+-------------+----------------------+------------+------------+----------------+-----------+----------+------+-------------+---------'
    ```

### Static Volume Snapshot<a id="static_volume_snapshot"></a>

Static volume snapshot provisioning allows cluster administrators to make existing snapshots available to a cluster. A common HPE SimpliVity use case is creating a snapshot from a scheduled backup.

#### Static Snapshot Procedure

1. Use the HPE SimpliVity `svt-backup-show` CLI to retrieve the ID of the backup that you wish to restore.

    ```text
    $ svt-backup-show --pv pvc-e3fe7f3b-e00a-4b0d-9d65-89c3564081be_fcd --datastore svt-ds --backup 2020-06-15T11:10:00-04:00 --output xml
    <CommandResult>
        <Backup>
            <dsRemoved></dsRemoved>
            <datacenter>K8DC1</datacenter>
            <expirationTime>1592320200</expirationTime>
            <replicationStartTime>0</replicationStartTime>
            <datacenterName>K8DC1</datacenterName>
            <partial></partial>
            <associatedCluster>00000000-0000-0000-0000-000000000000</associatedCluster>
            <zoneStatus>1</zoneStatus>
            <computeClusterName>K8Cluster1</computeClusterName>
            <consistent></consistent>
            <lastTimeSizeCalc>0</lastTimeSizeCalc>
            <treeId>e8f03589-bdf3-4cc4-b401-e00c05c8ad11</treeId>
            <percentComp>0</percentComp>
            <uniqueSize>0</uniqueSize>
            <percentTrans>0</percentTrans>
            <dcId>e871a438-bcfc-476b-9081-7042a466771c</dcId>
            <sentSize>0</sentSize>
            <timestamp>1592233800</timestamp>
            <repTaskId>00000000-0000-0000-0000-000000000000</repTaskId>
            <computeClusterHmsId>9168aa17-f5a7-4d3c-94f6-5f7293bb80c3:ClusterComputeResource:domain-c7</computeClusterHmsId>
            <datacenterHmsId>9168aa17-f5a7-4d3c-94f6-5f7293bb80c3:Datacenter:datacenter-2</datacenterHmsId>
            <dsId>833a131c-09f2-46a3-94a9-e4b4342a9efe</dsId>
            <datastore>svt-ds</datastore>
            <hypervisorType>1</hypervisorType>
            <replicationElapsedSeconds>0</replicationElapsedSeconds>
            <externalStoreName></externalStoreName>
            <pedigree>1</pedigree>
            <omnistackClusterId>e871a438-bcfc-476b-9081-7042a466771c</omnistackClusterId>
            <logicalSize>671744</logicalSize>
            <consistency>0</consistency>
            <replicationAttempts>0</replicationAttempts>
            <hiveId>559273a8-f909-477d-8ca9-c6707b9208c3</hiveId>
            <name>2020-06-15T11:10:00-04:00</name>
            <replicationEndTime>0</replicationEndTime>
            <id>3edb760f-d9ad-4975-b8e4-0e1bc0394644</id>
            <hiveName>pvc-e3fe7f3b-e00a-4b0d-9d65-89c3564081be_fcd</hiveName>
            <backupId>3edb760f-d9ad-4975-b8e4-0e1bc0394644</backupId>
            <consistencyType>2</consistencyType>
            <replicaSet>c59a1042-3e83-d0c9-c28a-71bf95b68d64</replicaSet>
            <state>4</state>
            <hiveVolumeId>559273a8-f909-477d-8ca9-c6707b9208c3</hiveVolumeId>
            <backupStoreType>0</backupStoreType>
        </Backup>
    </CommandResult>
    ```

2. Define a VolumeSnapshotContent object representing the pre-existing snapshot. The VolumeSnapshotContent `name` is a unique name of your choosing to represent the object in Kubernetes. The `deletionPolicy` enables you to configure what happens to a VolumeSnapshotContent object when the VolumeSnapshot object to which it is bound is deleted. The `deletionPolicy` of a volume snapshot can either be `Retain` or `Delete`. The `snapshotHandle` is the backup ID you retrieved in step 1. The volume snapshot reference `name` should be set to a unique name that you will set on the VolumeSnapshot object that will be bound to this VolumeSnapshotContent.

    ```yaml
    apiVersion: snapshot.storage.k8s.io/v1beta1
    kind: VolumeSnapshotContent
    metadata:
      name: static-snap-content
    spec:
      deletionPolicy: Delete
      driver: csi.simplivity.hpe.com
      source:
        snapshotHandle: 3edb760f-d9ad-4975-b8e4-0e1bc0394644
      volumeSnapshotRef:
        name: static-snap-example
        namespace: default
    ```

3. Create the VolumeSnapshotContent object.

    ```text
    $ kubectl create -f static-snapshot-content.yaml
    ```

4. Define a VolumeSnapshot object. The `name` should match the volume snapshot reference name from the VolumeSnapshotContent object created in step 3. `volumeSnapshotContentName` specifies the name of the VolumeSnapshotContent object created in step 3.

    ```yaml
    kind: VolumeSnapshot
    metadata:
      name: static-snap-example
    spec:
      source:
        volumeSnapshotContentName: static-snap-content
    ```

5. Create the VolumeSnapshot object to bind the snapshot.

    ```text
    $ kubectl create -f static-snapshot.yaml
    ```

6. Verify the VolumeSnapshot object was created in Kubernetes.

    ```text
    $ kubectl describe volumesnapshot static-snap-example
    Name:         static-snap-example
    Namespace:    default
    Labels:       <none>
    Annotations:  <none>
    API Version:  snapshot.storage.k8s.io/v1beta1
    Kind:         VolumeSnapshot
    Metadata:
      Creation Timestamp:  2020-06-15T16:07:22Z
      Finalizers:
        snapshot.storage.kubernetes.io/volumesnapshot-as-source-protection
        snapshot.storage.kubernetes.io/volumesnapshot-bound-protection
      Generation:        1
      Resource Version:  9789090
      Self Link:         /apis/snapshot.storage.k8s.io/v1beta1/namespaces/default/volumesnapshots/static-snap-example
      UID:               f90e5b74-cf68-40f2-bb28-95e85944d56b
    Spec:
      Source:
        Volume Snapshot Content Name:  static-snap-content
    Status:
      Bound Volume Snapshot Content Name:  static-snap-content
      Creation Time:                       2020-06-15T15:10:00Z
      Ready To Use:                        true
      Restore Size:                        0
    Events:                                <none>
    ```

## Restoring a Volume Snapshot<a id="restore_volume_snapshot"></a>

Once the VolumeSnapshot object is bound and ready to use, you can restore the volume using the VolumeSnapshotContent object. To do so, create a persistent volume claim which specifies the volume snapshot object as the volume source.

### Snapshot Restore Procedure

1. Define a PersistentVolumeClaim. The `dataSource` allows you to specify the snapshot being restored.

    ```yaml
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: www-web-restore-1
    spec:
      storageClassName: svt-sc
      dataSource:
        name: www-web-snap-1
        kind: VolumeSnapshot
        apiGroup: snapshot.storage.k8s.io
      accessModes:
        - ReadWriteOnce
      volumeMode: Filesystem
      resources:
        requests:
          storage: 1Gi
    ```

2. Create the PVC object.

    ```text
    $ kubectl create -f snap-restore.yaml
    persistentvolumeclaim/www-web-restore-1 created
    ```

3. Verify the PVC was created successfully.

    ```text
    $ kubectl describe pvc www-web-restore-1
    Name:          www-web-restore-1
    Namespace:     default
    StorageClass:  svt-sc
    Status:        Bound
    Volume:        pvc-72fb5f0e-5a93-44fd-a5fe-c82339093115
    Labels:        <none>
    Annotations:   pv.kubernetes.io/bind-completed: yes
                  pv.kubernetes.io/bound-by-controller: yes
                  volume.beta.kubernetes.io/storage-provisioner: csi.simplivity.hpe.com
    Finalizers:    [kubernetes.io/pvc-protection]
    Capacity:      1Gi
    Access Modes:  RWO
    VolumeMode:    Filesystem
    DataSource:
      APIGroup:  snapshot.storage.k8s.io
      Kind:      VolumeSnapshot
      Name:      www-web-snap-1
    Mounted By:  <none>
    Events:
      Type    Reason                 Age                   From                                                                                             Message
      ----    ------                 ----                  ----                                                                                             -------
      Normal  Provisioning           6m6s                  csi.simplivity.hpe.com_svt-csi-controller-5844ff4c8c-jgv9k_2164c1a6-89af-4837-b6b6-c10015aa07c6  External provisioner is provisioning volume for claim "default/www-web-restore-1"
      Normal  ExternalProvisioning   5m13s (x5 over 6m5s)  persistentvolume-controller                                                                      waiting for a volume to be created, either by external provisioner "csi.simplivity.hpe.com" or manually created by system administrator
      Normal  ProvisioningSucceeded  5m10s                 csi.simplivity.hpe.com_svt-csi-controller-5844ff4c8c-jgv9k_2164c1a6-89af-4837-b6b6-c10015aa07c6  Successfully provisioned volume pvc-72fb5f0e-5a93-44fd-a5fe-c82339093115
    ```

## Deleting a Volume Snapshot<a id="delete_volume_snapshot"></a>

Snapshots can be deleted when no longer needed.

### Snapshot Delete Procedure

1. The VolumeSnapshotContent object `Deletion Policy` determines whether or not the underlying VolumeSnapshotContent object will be deleted or not when the VolumeSnapshot is deleted. If it is set to `Retain` then both the VolumeSnapshot and VolumeSnapshotContent object must be deleted to fully delete the snapshot. In this case, it is set to `Delete` and thus we only need to remove the VolumeSnapshot object.

    ```text
    $ kubectl describe volumesnapshotcontent snapcontent-7fa13b4b-f370-40c4-9946-4c7e2c72dcdc
    Name:         snapcontent-7fa13b4b-f370-40c4-9946-4c7e2c72dcdc
    Namespace:
    Labels:       <none>
    Annotations:  <none>
    API Version:  snapshot.storage.k8s.io/v1beta1
    Kind:         VolumeSnapshotContent
    Metadata:
      Creation Timestamp:  2020-06-12T19:00:42Z
      Finalizers:
        snapshot.storage.kubernetes.io/volumesnapshotcontent-bound-protection
      Generation:        1
      Resource Version:  8840185
      Self Link:         /apis/snapshot.storage.k8s.io/v1beta1/volumesnapshotcontents/snapcontent-7fa13b4b-f370-40c4-9946-4c7e2c72dcdc
      UID:               15f8f342-e9d9-4039-8c26-4ec321a8f60e
    Spec:
      Deletion Policy:  Delete
      Driver:           csi.simplivity.hpe.com
      Source:
        Volume Handle:             202797ef-40e3-41ba-a8b1-3850cfc93901
      Volume Snapshot Class Name:  hpe-simplivity-snapclass
      Volume Snapshot Ref:
        API Version:       snapshot.storage.k8s.io/v1beta1
        Kind:              VolumeSnapshot
        Name:              www-web-snap-1
        Namespace:         default
        Resource Version:  8840043
        UID:               7fa13b4b-f370-40c4-9946-4c7e2c72dcdc
    Status:
      Creation Time:    1591988468000000000
      Ready To Use:     true
      Restore Size:     1073741824
      Snapshot Handle:  996730a3-6005-4f4c-a758-5203892faa0b
    Events:             <none>
    ```

2. Delete the VolumeSnapshot object.

    ```text
    $ kubectl delete volumesnapshot www-web-snap-1
    volumesnapshot.snapshot.storage.k8s.io "www-web-snap-1" deleted
    ```

3. Verify the snapshot and content are removed.

    ```text
    $ kubectl get volumesnapshot www-web-snap-1
    Error from server (NotFound): volumesnapshots.snapshot.storage.k8s.io "www-web-snap-1" not found
    $ kubectl get volumesnapshotcontent snapcontent-7fa13b4b-f370-40c4-9946-4c7e2c72dcdc
    Error from server (NotFound): volumesnapshotcontents.snapshot.storage.k8s.io "snapcontent-7fa13b4b-f370-40c4-9946-4c7e2c72dcdc" not found
    ```

4. Verify that the backup has been deleted from HPE SimpliVity.

    ```text
    $ svt-backup-show --pv pvc-e3fe7f3b-e00a-4b0d-9d65-89c3564081be_fcd --datastore svt-ds
    No backups found.
    ```
