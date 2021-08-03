## k8s data feed 

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

#### run the scripts:

````bash
node aws.js
````

````bash
node gcp.js
````

````bash
node azure.js
````