# Uninstalling the HPE SimpliVity Container Storage Interface (CSI) driver for vSphere

Remove the Daemon Set, Deployment and RBAC for the HPE SimpliVity CSI Driver

```text
$ kubectl delete -f https://github.com/HewlettPackard/simplivity-vsphere-csi-driver/master/manifests/1.17/deploy/svt-csi-node-ds.yaml?raw
daemonset.apps "svt-csi-node" deleted

$ kubectl delete -f https://github.com/HewlettPackard/simplivity-vsphere-csi-driver/master/manifests/1.17/deploy/svt-csi-controller-deployment.yaml?raw
deployment.apps "svt-csi-controller" deleted
csidriver.storage.k8s.io "csi.simplivity.hpe.com" deleted

$ kubectl delete -f https://github.com/HewlettPackard/simplivity-vsphere-csi-driver/master/manifests/1.17/rbac/svt-csi-controller-rbac.yaml?raw
serviceaccount "svt-csi-controller" deleted
clusterrole.rbac.authorization.k8s.io "svt-csi-controller-role" deleted
clusterrolebinding.rbac.authorization.k8s.io "svt-csi-controller-binding" deleted
```

Verify that CSI-Controller and CSI-Node were removed

```text
$ kubectl get pods --namespace=kube-system
NAME                                                   READY   STATUS    RESTARTS   AGE
coredns-7988585f4-5v7kj                                1/1     Running   0          32h
coredns-7988585f4-mpm6x                                1/1     Running   0          32h
etcd-2005121533-k8s-master-1                           1/1     Running   0          32h
kube-apiserver-2005121533-k8s-master-1                 1/1     Running   0          32h
kube-controller-manager-2005121533-k8s-master-1        1/1     Running   0          32h
kube-flannel-ds-amd64-7qvrt                            1/1     Running   0          32h
kube-flannel-ds-amd64-n59fc                            1/1     Running   0          32h
kube-flannel-ds-amd64-x9hlx                            1/1     Running   0          32h
kube-proxy-7pvb7                                       1/1     Running   0          32h
kube-proxy-hvgvq                                       1/1     Running   0          32h
kube-proxy-kr6jp                                       1/1     Running   0          32h
kube-scheduler-2005121533-k8s-master-1                 1/1     Running   0          32h
snapshot-controller-0                                  1/1     Running   0          32h
vsphere-cloud-controller-manager-twcg5                 1/1     Running   0          32h

$ kubectl get deployment --namespace=kube-system
NAMESPACE     NAME      READY   UP-TO-DATE   AVAILABLE   AGE
kube-system   coredns   2/2     2            2           31d
  
$ kubectl get daemonsets svt-csi-node --namespace=kube-system
Error from server (NotFound): daemonsets.apps "svt-csi-node" not found
  
$ kubectl get csidrivers
No resources found in default namespace.
```
