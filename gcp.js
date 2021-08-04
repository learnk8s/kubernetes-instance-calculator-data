const fs = require("fs");
const { readFileSync } = require("fs");

const region = "us-east1-b";
const cloudProvider = "gcp";
const inputFile = "./gcp.txt";
const outputFile = "instances.json";
const memType = "si";
let maxPodCount = 110;

//get the input data which generate by  gcloud compute machine-types list  --filter="zone:us-east1-b" > gcp.txt
const readFile = (path) => readFileSync(path, "utf-8");
const convertStrToArray = (str) => str.split(" ").filter((word) => word);
let input = getData();
let instances = [];

for (let i = 0; i < input.length; i++) {
  let totalMemory = GB2MB(input[i].memory_gb);
  let totalCpu = input[i].cpus;

  instances.push([
    {
      id: input[i].name,
      name: input[i].name,
      os: { memory: { value: 100, type: memType }, cpu: 100 },
      kubelet: {
        memory: reservedKubeletMemory({ value: totalMemory, type: memType }),
        cpu: reservedFromCores(totalCpu),
      },
      evictionThreshold: {
        memory: { value: 100, type: "si" },
        cpu: 0,
      },
      totalMemory: { value: totalMemory, type: memType },
      totalCpu,
      costPerHour: 0.0949995, //TODO find
      maxPodCount,
      cloudProvider,
    },
  ]);
}

// append to output file
if (fs.existsSync(outputFile)) {
  let arr = JSON.parse(fs.readFileSync(outputFile, "utf8"));
  instances.forEach((instance) => arr.push(instance));
  fs.writeFileSync(outputFile, JSON.stringify(arr), "utf8");
} else {
  let json = JSON.stringify(instances);
  fs.writeFileSync(outputFile, json, "utf8");
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

function GB2MB(GB) {
  return GB * 1000;
}

function getData() {
  const textToArray = readFile(inputFile).split("\n");
  const headers = convertStrToArray(textToArray[0]).map((header) =>
    header.toLowerCase()
  );
  const output = [];
  for (const data of textToArray.splice(1)) {
    const dataToArray = convertStrToArray(data);
    output.push(
      headers.reduce(
        (all, header, index) =>
          (all = { ...all, [header]: dataToArray[index] || "" }),
        {}
      )
    );
  }
  return output;
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
