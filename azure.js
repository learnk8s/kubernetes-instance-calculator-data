const fs = require('fs');

const region = "eastus";
const cloud = "azure"
const inputFile = "./az.json";
const outputFile = "instances.json";
const memType = "binary"

//get the input data which generate by  az vm list-sizes --location eastus > az.json
let input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

let instances = [];
let maxPodCount=110;
let totalMem,kubeletMem,osMem,evictionMem;
let totalCpu;

for (let i = 0; i < input.length; i++) {

    totalMem = input[i].memoryInMb;
    kubeletMem = totalMem * 0.23;
    evictionMem = totalMem * 0.09;
    osMem = totalMem * 0.01;
    totalCpu = input[i].numberOfCores;

    instances.push([
        {
            id: input[i].name,
            name: input[i].name,
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
    let map = {'1':60, '2':100, '4':140, '8':180, '16':260, '32':420, '64':740};
    return map[cores];
}
