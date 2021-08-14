const {
  binary2si,
  reservedKubeletMemory,
  reservedFromCores,
  GB2MB,
  hash,
} = require("./helpers");
const cmd = require("node-cmd");

const region = "us-east1";
const cloudProvider = "gcp";
const memType = "si";
const maxPodCount = 110;
const provisioningTimeScript = "./scripts/azure.launcher.sh";

//get the input data which generate by  gcloud compute machine-types list --filter="zone:us-east1-b" > gcp.txt
const convertStrToArray = (str) => str.split(" ").filter((word) => word);

module.exports = function getGCPInstances(inputFile, pricing) {
  const input = getData(inputFile);
  const instances = [];

  for (let i = 0; i < input.length; i++) {
    const totalMemory = GB2MB(parseInt(input[i].memory_gb, 10));
    const totalCpuCores = parseInt(input[i].cpus, 10);

    if (totalMemory <= 2000) {
      continue;
    }

    const costPerHour =
      pricing[`CP-COMPUTEENGINE-VMIMAGE-${input[i].name.toUpperCase()}`]?.[
        region
      ] ?? null;
    const provisioningTime = parseInt(
        cmd
            .runSync(
                `bash ${provisioningTimeScript} ${input[i].name}`
            )
            .data?.trim(),
        10
    );
    instances.push({
      id: hash(input[i].name),
      name: input[i].name,
      os: { memory: { value: 100, type: memType }, cpu: 100 },
      kubelet: {
        memory: {
          value: Math.round(
            binary2si(
              reservedKubeletMemory({ value: totalMemory, type: memType })
            )
          ),
          type: "si",
        },
        cpu: reservedFromCores(totalCpuCores),
      },
      evictionThreshold: {
        memory: { value: 100, type: "si" },
        cpu: 0,
      },
      totalMemory: { value: totalMemory, type: memType },
      totalCpu: totalCpuCores * 1000,
      costPerHour,
      maxPodCount,
      provisioningTime,
      cloudProvider,
    });
  }

  return instances;
};

function getData(inputFile) {
  const textToArray = inputFile
    .split("\n")
    .filter((it) => it.trim().length > 0);
  const headers = convertStrToArray(textToArray[0]).map((header) =>
    header.toLowerCase()
  );
  const output = [];
  for (const data of textToArray.slice(1)) {
    const dataToArray = convertStrToArray(data);
    output.push(
      headers.reduce(
        (all, header, index) =>
          (all = { ...all, [header]: dataToArray[index] || "" }),
        {}
      )
    );
  }
  return output.filter((it) => it.deprecated === "");
}
