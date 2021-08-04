const fs = require('fs');
const cmd=require('node-cmd');

const region = "us-east-1";
const cloud = "aws"
const inputFile = "./aws.json";
const outputFile = "instances.json";
const memType = "binary"

//get the input data which generate by aws cli aws ec2 describe-instance-types --instance-types > aws.json
let input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
let instances = [];
input = input.InstanceTypes;
let maxPodCount;
let totalMem,kubeletMem,osMem,evictionMem;
let totalCpu;

for (let i = 0; i < input.length; i++) {

    maxPodCount = cmd.runSync('bash max-pods-calculator.sh --cni-version 1.7.5  --instance-type '+input[i].InstanceType).data.trim()
    totalMem = input[i].MemoryInfo.SizeInMiB;
    kubeletMem = totalMem * 0.09;
    evictionMem = totalMem * 0.01;
    osMem = totalMem * 0.01;
    totalCpu = input[i].VCpuInfo.DefaultVCpus;

    instances.push([
        {
            id: input[i].InstanceType,
            name: input[i].InstanceType,
            os: { memory: { value: osMem, type: memType }, cpu: 100 },
            kubelet: { memory: { value: kubeletMem, type: memType }, cpu: reservedFromCores[totalCpu] },
            evictionThreshold: { memory: { value: evictionMem, type: memType }, cpu: 100 },
            totalMemory: { value: totalMem, type: memType },
            totalCpu: totalCpu,
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

function reservedFromCores(cores) {
    if (cores < 1) {
        return 0;
    }
    let reservedCpu = 1000 * 0.06;
    if (cores > 1) {
        reservedCpu += 1000 * 0.01;
    }
    if (cores > 2) {
        reservedCpu += Math.min(cores - 2, 4) * 1000 * 0.005;
    }
    if (cores > 4) {
        reservedCpu += (cores - 4) * 1000 * 0.0025;
    }
    return reservedCpu;
}
