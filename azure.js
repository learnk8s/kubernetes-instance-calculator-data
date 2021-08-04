const fs = require('fs');

const region = "eastus";
const cloudProvider = "azure"
const inputFile = "./az.json";
const outputFile = "instances.json";
const memType = "binary"

//get the input data which generate by  az vm list-sizes --location eastus > az.json
let input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));

let instances = [];
let maxPodCount=110;
let totalCpu,totalMemory;

for (let i = 0; i < input.length; i++) {

    totalMemory = input[i].memoryInMb;
    totalCpu = input[i].numberOfCores;

    instances.push([
        {
            id: input[i].name,
            name: input[i].name,
            os: { memory: { value: 100, type: memType }, cpu: 100 },
            kubelet: {
                memory: {
                    value: Math.round(
                        si2binary(
                            reservedKubeletMemory({ value: totalMemory, type: memType })
                        )
                    ),
                    type: memType,
                },
                cpu: reservedFromCores(totalCpu),
            },
            evictionThreshold: {
                memory: { value: 100, type: memType },
                cpu: 0,
            },
            totalMemory: { value: totalMemory, type: memType },
            totalCpu,
            costPerHour: 0.0949995, //TODO find
            maxPodCount,
            cloudProvider,
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

function reservedKubeletMemory(memory) {
    if (memory < 1) {
        return { value: 0, type: "binary" };
    }
    const memoryInBinaryNotation = si2binary(memory);
    let reservedMemory = 255;
    if (memoryInBinaryNotation > 1000) {
        reservedMemory += 0.25 * Math.min(memoryInBinaryNotation, 4000);
    }
    if (memoryInBinaryNotation > 4000) {
        reservedMemory += 0.2 * Math.min(memoryInBinaryNotation - 4000, 8000);
    }
    if (memoryInBinaryNotation > 8000) {
        reservedMemory += 0.1 * Math.min(memoryInBinaryNotation - 8000, 16000);
    }
    if (memoryInBinaryNotation > 16000) {
        reservedMemory += 0.06 * Math.min(memoryInBinaryNotation - 16000, 128000);
    }
    if (memoryInBinaryNotation > 128000) {
        reservedMemory += 0.02 * (memoryInBinaryNotation - 128000);
    }
    return { value: reservedMemory, type: "binary" };
}


function binary2si(value) {
    if (typeof value === "number") {
        return 1.024 * value;
    }
    return value.type === "binary" ? binary2si(value.value) : value.value;
}

function si2binary(value) {
    if (typeof value === "number") {
        return value / 1.024;
    }
    return value.type === "si" ? si2binary(value.value) : value.value;
}
