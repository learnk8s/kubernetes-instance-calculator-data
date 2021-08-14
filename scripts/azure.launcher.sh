#!/bin/bash

### create and run new azure vm

# the size of the instance
if [ -z $1 ]; then echo "type required";exit; fi
type=$1

resource_group="learnk8s" # you should define it first
image="ubuntults" # Ubuntu

# generate vm name
name=$type
start_time=$(date +%s)
# run vm command
az vm create --name $name --resource-group $resource_group  --image $image  --size $type --generate-ssh-keys >> azure.log
end_time=$(date +%s)
# get the used time
time=$(($end_time-$start_time))
# return time
echo $time

# terminate the instances
az vm delete --name $name --resource-group $resource_group -y