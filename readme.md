Kalarrs Command-Line Interface
==============================
CLI for setting up serverless on osx. Maybe linux is next? Docker?

For those familar with .net @kalarrs/cli borrows from the naming convention of solutions and projects. The cli will help you get started using [serverless](https://github.com/serverless/serverless) on your development machine.
By helping you get all of the required tooling installed, which for many is the hardest part of getting started with serverless.

Once you have the tooling installed the cli will help you create and configure serverless solutions. A serverless solution contains many serverless projects, which together typically will form an api, however, it can be so much more. You are only limited by your imagination.

The commands of the CLI borrows from yarn and npm where global is system level. All other commands are intended to be run in the solution level.

NOTE: For the best experience a complete set of [plugins](#additional-plugins) for serverless has been developed!

## Prerequisites

Both the CLI and generated project have dependencies that require Yarn, Node 9+, hombrew (osx).

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Solution Structure](#solution-structure)
* [Additional Plugins](#additional-plugins)
* [Getting Started](#getting-started)

## Installation

```bash
yarn global add @kalarrs/cli
```

## Usage

```bash
kalarrs --help
```

### Check and Install all necessary software to run serverless.

```bash
kalarrs global sls
```


### Create a serverless solution

```bash
kalarrs sls create-solution awesome-sls-api
```


### Configure an existing serverless solution

```bash
cd awesome-sls-api
kalarrs sls
```


### Solution Structure

```
awesome-sls-api/
├── kittens (Serverless Project)
│   ├── docs
│   ├── node_modules
│   │   └── ...
│   ├── src
│   │   └── ...
│   ├── .gitignore
│   ├── package.json
│   ├── serverless.yml
│   └── yarn.lock
│
├── puppies (Serverless Project)
│    └── ...
│
├── enviroments
│    ├── local
│    ├── dev
│    ├── sandbox
│    └── prod
├── .editorconfig
├── .gitignore
├── package.json
├── serverless.yml
└── yarn.lock
```

### Additional Plugins

Most plugins at this time are designed for use AWS only.


#### Solution Level

##### [serverless-project-utils](https://github.com/exocom/serverless-project-utils)

* Reverse Proxy - Enables running most of your API in the cloud while debugging flagged projects locally
* Api Gateway Custom Domain name - easily create API Gateways add attach custom domains to them
* Template Scaffold (Coming Soon)

``` bash
yarn add @kalarrs/serverless-project-utils
```


#### Project Level

##### [serverless-shared-api-gateway](https://github.com/exocom/serverless-shared-api-gateway)

Allows multiple serverless projects to share a single API. Critical for complex APIs and developing with multiple developers.

``` bash
yarn add @kalarrs/serverless-shared-api-gateway
```


##### [serverless-local-dev-server](https://github.com/exocom/serverless-local-dev-server)

Allows you to run and debug some serverless projects locally.
Supports binary, multiple projects, custom headers, Amazon services such as s3 and polly, aws profiles and settings, optional static hosting (local only)

``` bash
yarn add @kalarrs/serverless-local-dev-server
```


## Getting Started

Checkout the TypeScript [serverless template](https://github.com/exocom/serverless-template-typescript)! This little gem will help you understand how to get an api up and running quickly.


Inside of your new solution run:
``` bash
sls create --template https://github.com/exocom/serverless-template-typescript/tree/master/aws --path kittens
```

Using serverless-project-utils? (Coming Soon)
``` bash
sls project-create --template https://github.com/exocom/serverless-template-typescript/tree/master/aws --path kittens
```
