# HPE SimpliVity Support Capture

This svt-support-capture.file is a diagnostic file for use with the open source [Kubernetes Crash Diagnostics tool](https://github.com/vmware-tanzu/crash-diagnostics).

## Installation

Install instructions for the crash diagnostic tool are available here:

* <https://github.com/vmware-tanzu/crash-diagnostics/blob/master/README.md#compile-and-run>

## Running Diagnostics

After installing the crash-diagnostic tool, modify svt-support-capture.file based on the environment. At a minimum, update AUTHCONFIG with the correct username and SSH key for accessing the remote cluster nodes.

Then simply run crash-diagnostics passing in the svt-support-capture.file:

```bash
crash-diagnostics run --file svt-support-capture.file
```

To specify the output file, use the `--output` flag (which overrides value in script):

```bash
crash-diagnostics --file svt-support-capture.file --output test-cluster.tar.gz
```

When you run it, you should see log messages on the screen similar to the following:

```console
$> crash-diagnostics run --file svt-support-capture.file
INFO[0000] Parsing script file
INFO[0000] Executing script file
INFO[0000] KUBEGET: getting API objects (this may take a while)
INFO[0021] KUBEGET: getting API objects (this may take a while)
INFO[0101] Created output at path ./svt-k8s-support-capture.tar.gz
INFO[0101] Done
```
