<!-- markdownlint-disable MD033 -->
# Support Information

## Limits

The CSI driver has the following limits. Consult the HPE OmniStack documentation for VM and persistent volume (PV) limits which may be more restrictive depending on the hardware configuration.

| Object                                         | Limit         |
| ---------------------------------------------- | ------------- |
| Number of PVs per vCenter                      | 10000         |
| Number of PVs per VM with 4 controllers        | Max 59        |

<br>
**Note:** Only a single vCenter is supported by HPE SimpliVity CSI Driver for vSphere. Make sure Kubernetes node VMs do not spread across multiple vCenter servers.

## Compatibility Matrix <a id="compatibility_matrix"></a>

### HPE OmniStack for vSphere Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with vSphere releases.

|    HPE OmniStack Version    |    HPE SimpliVity CSI v1.0.0    |
| --------------------------- | ------------------------------- |
| HPE OmniStack 4.1.0         | Supported                       |

<br>

### vSphere/ESXi Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with vSphere releases.

|    vSphere/ESXi Version         |    HPE SimpliVity CSI v1.0.0    |
| ------------------------------- | ------------------------------- |
| vSphere 6.7U3/ESXi 6.7U3        | Supported                       |
| vSphere 7.0/ESXi 7.0            | Not Supported                   |

<br>

### Kubernetes Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with Kubernetes releases.

|    Kubernetes Version    |    HPE SimpliVity CSI v1.0.0    |
| ------------------------ | ------------------------------- |
| 1.17                     | Supported                       |
| 1.18                     | Not Supported                   |

<br>

### vSphere CPI Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with Kubernetes releases.

|   vSphere CPI Version    |    HPE SimpliVity CSI v1.0.0    |
| ------------------------ | ------------------------------- |
| 1.1.0                    | Supported                       |

<br>

### CSI Snapshot Controller Compatibility

The following table describes compatibility of the HPE SimpliVity CSI driver for vSphere releases with Kubernetes releases.

| CSI Snapshot Controller Version    |    HPE SimpliVity CSI v1.0.0    |
| ---------------------------------- | ------------------------------- |
| 2.0.1                              | Supported                       |

<br>

## Features

| Feature                     | Supported                         |
| --------------------------- | --------------------------------- |
| Datastores supported        | SimpliVity datastores only        |
| Static Provisioning         | Yes                               |
| Dynamic Provisioning        | Yes                               |
| Access mode                 | RWO                               |
| Volume Topology/Zones       | Yes                               |
| Snapshots                   | Yes (beta)                        |
| Extend Volume               | No                                |
| Encryption                  | No                                |

<br>

## Additional Support Information

* To access documentation and support services, go to the Hewlett Packard Enterprise Support Center website: [https://www.hpe.com/support/hpesc](https://www.hpe.com/support/hpesc)
