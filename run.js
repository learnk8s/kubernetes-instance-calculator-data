const fs = require("fs");
const getAzureInstances = require("./azure");
const getAWSInstances = require("./aws");
const getGCPInstances = require("./gcp");

const azureInstances = require("./az.json");
const awsInstances = require("./aws.json");

const args = process.argv
  .slice(2)
  .map((it) => it.trim().toLowerCase())
  .filter((it) => ["aws", "gcp", "azure", "all"].includes(it))
  .filter(onlyUnique);

const cloudProviders =
  args.length === 0 || args.includes("all") ? ["aws", "gcp", "azure"] : args;

const instances = cloudProviders.reduce((acc, it) => {
  switch (it) {
    case "gcp":
      return [
        ...acc,
        ...getGCPInstances(fs.readFileSync("./gcp.txt", "utf-8")),
      ];
    case "aws":
      return [...acc, ...getAWSInstances(awsInstances.InstanceTypes)];
    case "azure":
      return [...acc, ...getAzureInstances(azureInstances)];
    default:
      return acc;
  }
}, []);

if (
  instances.map((it) => it.id).filter(onlyUnique).length !== instances.length
) {
  console.log("Collision in IDs");
}

if (instances.length > 0) {
  fs.writeFileSync(
    "instances.json",
    JSON.stringify(instances, null, 2),
    "utf8"
  );
} else {
  console.log("No instances exported.");
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}
