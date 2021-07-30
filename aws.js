const fs = require('fs');

const region = "us-east-1";
const cloud = "aws"
const outputFile = "instances.json";
const memType = "binary"

let instances = [
    {
        id: "n1-standard-2",
        name: "n1-standard-2",
        os: { memory: { value: 100, type: memType }, cpu: 100 },
        kubelet: { memory: { value: 100, type: memType }, cpu: 100 },
        evictionThreshold: { memory: { value: 100, type: memType }, cpu: 0 },
        totalMemory: { value: 7500, type: memType },
        totalCpu: 2000,
        costPerHour: 0.0949995,
        provisioningTime: 12000,
        maxPodCount: 110,
        cloudProvider: cloud,
    }
];



// append to output file
if (fs.existsSync(outputFile)) {
    let arr = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    instances.forEach(instance => arr.push(instance));
    fs.writeFileSync(outputFile, JSON.stringify(arr),'utf8');
} else {
    let json = JSON.stringify(instances);
    fs.writeFileSync(outputFile, json,'utf8');
}


