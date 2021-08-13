#!/bin/bash

### create and run new ec2

# the size of the instance
if [ -z $1 ]; then echo "type required";exit; fi
type=$1

image_id="ami-0d5eff06f840b45e9" # Amazon linux

# run ec2 command
aws ec2 run-instances --image-id $image_id --instance-type "$type" >> aws.log

start_time=$(date +%s)
### monitoring the instance
stat=$(aws ec2 describe-instance-status | grep "initializing")
# wait till the cli get status status
while [ -z "$stat" ]; do stat=$(aws ec2 describe-instance-status | grep "initializing"); done
# get the instance status, check if still "initializing"
while [ ! -z "$stat" ]; do stat=$(aws ec2 describe-instance-status | grep "initializing"); done
end_time=$(date +%s)
# get the used time
time=$(($end_time-$start_time))
#time=$(date --date=@$time -u +%M:%S) # for macos time=$(date -r $time -u +%M:%S)
time=$(date -r $time -u +%M:%S)
# return time
echo $time

# terminate the instance
aws ec2 terminate-instances --instance-ids $(aws ec2 describe-instances --filters "Name=instance-type,Values=$type" --query "Reservations[].Instances[].InstanceId"  --output text) >> aws.log