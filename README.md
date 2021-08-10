## k8s data feed

Export a list of instances with:

```bash
node run.js [aws|gcp|azure|all]
```

#### generate the input files
````bash
aws ec2 describe-instance-types --instance-types > aws.json
````
````bash
gcloud compute machine-types list  --filter="zone:us-east1-b" > gcp.txt
````
````bash
az vm list-sizes --location eastus > az.json
````
#### generate the pricing files
````bash
download csv from https://instances.vantage.sh/ and convert to json file 
````
````bash
wget https://cloudpricingcalculator.appspot.com/static/data/pricelist.json -O gcp-pricing.json
````
````bash
download json from https://azureprice.net/
````
