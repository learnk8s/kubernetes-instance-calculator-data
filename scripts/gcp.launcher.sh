#!/bin/bash

### create and run new gcp vm

# the size of the instance
if [ -z $1 ]; then echo "type required";exit; fi
type=$1

image_project="ubuntu-os-cloud" # Ubuntu
image_family="ubuntu-1804-lts" # Ubuntu

# generate vm name
start_time=$(date +%s)
# run vm command
gcloud compute instances create $type --image-project=$image_project --image-family=$image_family --machine-type=$type >> gcp.log
# wait till the cli get status status
stat=$(gcloud compute instances describe $type | grep -iF RUNNING)
while [ -z "$stat" ]; do stat=$(gcloud compute instances describe $type | grep -iF RUNNING);echo "loop"; done
end_time=$(date +%s)
# get the used time
time=$(($end_time-$start_time))
# return time
echo $time

# terminate the instances
gcloud compute instances delete $type --quiet
