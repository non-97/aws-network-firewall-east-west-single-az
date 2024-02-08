import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NetworkFirewallPolicy } from "./network-firewall-policy";
import { NetworkFirewallLogs } from "./network-firewall-logs";
import { NetworkFirewallRouting } from "./network-firewall-routing";

export interface NetworkFirewallProps {
  vpc: cdk.aws_ec2.IVpc;
}

export class NetworkFirewall extends Construct {
  constructor(scope: Construct, id: string, props: NetworkFirewallProps) {
    super(scope, id);

    // Network Firewall policy
    const firewallPolicy = new NetworkFirewallPolicy(
      this,
      "FirewallPolicy",
      {}
    );

    // Network Firewall
    const networkFirewall = new cdk.aws_networkfirewall.CfnFirewall(
      this,
      "Default",
      {
        firewallName: "network-firewall",
        firewallPolicyArn: firewallPolicy.firewallPolicy.attrFirewallPolicyArn,
        vpcId: props.vpc.vpcId,
        subnetMappings: props.vpc
          .selectSubnets({
            subnetGroupName: "Firewall",
          })
          .subnetIds.map((subnetId) => {
            return {
              subnetId: subnetId,
            };
          }),
        deleteProtection: false,
        subnetChangeProtection: false,
      }
    );

    // Network Firewall logs
    new NetworkFirewallLogs(this, "Logs", {
      networkFirewall,
    });

    // Network Firewall Routing
    new NetworkFirewallRouting(this, "Routing", {
      networkFirewall,
      vpc: props.vpc,
    });
  }
}
