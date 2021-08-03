const fs = require('fs');
const { readFileSync } = require('fs');

const region = "us-east1-b";
const cloud = "gcp"
const inputFile = "./gcp.txt";
const outputFile = "instances.json";
const memType = "si"
let maxPodCount=110;


//get the input data which generate by  gcloud compute machine-types list  --filter="zone:us-east1-b" > gcp.txt
const readFile = (path) => readFileSync(path, 'utf-8');
const convertStrToArray = (str) => str.split(' ').filter((word) => word);
let input = getData();
let instances = [];
let totalMem,kubeletMem,osMem,evictionMem;
let totalCpu;

for (let i = 0; i < input.length; i++) {

    totalMem = GB_MB(input[i].memory_gb);
    kubeletMem = totalMem * 0.23;
    evictionMem = totalMem * 0.01;
    osMem = totalMem * 0.01;
    totalCpu = input[i].cpus;

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

function GB_MB(GB) {
    return GB*1000;
}

function getData() {
    const textToArray = (readFile(inputFile)).split('\n');
    const headers = convertStrToArray(textToArray[0]).map((header) =>
        header.toLowerCase()
    );
    const output = [];
    for (const data of textToArray.splice(1)) {
        const dataToArray = convertStrToArray(data);
        output.push(
            headers.reduce(
                (all, header, index) =>
                    (all = { ...all, [header]: dataToArray[index] || '' }),
                {}
            )
        );
    }
    return output;
}
