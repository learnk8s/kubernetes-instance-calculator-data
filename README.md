## k8s data feed

Export a list of instances with:

```bash
node run.js crunch
```

#### generate the input files

```bash
aws ec2 describe-instance-types --instance-types > input/aws.json
```

```bash
gcloud compute machine-types list  --filter="zone:us-east1-b" > input/gcp.txt
```

```bash
az vm list-sizes --location eastus > input/azure.json
```

#### generate the pricing files

```bash
download csv from https://instances.vantage.sh/ and convert to json file
```

```bash
wget https://cloudpricingcalculator.appspot.com/static/data/pricelist.json -O input/gcp-pricing.json
```

```bash
download json from https://azureprice.net/
```

#### Calculator

Please check the Kubernetes instance calculator that uses the raw data https://learnk8s.io/kubernetes-instance-calculator
