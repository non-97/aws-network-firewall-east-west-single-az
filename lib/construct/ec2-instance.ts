import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

export interface Ec2InstanceProps {
  vpc: cdk.aws_ec2.IVpc;
  availabilityZones: string[];
}

export class Ec2Instance extends Construct {
  readonly instance: cdk.aws_ec2.IInstance;

  constructor(scope: Construct, id: string, props: Ec2InstanceProps) {
    super(scope, id);

    // security Group
    const securityGroup = new cdk.aws_ec2.SecurityGroup(this, "SecurityGroup", {
      vpc: props.vpc,
    });
    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.ipv4("10.0.0.0/8"),
      cdk.aws_ec2.Port.allTraffic()
    );

    // User data
    const userData = cdk.aws_ec2.UserData.forLinux();
    userData.addCommands(
      fs.readFileSync(
        path.join(__dirname, "../ec2/user-data/install_nginx.sh"),
        "utf8"
      )
    );

    // EC2 Instance
    this.instance = new cdk.aws_ec2.Instance(this, "Default", {
      machineImage: cdk.aws_ec2.MachineImage.latestAmazonLinux2023({
        cachedInContext: true,
      }),
      instanceType: new cdk.aws_ec2.InstanceType("t3.micro"),
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
        availabilityZones: props.availabilityZones,
      }),
      propagateTagsToVolumeOnCreation: true,
      ssmSessionPermissions: true,
      securityGroup,
      userData,
    });
  }
}
