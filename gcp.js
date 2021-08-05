const {
  binary2si,
  reservedKubeletMemory,
  reservedFromCores,
  GB2MB,
  hash,
} = require("./helpers");

const region = "us-east1-b";
const cloudProvider = "gcp";
const memType = "si";
let maxPodCount = 110;

//get the input data which generate by  gcloud compute machine-types list  --filter="zone:us-east1-b" > gcp.txt
const convertStrToArray = (str) => str.split(" ").filter((word) => word);

module.exports = function getGCPInstances(inputFile) {
  const input = getData(inputFile);
  const instances = [];

  for (let i = 0; i < input.length; i++) {
    const totalMemory = GB2MB(parseInt(input[i].memory_gb, 10));
    const totalCpu = parseInt(input[i].cpus, 10);

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
