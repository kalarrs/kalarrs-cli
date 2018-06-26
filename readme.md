Kalarrs Command-Line Interface
==============================
CLI for setting up serverless on osx. Maybe linux is next? Docker?

For those familar with java @kalarrs/cli borrows from the naming convention of workspace and projects. The cli will help you get started using [serverless](https://github.com/serverless/serverless) on your development machine.
By helping you get all of the required tooling installed, which for many is the hardest part of getting started with serverless.

Once you have the tooling installed the cli will help you create and configure serverless workspace. A serverless workspace contains many serverless projects, which together typically will form an api, however, it can be so much more. You are only limited by your imagination.

Commands:

* global
* workspace
* project (Coming Soon)

Sub Commands:

* global sls - Check and Install all necessary software to run serverless.
* workspace init - Create a serverless workspace inside the current directory.

NOTE: For the best experience a complete set of [plugins](#additional-plugins) for serverless has been developed!

## Prerequisites

Both the CLI and generated project have dependencies that require Yarn, Node 9+, hombrew (osx), and an AWS account.

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Workspace Structure](#workspace-structure)
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


### Create a serverless workspace inside the current directory.

```bash
kalarrs workspace init
```


### Configure an existing serverless workspace. (Coming Soon)

```bash
cd awesome-sls-workspace
kalarrs workspace configure
```


### Workspace Structure

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

Most plugins at this time are designed for use with AWS only.


#### Workspace Level

##### [serverless-project-utils](https://github.com/kalarrs/serverless-project-utils)

* Reverse Proxy - Enables running most of your API in the cloud while debugging flagged projects locally
* Api Gateway Custom Domain name - easily create API Gateways and can attach custom domain names
* Template Scaffold (Coming Soon)

``` bash
yarn add @kalarrs/serverless-project-utils
```

##### [serverless-domain-manager](https://github.com/kalarrs/serverless-domain-manager)

Forked from amplify-education/serverless-domain-manager
Allows you to run and debug some serverless projects locally.
Supports binary, multiple projects, custom headers, Amazon services such as s3 and polly, AWS profiles and settings, optional static hosting (local only)

``` bash
yarn add @kalarrs/serverless-local-dev-server
```

#### Project Level

##### [serverless-shared-api-gateway](https://github.com/kalarrs/serverless-shared-api-gateway)

Allows multiple serverless projects to share a single API. Critical for complex APIs and developing with multiple developers.

``` bash
yarn add @kalarrs/serverless-shared-api-gateway
```


##### [serverless-local-dev-server](https://github.com/kalarrs/serverless-local-dev-server)

Forked from DieProduktMacher/serverless-local-dev-server
Allows you to run and debug some serverless projects locally.
Supports binary, multiple projects, custom headers, Amazon services such as s3 and polly, AWS profiles and settings, optional static hosting (local only)

``` bash
yarn add @kalarrs/serverless-local-dev-server
```


## Getting Started

Checkout template projects written in TypeScript [serverless template-typescript](https://github.com/kalarrs/serverless-template-typescript)!

Checkout template projects written in C# [serverless template-csharp](https://github.com/kalarrs/serverless-template-csharp)!
