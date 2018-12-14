Overview

### Introduction to the Bloom Attestation Kit


The Bloom Attestation Kit is a Docker Compose system, a set of Docker images, that allows you to deploy a service for your application to interact with the Bloom ecosystem, as both an attester and a requester.

The Bloom Attestation Kit system is essentially split into two actors, an attester and a requester. The requester accepts authorized API requests that begin a Whisper negotiation over the Ethereum network, in which attesters can submit bids for their price to verify the information the requester specifies. The requester, after receiving a bid it deems satisfactory, submits a request to a specified web application, providing it with the information required for the subject of the attestation to submit a signature for the attestation request. After that, the requester submits the necessary information to the attester, who can then proceed to commit the attestation into the Bloom contracts on the Ethereum blockchain, receiving payment and completing the process.

A basic installation of the Bloom Attestation Kit is as simple as pulling a copy of the Git repository, configuring its environment variables, hooking it up to your web application, and starting it up.

$ git pull git@github.com:hellobloom/attestation-kit.git
$ cd attestation-kit


### Environment Variables

*** Configuring the Bloom Attestation Kit

Most of the installation of the Attestation Kit consists of setting environment variables. These variables should be set in the .env file at the top level of the Attestation Kit repository (not to be confused with the file at /app/.env.sample, which you should generally never have to edit).
Variable 	Role 	Required 	Description
API_KEY_SHA256 	All 	Yes 	SHA256 hash of API key required to authenticate requests. When generating a key, make sure to use a long (>20 characters) random string.
NEWRELIC_KEY 	All 	No 	Key used to send events and debugging information to NewRelic.
SENTRY_DSN 	All 	No 	URL used to send events and debugging information to Sentry.
NODE_ENV 	All 	Yes 	Should almost always be set to "production".
WEB3_PROVIDER 	All 	Yes 	A URL, either HTTPS or a local websocket/RPC connection, for an Ethereum RPC provider. Most people will probably want to set up an account with Infura - more advanced users may prefer to set up a secured Geth node for this purpose.
RINKEBY_WEB3_PROVIDER 	All 	Yes 	Same as above, except for the Rinkeby Ethereum test network instead of the main Ethereum network.
WHISPER_PROVIDER 	All 	Yes 	RPC for a private geth node, i.e., not accessible by anyone who shouldn't have access to your secured information. Typically, you'll want to simply set this to ws://attestation-kit_gethworker_1:8546, the default address and port for the geth node contained within the Attestation Kit Compose environment.
PRIMARY_ETH_PRIVKEY 	All 	Yes 	An Ethereum private key.
PRIMARY_ETH_ADDRESS 	All 	Yes 	The Ethereum address derived from the above private key.
WHISPER_PASSWORD 	All 	Yes 	The password used for decryption of public solicitations on Whisper. By default, set this to `productionBloom`.
BLOOM_WHISPER_PG_URL 	All 	Yes 	URL of PostgreSQL database to be used through the Attestation Kit. By default, there's a PostgreSQL database running within the Attestation Kit- for which the value should be set to postgres://bloomwhisper:bloomwhisperpw@pgdb/bloom-whisper - but you can also set this to the URL of an external database.
ATTESTER_MIN_REWARDS 	Attester 	Yes 	A JSON object mapping types of attestations to minimum acceptable rewards, as measured in BLT. Example: {"phone":"0.1", "sanction":"0.1"}. Currently, acceptable keys are "phone", "email", "facebook", "sanction", and "pep-screen". For a node that should only operate as a requester, supply an empty object: {}.
WEBHOOK_HOST 	All 	Yes 	HTTPS address for your application - this will be the base URL for any webhooks hosted by your application.
WEBHOOK_KEY 	All 	Yes 	Shared secret key (string) for authenticating your copy of the Attestation Kit to your application. Key will be provided to your application as a header api_token, which should authenticate it against a securely hashed (or hashed and salted) copy stored in a place accessible to your application.
APPROVED_ATTESTERS 	Attester 	No 	JSON object mapping attestation types (or string "all") to array of Ethereum addresses of attesters. Example: {"all": ["0x19859151..."], "email": ["0x54321..."]}. A universal whitelist can also be applied by assigning any value to the property "any": {"any":"x"}.
APPROVED_REQUESTERS 	Attester 	No 	JSON object mapping attestation types (or string "all") to array of Ethereum addresses of requesters. Example: {"all": ["0x19859151..."], "email": ["0x54321..."]}. A universal whitelist can also be applied by assigning any value to the property "any": {"any":"x"}.


### Attester API

Attestation Kit attester API endpoints
GET /api/attestations

Lists all attester attestations (where "role" is equal to "attester"). Optional scoping via "where" parameter.


### Parameters

Name 	Type 	Required 	Description
where 	object 	No 	An object describing parameters to match for attestations. Example values: {"id": "10f7a585-6aa8-4efb-b621-a3de956c2459"}, {"type":"phone"}, {"requester":"0xafbe892398bfbabcebfa92185918325abc19a"}
per_page 	integer 	No 	Number of results to show per page (default value is 100)
page 	integer 	No 	What page to display (default value is 0)


### Response

{
  "success":true,
  "attestations":[
    {
      "result":null,
      "requestNonce":"0xbce098adbfeba8c0baefb80cab8c0ffbfcabfcabfcabfcabfcabfcabfcabfcaa",
      "paymentNonce":"0xfabcb9aefb32509fbaced19835dbf837d8fea0fb10afbefab9cbea081bf8af9c",
      "attestTx":"0x",
      "id":"fabcde90-f5e6-411f-9a61-9999c04fc70c",
      "types":[0],
      "type":"phone",
      "status":"initial",
      "attester":{"type":"Buffer","data":[3,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,10]},
      "requester":{"type":"Buffer","data":[3,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,10]},
      "subject":{"type":"Buffer","data":[3,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,10]},
      "role":"attester",
      "subjectSig":{"type":"Buffer","data":[99,2,128,5,136,5,59,1,5,183,137,1,2,5,119,100,100,100,100,100,39,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,25,25,25,250,250,23,250,250,7,250,30,11,55,11,22,33,44,25,15,62,42,21,167,66,34,28]},
      "paymentSig":{"type":"Buffer","data":[104,5,128,5,136,5,59,1,5,183,137,1,2,5,119,100,100,100,100,100,39,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,25,25,25,250,250,23,250,250,7,250,30,11,55,11,22,33,44,25,15,62,42,21,167,66,34,28]},
      "negotiationId":"fabc9190-f5e6-411f-9a61-1b3cc0dddddd",
      "createdAt":"2018-07-17T18:10:20.518Z",
      "updatedAt":"2018-07-17T18:10:20.518Z",
      "data": { "data": [ { "data": "+17185559999", "type": "phone", "nonce": "abcdef12-1111-4444-5192-18295172fab2" } ], "verificationStatus": "pending" }
    }
  ]
}


### POST /api/attestations

Perform an attestation. Takes an existing attestation and commits it on-chain.
Parameters
Name 	Type 	Required 	Description
attestation_id 	UUID 	Yes 	ID of attestation
negotiation_id 	UUID 	Sometimes 	ID of negotiation. If omitted, the attestation's currently set negotiationId will be used.
gas_price 	integer (BLT in wei units) 	Yes 	Gas price to use for committing the attestation, as measured in "wei". Gas prices can be found at ETH Gas Station or via geth's gas price oracle feature.
Response

{
  "success":true,
  "attestations":[
    {
      "result":null,
      "requestNonce":"0xbce098adbfeba8c0baefb80cab8c0ffbfcabfcabfcabfcabfcabfcabfcabfcaa",
      "paymentNonce":"0xfabcb9aefb32509fbaced19835dbf837d8fea0fb10afbefab9cbea081bf8af9c",
      "paymentNonce":"0xfabcb9aefb32509fbaced19835dbf837d8fea0fb10afbefab9cbea081bf8af9c",
      "attestTx":"0x4e3a3754410177e6937ef1f84bba68ea139e8d1a2258c5f85db9f1cd715a1bdd",
      "id":"fabcde90-f5e6-411f-9a61-9999c04fc70c",
      "types":[0],
      "type":"phone",
      "status":"initial",
      "attester":{"type":"Buffer","data":[3,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,10]},
      "requester":{"type":"Buffer","data":[3,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,10]},
      "subject":{"type":"Buffer","data":[3,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,10]},
      "role":"attester",
      "subjectSig":{"type":"Buffer","data":[99,2,128,5,136,5,59,1,5,183,137,1,2,5,119,100,100,100,100,100,39,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,25,25,25,250,250,23,250,250,7,250,30,11,55,11,22,33,44,25,15,62,42,21,167,66,34,28]},
      "paymentSig":{"type":"Buffer","data":[104,5,128,5,136,5,59,1,5,183,137,1,2,5,119,100,100,100,100,100,39,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,25,25,25,250,250,23,250,250,7,250,30,11,55,11,22,33,44,25,15,62,42,21,167,66,34,28]},
      "negotiationId":"fabc9190-f5e6-411f-9a61-1b3cc0dddddd",
      "createdAt":"2018-07-17T18:10:20.518Z",
      "updatedAt":"2018-07-17T18:10:20.518Z",
      "data": null
    }
  ]


  ### Requester API

  Attestation Kit requester API endpoints
  GET /api/requests

  Lists all requester attestations (where "role" is equal to "requester"). Optional scoping via "where" parameter.
  Parameters
  Name 	Type 	Required 	Description
  where 	object 	No 	An object describing parameters to match for attestations. Example values: {"id": "10f7a585-6aa8-4efb-b621-a3de956c2459"}, {"type":"phone"}, {"requester":"0xafbe892398bfbabcebfa92185918325abc19a"}
  per_page 	integer 	No 	Number of results to show per page (default value is 100)
  page 	integer 	No 	What page to display (default value is 0)
  Response

  {
    "success":true,
    "attestations":[
      {
        "result":null,
        "requestNonce":"0xbce098adbfeba8c0baefb80cab8c0ffbfcabfcabfcabfcabfcabfcabfcabfcaa",
        "paymentNonce":"0xfabcb9aefb32509fbaced19835dbf837d8fea0fb10afbefab9cbea081bf8af9c",
        "attestTx":"0x",
        "id":"fabcde90-f5e6-411f-9a61-9999c04fc70c",
        "types":[0],
        "type":"phone",
        "status":"initial",
        "attester":{"type":"Buffer","data":[3,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,19,10]},
        "requester":{"type":"Buffer","data":[3,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,10]},
        "subject":{"type":"Buffer","data":[3,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,10]},
        "role":"requester",
        "subjectSig":{"type":"Buffer","data":[99,2,128,5,136,5,59,1,5,183,137,1,2,5,119,100,100,100,100,100,39,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,25,25,25,250,250,23,250,250,7,250,30,11,55,11,22,33,44,25,15,62,42,21,167,66,34,28]},
        "paymentSig":{"type":"Buffer","data":[104,5,128,5,136,5,59,1,5,183,137,1,2,5,119,100,100,100,100,100,39,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,25,25,25,250,250,23,250,250,7,250,30,11,55,11,22,33,44,25,15,62,42,21,167,66,34,28]},
        "negotiationId":"fabc9190-f5e6-411f-9a61-1b3cc0dddddd",
        "createdAt":"2018-07-17T18:10:20.518Z",
        "updatedAt":"2018-07-17T18:10:20.518Z",
        "data": { "data": [ { "data": "+17185559999", "type": "phone", "nonce": "abcdef12-1111-4444-5192-18295172fab2" } ], "verificationStatus": "pending" }
      }
    ]
  }

  POST /api/requests

  Create new request. Creates a new attestation and begins the Whisper negotiation process.



  ### Parameters


  Name 	Type 	Required 	Description
  attestation_type_id 	integer 	Either this or attestation_type 	Index of attesation type (0 to 4, in same order as below)
  attestation_type 	string 	Either this or attestation_type_id 	String of attestation type ("phone", "email", "facebook", "sanction-screen", or "pep-screen")
  subject_eth_address 	ETH address 	Yes 	ETH address of attestation subject
  reward 	integer (BLT in wei units) 	Yes 	Maximum acceptable reward for negotiation



  ### Response

  {
    "success":true,
    "attestations":[
      {
        "result":null,
        "requestNonce":"0x",
        "paymentNonce":"0x",
        "attestTx":"0x",
        "id":"fabcde90-f5e6-411f-9a61-9999c04fc70c",
        "types":[0],
        "type":"phone",
        "status":"initial",
        "attester":null,
        "requester":{"type":"Buffer","data":[3,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,10]},
        "subject":{"type":"Buffer","data":[3,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,10]},
        "role":"requester",
        "subjectSig":null,
        "paymentSig":null,
        "negotiationId":null,
        "createdAt":"2018-07-17T18:10:20.518Z",
        "updatedAt":"2018-07-17T18:10:20.518Z",
        "data": { "data": [ { "data": "+17185559999", "type": "phone", "nonce": "abcdef12-1111-4444-5192-18295172fab2" } ], "verificationStatus": "pending" }
      }
    ]
  }

  POST /api/requests/send

  Send job details to an attester to allow them to perform the attestation.



  ### Parameters


 | Name | Type | Required | Description |

 |------|------|----|-----|

 |job_details 	string of JSON object 	Yes 	An object containing the job details necessary to submit the attestation, complete with the subject's signature (see below).


 ### Example of a job_details object:

  {
    "attestationId": "cabf8219-afb9-910f-bc12-abcdef8912349876",
    "subjectSig": "0x0869925...", // 65 byte signature, omitted
    "requestNonce": "0xfef3b4d6c...", // 32 byte nonce, omitted
    "data": {
      "data": [
        {
          "data": "+17185559999",
          "type": "phone",
          "nonce": "abcdef12-1111-4444-5192-18295172fab2"
        }
      ],
      "verificationStatus": "pending"
    }
  }

  See our [Signing Logic page] for more information on obtaining a subjectSig, and our [Attestation documentation] for more information on other related data structures.


  ### Response

  {
    "success":true,
    "attestations":[
      {
        "result":null,
        "requestNonce":"0x",
        "paymentNonce":"0x",
        "attestTx":"0x",
        "id":"fabcde90-f5e6-411f-9a61-9999c04fc70c",
        "types":[0],
        "type":"phone",
        "status":"initial",
        "attester":null,
        "requester":{"type":"Buffer","data":[3,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,18,10]},
        "subject":{"type":"Buffer","data":[3,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,17,10]},
        "role":"requester",
        "subjectSig":null,
        "paymentSig":null,
        "negotiationId":null,
        "createdAt":"2018-07-17T18:10:20.518Z",
        "updatedAt":"2018-07-17T18:10:20.518Z",
        "data": { "data": [ { "data": "+17185559999", "type": "phone", "nonce": "abcdef12-1111-4444-5192-18295172fab2" } ], "verificationStatus": "pending" }
      }
    ]
  }



  ### Webhooks

  How the Attestation Kit communicates with your application

  The Attestation Kit has three webhooks for callbacks to your main application - as an attestation requester, a notification that your application should collect signature data from the subject, and as an attester, a prompt to perform the actual responsibilities of an attestation (e.g., manually or automatically verifying the subject's data, such as email, phone number, or other personal information), and then finally, a notification that the attestation has been successfully performed, with the Ethereum transaction ID.

  The base URL for each webhook is determined by the WEBHOOK_HOST environment variable. The resource path for each webhook, below the domain level, is currently hardcoded in the Attestation Kit.
  POST /api/webhooks/prepare_attestation_sig

  Webhook notifying requester that it should collect subject data and submit a request to the POST /api/requests/send API endpoint.
  Parameters
  | Name | Type |	Description |

  |------|------|----|

  |attestation | attestation | An attestation object - see our Requester  documentation for examples.|
  POST /api/webhooks/perform_attestation

  Webhook notifying attester that it should perform attestation, and when complete, submit the completed attestation to the POST /api/attestations API endpoint.


  #### Parameters

 | Name | Type | Description |

 | job_details | job_details 	A job details |- see our [Attester documentation] for examples.
  POST /api/webhooks/attestation_completed

  Notification that attestation has been completed (triggered by attester).
  Parameters

 | Name | Type | Description |

 |------|------|----|

  attestation_id 	uuid 	The ID of the attestation in question.
  transaction_hash 	txhash 	The Ethereum transaction ID of the attestation.
  result 	string 	The result of the attestation.
