<!-- markdownlint-disable MD033 -->
# Support Information

## Limits

Consult the HPE OmniStack documentation for VM limits, which applies to persistent volumes (PV) as well. The limits may be more restrictive depending on the hardware configuration.

**Note:** Only a single vCenter is supported by HPE SimpliVity CSI Driver for vSphere. Make sure Kubernetes node VMs do not spread across multiple vCenter servers.

## Compatibility Matrix <a id="compatibility_matrix"></a>

### HPE OmniStack for vSphere Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with vSphere releases.

|   HPE SimpliVity CSI Versions   |    HPE OmniStack Version    |
| ------------------------------- | --------------------------- |
|              1.0.0              |            4.1.0            |
|              2.0.0              |            4.1.0            |

<br>

### vSphere/ESXi Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with vSphere releases.

|   HPE SimpliVity CSI Versions   |    vSphere/ESXi Version   |
| ------------------------------- | ------------------------- |
|              1.0.0              |           6.7U3           |
|              2.0.0              |            7.0            |

<br>

### Kubernetes Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with Kubernetes releases.

|   HPE SimpliVity CSI Versions   |    Kubernetes Versions    |
| ------------------------------- | ------------------------- |
|              1.0.0              |          1.17, 1.18       |
|              2.0.0              |            1.20           |

<br>

### vSphere CPI Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with Kubernetes releases.

|   HPE SimpliVity CSI Versions   |    vSphere CPI Versions   |
| ------------------------------- | ------------------------- |
|              1.0.0              |            1.1.0          |
|              2.0.0              |            1.20.0         |

<br>

### CSI Snapshot Controller Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with Kubernetes releases.

|   HPE SimpliVity CSI Versions   |    CSI Snapshot Controller Versions   |
| ------------------------------- | ------------------------------------- |
|              1.0.0              |                  2.1.1                |
|              2.0.0              |                  4.0.0                |

<br>

## Features

| Feature                     | Supported                         |
| --------------------------- | --------------------------------- |
| Datastores supported        | SimpliVity datastores only        |
| Static Provisioning         | Yes                               |
| Dynamic Provisioning        | Yes                               |
| Access mode                 | RWO                               |
| Volume Topology/Zones       | Yes                               |
| Snapshots                   | Yes                               |
| Encryption                  | No                                |
| Offline Volume Expansion    | Yes (v2.0.0 onwards)              |

<br>

## Additional Support Information

* To access documentation and support services, visit the [Hewlett Packard Enterprise Support Center](https://support.hpe.com).
