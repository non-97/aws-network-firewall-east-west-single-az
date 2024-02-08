import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface TgwProps {}

export class Tgw extends Construct {
  readonly tgwId: string;

  constructor(scope: Construct, id: string, props: TgwProps) {
    super(scope, id);

    const tgw = new cdk.aws_ec2.CfnTransitGateway(this, "Default", {
      amazonSideAsn: 65000,
      autoAcceptSharedAttachments: "enable",
      defaultRouteTableAssociation: "enable",
      defaultRouteTablePropagation: "enable",
      dnsSupport: "enable",
      multicastSupport: "enable",
      tags: [
        {
          key: "Name",
          value: "tgw",
        },
      ],
      vpnEcmpSupport: "enable",
    });

    this.tgwId = tgw.ref;
  }
}
