const { reservedKubeletMemory, si2binary, hash } = require("./helpers");

const region = "eastus";
const cloudProvider = "azure";
const memType = "binary";
const maxPodCount = 250;

// source: https://docs.microsoft.com/en-us/azure/aks/quotas-skus-regions#restricted-vm-sizes
const invalidSKUs = [
  "Standard_A0",
  "Standard_A1",
  "Standard_A1_v2",
  "Standard_B1ls",
  "Standard_B1s",
  "Standard_B1ms",
  "Standard_F1",
  "Standard_F1s",
  "Standard_A2",
  "Standard_D1",
  "Standard_D1_v2",
  "Standard_DS1",
  "Standard_DS1_v2",
].map((it) => it.toLowerCase());

module.exports = function getAzureInstances(input, pricing) {
  //get the input data which generate by az vm list-sizes --location eastus > az.json
  const instances = [];

  for (let i = 0; i < input.length; i++) {
    const totalMemory = input[i].memoryInMb;
    const totalCpuCores = input[i].numberOfCores;
    const name = input[i].name;

    if (invalidSKUs.includes(name.toLowerCase())) {
      continue;
    }

    if (name.toLowerCase().endsWith("promo")) {
      continue;
    }

    const costPerHour =
      pricing.find((it) => it["VM name"] === name)?.["Linux $"] ?? null;

    instances.push({
      id: hash(input[i].name),
      name: input[i].name
        .replace(/_/g, " ")
        .replace(/Standard /, "")
        .replace("Basic", "")
        .trim(),
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
        cpu: reservedFromCores(totalCpuCores),
      },
      evictionThreshold: {
        memory: { value: 100, type: memType },
        cpu: 0,
      },
      totalMemory: { value: totalMemory, type: memType },
      totalCpu: totalCpuCores * 1000,
      costPerHour,
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
