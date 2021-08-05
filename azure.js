const { reservedKubeletMemory, si2binary, hash } = require("./helpers");

const region = "eastus";
const cloudProvider = "azure";
const memType = "binary";

module.exports = function getAzureInstances(input) {
  //get the input data which generate by  az vm list-sizes --location eastus > az.json
  const instances = [];
  const maxPodCount = 110;

  for (let i = 0; i < input.length; i++) {
    let totalMemory = input[i].memoryInMb;
    let totalCpu = input[i].numberOfCores;

    instances.push({
      id: hash(input[i].name),
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
    });
  }

  return instances;
};

function reservedFromCores(cores) {
  const map = { 1: 60, 2: 100, 4: 140, 8: 180, 16: 260, 32: 420, 64: 740 };
  return cores in map ? map[cores] : 0;
}
