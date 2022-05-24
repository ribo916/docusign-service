## DOCUSIGN SETUP

### Prerequisites
This REPLIT requires the user to setup a free DocuSign account. Under Apps and Keys, you must create an integration application. Essentially, if you can create a quickstart or postman collection against your account, you can configure this replit as well. 

### Secrets 

Create the following secrets in your REPLIT based on your own DocuSign account

* integrationkey = When you create an API application, you get this 
* userid = At the account level. This is who our JWT is impersonating for esigning
* privatekey = Cut/paste your RSA private key here
* redirecturi = Cut/paste the redirect uri you set in your DocuSign API app. This is used for the initial consent. 

### Authentication Details

DocuSign uses the AuthCodeGrant consent flow on top of the JWT security

1. When we first grant consent, we need 'impersonation' to grant JWT future consent
2. Outside of that first call, it is not needed. 
3. If you dont include 'impersonation' during consent, the JWT request user token method will return 'consent_required'
4. signature scope is esignature rights
5. oAuthBasePath is https://account.docusign.com in PROD
6. apiBasePath is https://docusign.net in PROD

Note: You want to pull accountId from the impersonated userID to support multiple org accounts

### Access Token and Expiry Variables
We are using JWT authentication with this replit. We don't want users to require account setup. 

1. 3600 is 1 hour for our JWT, with no refresh token
2. AuthCodeGrant is 8 hours plus a 30 day refresh token, then a new login required



## IMM integration
This REPL also supports IMM just for comparison purposes, but isn't required. This requires relationship with IMM. The Secrets that must be configured if forking this REPLIT are:

* imm_apikey
* imm_buisnessappuserid
* imm_endpoint
* imm_hostfiid
* imm_partnerid
* imm_userid




