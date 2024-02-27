import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Tgw } from "./construct/tgw";
import { Vpc } from "./construct/vpc";
import { Ec2Instance } from "./construct/ec2-instance";
import { TgwRouting } from "./construct/tgw-routing";
import { NetworkFirewall } from "./construct/network-firewall";

export class NetworkFirewallStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const tgw = new Tgw(this, "Tgw", {});

    const vpcA = new Vpc(this, "VpcA", {
      vpcCidr: "10.1.1.0/24",
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 27,
        },
        {
          name: "Tgw",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 27,
        },
      ],
      tgwId: tgw.tgwId,
      applianceModeSupport: "disable",
    });

    const vpcB = new Vpc(this, "VpcB", {
      vpcCidr: "10.1.2.0/24",
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 27,
        },
        {
          name: "Tgw",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 27,
        },
      ],
      tgwId: tgw.tgwId,
      applianceModeSupport: "disable",
    });

    const vpcC = new Vpc(this, "VpcC", {
      vpcCidr: "10.1.3.0/24",
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "Public",
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 27,
        },
        {
          name: "Tgw",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 27,
        },
      ],
      tgwId: tgw.tgwId,
      applianceModeSupport: "disable",
    });

    const inspectionVpc = new Vpc(this, "InspectionVpc", {
      vpcCidr: "10.10.1.0/24",
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "Firewall",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 27,
        },
        {
          name: "Tgw",
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 27,
        },
      ],
      tgwId: tgw.tgwId,
      applianceModeSupport: "enable",
    });

    // Transit Gateway route table
    new TgwRouting(this, "TgwRouteTableSpokeVpc", {
      tgwId: tgw.tgwId,
      associateTgwAttachmentIds: [
        vpcA.tgwAttachment.ref,
        vpcB.tgwAttachment.ref,
        vpcC.tgwAttachment.ref,
      ],
      propagationTgwAttachmentIds: [],
      inspectionVpcTgwAttachmentId: inspectionVpc.tgwAttachment.ref,
    });
    new TgwRouting(this, "TgwRouteTableInspectionVpc", {
      tgwId: tgw.tgwId,
      associateTgwAttachmentIds: [inspectionVpc.tgwAttachment.ref],
      propagationTgwAttachmentIds: [
        vpcA.tgwAttachment.ref,
        vpcB.tgwAttachment.ref,
        vpcC.tgwAttachment.ref,
      ],
    });

    // EC2 Instance
    new Ec2Instance(this, "Ec2InstanceA1", {
      vpc: vpcA.vpc,
      availabilityZones: [vpcA.vpc.availabilityZones[0]],
    });
    new Ec2Instance(this, "Ec2InstanceB1", {
      vpc: vpcB.vpc,
      availabilityZones: [vpcB.vpc.availabilityZones[0]],
    });
    new Ec2Instance(this, "Ec2InstanceC1", {
      vpc: vpcC.vpc,
      availabilityZones: [vpcB.vpc.availabilityZones[0]],
    });

    // Network Firewall
    new NetworkFirewall(this, "NetworkFirewall", {
      vpc: inspectionVpc.vpc,
    });
  }
}
