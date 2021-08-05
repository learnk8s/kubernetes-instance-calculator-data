const cmd = require("node-cmd");
const { reservedFromCores, hash } = require("./helpers");

const region = "us-east-1";
const cloudProvider = "aws";
const memType = "binary";

module.exports = function getAWSInstances(input) {
  //get the input data which generate by aws cli aws ec2 describe-instance-types --instance-types > aws.json
  const instances = [];

  for (let i = 0; i < input.length; i++) {
    const maxPodCount = parseInt(
      cmd
        .runSync(
          `bash max-pods-calculator.sh --cni-version 1.9.0 --instance-type ${input[i].InstanceType}`
        )
        .data?.trim(),
      10
    );
    const totalMem = input[i].MemoryInfo.SizeInMiB;
    const totalCpuCores = input[i].VCpuInfo.DefaultVCpus;

    if (isNaN(maxPodCount)) {
      console.log(
        `I could not find the max pod count for the instance ${input[i].InstanceType}`
      );
      continue;
    }

    instances.push({
      id: hash(input[i].InstanceType),
      name: input[i].InstanceType,
      os: { memory: { value: 100, type: memType }, cpu: 100 },
      kubelet: {
        memory: computeKubeletMemory(maxPodCount),
        cpu: reservedFromCores(totalCpuCores),
      },
      evictionThreshold: {
        memory: { value: 100, type: memType },
        cpu: 0,
      },
      totalMemory: { value: totalMem, type: memType },
      totalCpu: totalCpuCores * 1000,
      costPerHour: 0.0949995, //TODO find
      maxPodCount,
      cloudProvider,
    });
  }

  return instances;
};

function computeKubeletMemory(maxPodCount) {
  return { value: 255 + 11 * maxPodCount, type: "binary" };
}
