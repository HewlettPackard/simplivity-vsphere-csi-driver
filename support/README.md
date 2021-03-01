# HPE SimpliVity CSI Driver Support Capture

The svt-support-capture.file is a diagnostic file for use with the open source [Kubernetes Crash Diagnostics tool](https://github.com/vmware-tanzu/crash-diagnostics).

## Installation

The installation steps for the Crash Diagnostic tool are available [here](https://github.com/vmware-tanzu/crash-diagnostics/blob/master/README.md#compile-and-run).

## Running Diagnostics

After installing the tool, modify svt-support-capture.file to include the IPs, credentials of the nodes etc. The tool runs several commands as superuser, so it would be good to setup passwordless SSH connection with the nodes. Then simply run the tool with the svt-support-capture.file:

```text
crashd run svt-support-capture.file
```

When you run it, you should see log messages on the screen similar to the following:

```text
$> crashd run svt-support-capture.file --debug
DEBU[0000] creating working directory /tmp/crashd
DEBU[0000] creating working directory
DEBU[0000] capture: executing command on 3 resources
DEBU[0000] capture: created capture dir:
DEBU[0000] capture: capturing output of [cmd=sudo df -i]
DEBU[0000] ssh.run: /usr/bin/ssh -q -o StrictHostKeyChecking=no -i
.
.
.
```
