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

const { program } = require("commander");

program
  .command("crunch")
  .option("-o, --output <file name>", "Output file name.", "instances.json")
  .option(
    "-c, --cloud-providers <providers...>",
    "Includes only those providers. Default: all",
    "all"
  )
  .option("-t, --time", "Includes the provisioning time for each compute unit.")
  .action((options) => {
    const cloudProviders = (
      Array.isArray(options.cloudProviders)
        ? options.cloudProviders
        : [options.cloudProviders]
    )
      .map((it) => it.toLowerCase())
      .filter((it) => ["aws", "gcp", "azure", "all"].includes(it));

    const instances = (
      cloudProviders.includes("all") ? ["aws", "gcp", "azure"] : cloudProviders
    )
      .reduce((acc, it) => {
        switch (it) {
          case "gcp":
            return [
              ...acc,
              ...getGCPInstances(
                fs.readFileSync(gcpInstances, "utf-8"),
                gcpPricing.gcp_price_list,
                !!options.time
              ),
            ];
          case "aws":
            return [
              ...acc,
              ...getAWSInstances(
                awsInstances.InstanceTypes,
                awsPricing,
                !!options.time
              ),
            ];
          case "azure":
            return [
              ...acc,
              ...getAzureInstances(
                azureInstances,
                azurePricing.data,
                !!options.time
              ),
            ];
          default:
            return acc;
        }
      }, [])
      .reduce((acc, it) => {
        acc[it.id] = it;
        return acc;
      }, {});

    if (Object.values(instances).some((it) => isNull(it.costPerHour))) {
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
        if (!isNull(it.costPerHour)) {
          acc[it.id] = it;
        }
        return acc;
      }, {});
      fs.writeFileSync(options.output, JSON.stringify(content), "utf8");
      console.log(`output has been written to ${options.output}`);
    } else {
      console.log("No instances exported.");
      return;
    }

    const longestName = Math.max.apply(
      null,
      Object.values(instances).map((it) => it.name.length)
    );
    console.log(`The longest instance name has ${longestName} characters`);
  });

program.parse(process.argv);

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function isNull(value) {
  return {}.toString.call(value) === "[object Null]";
}
