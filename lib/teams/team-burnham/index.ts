import { ArnPrincipal } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { ApplicationTeam, ClusterInfo, SecretProvider } from '@aws-quickstart/ssp-amazon-eks';
import { ISecret, Secret } from '@aws-cdk/aws-secretsmanager';

function getUserArns(scope: Construct, key: string): ArnPrincipal[] {
    const context: string = scope.node.tryGetContext(key);
    if (context) {
        return context.split(",").map(e => new ArnPrincipal(e));
    }
    return [];
}

export class TeamBurnhamSetup extends ApplicationTeam {
    constructor(scope: Construct, teamManifestDir: string) {
        super({
            name: "burnham",
            users: getUserArns(scope, "team-burnham.users"),
            namespaceAnnotations: {
                "appmesh.k8s.aws/sidecarInjectorWebhook": "enabled"
            },
            teamSecrets: [
                {
                    secretProvider: new GenerateSecretManagerProvider('AuthPassword'),
                    kubernetesSecret: {
                        secretName: 'auth-password',
                        data: [
                            {
                                key: 'password'
                            }
                        ]
                    }
                }
            ],
            teamManifestDir: teamManifestDir
        });
    }
}

class GenerateSecretManagerProvider implements SecretProvider {

    constructor(private secretName: string) {}

    provide(clusterInfo: ClusterInfo): ISecret {
        const secret = new Secret(clusterInfo.cluster.stack, 'AuthPassword', {
            secretName: this.secretName
        });

        // create this secret first
        clusterInfo.cluster.node.addDependency(secret);
        return secret
    }
}