#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkFirewallStack } from "../lib/network-firewall-stack";

const app = new cdk.App();
new NetworkFirewallStack(app, "NetworkFirewallStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
