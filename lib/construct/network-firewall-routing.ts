import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface NetworkFirewallRoutingProps {
  networkFirewall: cdk.aws_networkfirewall.CfnFirewall;
  vpc: cdk.aws_ec2.IVpc;
}

export class NetworkFirewallRouting extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: NetworkFirewallRoutingProps
  ) {
    super(scope, id);

    // Routing Tgw Subnet to Network Firewall
    props.vpc
      .selectSubnets({ subnetGroupName: "Tgw" })
      .subnets.forEach((subnet, index) => {
        const defaultRoute =
          (subnet.node.children.find(
            (child) => child.node.id === "DefaultRoute"
          ) as cdk.aws_ec2.CfnRoute | undefined) ?? undefined;

        defaultRoute?.addOverride(
          "Properties.VpcEndpointId",
          cdk.Fn.select(
            1,
            cdk.Fn.split(
              ":",
              cdk.Fn.select(index, props.networkFirewall.attrEndpointIds)
            )
          )
        );

        if (defaultRoute !== undefined) {
          return;
        }
        new cdk.aws_ec2.CfnRoute(
          this,
          `DefaultRouteToFirewallEndpoint${subnet.ipv4CidrBlock}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock: "0.0.0.0/0",
            vpcEndpointId: cdk.Fn.select(
              1,
              cdk.Fn.split(
                ":",
                cdk.Fn.select(index, props.networkFirewall.attrEndpointIds)
              )
            ),
          }
        );
      });

    try {
      if (!props.vpc.selectSubnets({ subnetGroupName: "Egress" })) {
        return;
      }
    } catch (error) {
      console.log(error);
      return;
    }

    // Routing NAT Gateway to Network Firewall
    props.vpc.publicSubnets.forEach((publicSubnet, index) => {
      const az = publicSubnet.availabilityZone;

      const destinationSubnets = props.vpc.selectSubnets({
        subnetGroupName: "Egress",
        availabilityZones: [az],
      }).subnets;

      destinationSubnets.forEach((destinationSubnet) => {
        const destinationCidrBlock = destinationSubnet.ipv4CidrBlock;

        new cdk.aws_ec2.CfnRoute(
          this,
          `RouteNatGatewayToNetworkFirewall${destinationCidrBlock}`,
          {
            routeTableId: publicSubnet.routeTable.routeTableId,
            destinationCidrBlock,
            vpcEndpointId: cdk.Fn.select(
              1,
              cdk.Fn.split(
                ":",
                cdk.Fn.select(index, props.networkFirewall.attrEndpointIds)
              )
            ),
          }
        );
      });
    });

    // Routing Egress Subnet to Network Firewall
    props.vpc
      .selectSubnets({ subnetGroupName: "Egress" })
      ?.subnets.forEach((subnet, index) => {
        const defaultRoute = subnet.node.children.find(
          (child) => child.node.id == "DefaultRoute"
        ) as cdk.aws_ec2.CfnRoute;
        defaultRoute.addDeletionOverride("Properties.NatGatewayId");

        defaultRoute.addOverride(
          "Properties.VpcEndpointId",
          cdk.Fn.select(
            1,
            cdk.Fn.split(
              ":",
              cdk.Fn.select(index, props.networkFirewall.attrEndpointIds)
            )
          )
        );
      });
  }
}
