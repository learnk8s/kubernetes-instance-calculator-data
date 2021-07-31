const fs = require('fs');
const region = "us-east-1";
const cloud = "aws"
const inputFile = "./aws.json";
const outputFile = "instances.json";
const memType = "binary"
const cmd=require('node-cmd');

//get the input data which generate by aws cli aws ec2 describe-instance-types --instance-types > aws.json
let input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
let instances = [];
input = input.InstanceTypes;

for (let i = 0; i < input.length; i++) {
    let maxPodCount = cmd.runSync('bash max-pods-calculator.sh --cni-version 1.7.5  --instance-type '+input[i].InstanceType).data.trim()
    instances.push([
        {
            id: input[i].InstanceType,
            name: input[i].InstanceType,
            os: { memory: { value: 100, type: memType }, cpu: 100 }, //TODO calculate
            kubelet: { memory: { value: 100, type: memType }, cpu: 100 },//TODO calculate
            evictionThreshold: { memory: { value: 100, type: memType }, cpu: 0 },//TODO calculate
            totalMemory: { value: input[i].MemoryInfo.SizeInMiB, type: memType },
            totalCpu: input[i].VCpuInfo.DefaultVCpus,
            costPerHour: 0.0949995,//TODO find
            provisioningTime: 12000,
            maxPodCount: maxPodCount,
            cloudProvider: cloud,
        }
    ]);
}



// append to output file
if (fs.existsSync(outputFile)) {
    let arr = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    instances.forEach(instance => arr.push(instance));
    fs.writeFileSync(outputFile, JSON.stringify(arr),'utf8');
} else {
    let json = JSON.stringify(instances);
    fs.writeFileSync(outputFile, json,'utf8');
}


