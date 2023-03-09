# Update dependency cli tool

This tool using for automatically package.json file and create pull request

# Install

`yarn`
or
`npm i`

# Getting started

Fist of all, you need to add your credential for BitBucket API

`cp dist.env .env`

and update token or username/password

## Manual auth

You can add your token or username/password via CLI
If you don't update environment arguments, you can write it on runtime


# Basic usage
`node index.js -p dotenv@14.0.0`

and follow command line

_Via command line you can choose workspace, repository, main branch name and select reviewers_