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
    let brackets = [
        {lower: 0, upper: 1, prev: 0, percent: 60},
        {lower: 1, upper: 2, prev: 60, percent: 10},
        {lower: 2, upper: 4, prev: 70, percent: 5},
        {lower: 4, upper: Infinity, prev: 80, percent: 2.5}
    ];

    for (let bracket of brackets) {
        if (cores<=bracket.upper){
            return (cores - bracket.lower) * bracket.percent + bracket.prev;
        }
    }
}
