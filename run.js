const fs = require("fs");
const getAzureInstances = require("./azure");
const getAWSInstances = require("./aws");
const getGCPInstances = require("./gcp");

const azureInstances = require("./input/azure.json");
const awsInstances = require("./input/aws.json");
const gcpInstances = "./input/gcp.txt";

const azurePricing = require("./input/azure-pricing.json");
const gcpPricing = require("./input/gcp-pricing.json");
const awsPricing = require("./input/aws-pricing.json");

const output="instances.json";

const args = process.argv
  .slice(2)
  .map((it) => it.trim().toLowerCase())
  .filter((it) => ['aws', 'gcp', 'azure', 'all-cloud', 'data', 'time', 'pricing', 'all-tasks'].includes(it))
  .filter(onlyUnique);

const allowedCloudProviders = ['aws', 'gcp', 'azure'];
const cloudProviders =
    args.length === 0 || args.includes('all-cloud')
        ? allowedCloudProviders
        : args.filter((cloud) => allowedCloudProviders.includes(cloud));

const allowedTasks = ['data', 'time', 'pricing'];
const tasks =
    args.length === 0 || args.includes('all-tasks')
        ? allowedTasks
        : args.filter((cloud) => allowedTasks.includes(cloud));

const instances = cloudProviders
  .reduce((acc, it) => {
    switch (it) {
      case "gcp":
        return [
          ...acc,
          ...getGCPInstances(
            fs.readFileSync(gcpInstances, "utf-8"),
            gcpPricing.gcp_price_list,
            tasks
          ),
        ];
      case "aws":
        return [
          ...acc,
          ...getAWSInstances(awsInstances.InstanceTypes, awsPricing,tasks),
        ];
      case "azure":
        return [
          ...acc,
          ...getAzureInstances(azureInstances, azurePricing.data,tasks),
        ];
      default:
        return acc;
    }
  }, [])
  .reduce((acc, it) => {
    acc[it.id] = it;
    return acc;
  }, {});

if (Object.values(instances).some((it) => isNull(it.costPerHour)) && tasks.includes('pricing')) {
  console.log(
    `Invalid prices for:\n${Object.values(instances)
      .filter((it) => isNull(it.costPerHour))
      .map((it) => `- ${it.name} (${it.cloudProvider})`)
      .join("\n")}`
  );
}

if (
  Object.values(instances)
    .map((it) => it.id)
    .filter(onlyUnique).length !== Object.values(instances).length
) {
  console.log("Collisions in the IDs");
}

if (Object.values(instances).length > 0) {
  const content = Object.values(instances).reduce((acc, it) => {
    if (!isNull(it.costPerHour) && tasks.includes('pricing')) {
      acc[it.id] = it;
    }
    return acc;
  }, {});
  fs.writeFileSync(output, JSON.stringify(content), "utf8");
  console.log(`output has been written to ${output}`)
} else {
  console.log("No instances exported.");
}

const longestName = Math.max.apply(
  null,
  Object.values(instances).map((it) => it.name.length)
);
console.log(`The longest instance name has ${longestName} characters`);

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function isNull(value) {
  return {}.toString.call(value) === "[object Null]";
}
