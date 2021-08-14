const cmd = require("node-cmd");
const { reservedFromCores, hash } = require("./helpers");

const region = "us-east-1";
const cloudProvider = "aws";
const memType = "binary";
const maxPodScript = "./scripts/max-pods-calculator.sh";
const provisioningTimeScript = "./scripts/aws.launcher.sh";

module.exports = function getAWSInstances(input, pricing) {
  //get the input data which generate by aws cli aws ec2 describe-instance-types --instance-types > aws.json
  const instances = [];

  for (let i = 0; i < input.length; i++) {
    const maxPodCount = parseInt(
      cmd
        .runSync(
          `bash ${maxPodScript} --cni-version 1.9.0 --instance-type ${input[i].InstanceType}`
        )
        .data?.trim(),
      10
    );
    const provisioningTime = parseInt(
      cmd
        .runSync(
          `bash ${provisioningTimeScript} ${input[i].InstanceType}`
        )
        .data?.trim(),
      10
    );
    const totalMemory = input[i].MemoryInfo.SizeInMiB;
    const totalCpuCores = input[i].VCpuInfo.DefaultVCpus;

    // Source: https://cloudgeometry.io/blog/amazon-eks/#:~:text=EKS%20supports%20many%20EC2%20instance,and%20OS%20under%20some%20load.
    if (totalMemory <= 2000) {
      continue;
    }

    if (isNaN(maxPodCount)) {
      console.log(
        `I could not find the max pod count for the instance ${input[i].InstanceType}`
      );
      continue;
    }

    const costPerHour = parseFloat(
      pricing
        .find((it) => it["API Name"] === input[i].InstanceType)
        ?.["Linux On Demand cost"].replace("$", "")
        .replace(" hourly", "")
    );

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
      totalMemory: { value: totalMemory, type: memType },
      totalCpu: totalCpuCores * 1000,
      costPerHour: isNaN(costPerHour) ? null : costPerHour,
      maxPodCount,
      provisioningTime,
      cloudProvider,
    });
  }

  return instances;
};

function computeKubeletMemory(maxPodCount) {
  return { value: 255 + 11 * maxPodCount, type: "binary" };
}
