# Known Issues

## Storage Migration

Persistent Volumes (PVs) should not be migrated while attached to a worker node. Potential issues range from needing to copy the data to a new PV to losing the data permanently. To avoid this some preparation needs to be completed before migrating to a different datastore or different ESXi cluster, proceed in this order:

1. Drain the node from Kubernetes.
2. Migrate the VM.
3. Uncordon the node from Kubernetes.

If the possiblity of migration is a concern there is a way to disable all migration on each worker node. This [script](https://github.com/lamw/vghetto-scripts/blob/master/powershell/enable-disable-vsphere-api-method.ps1) can be used for disabling methods. Disable the "RelocateVM Task" method for the specific VM, which disables both compute and storage migration.
