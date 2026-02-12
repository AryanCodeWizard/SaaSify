import {
  AllocateAddressCommand,
  AssociateAddressCommand,
  AuthorizeSecurityGroupIngressCommand,
  CreateKeyPairCommand,
  CreateSecurityGroupCommand,
  DeleteKeyPairCommand,
  DescribeImagesCommand,
  DescribeInstancesCommand,
  DescribeKeyPairsCommand,
  DescribeSecurityGroupsCommand,
  DisassociateAddressCommand,
  ReleaseAddressCommand,
  RunInstancesCommand,
  TerminateInstancesCommand,
} from '@aws-sdk/client-ec2';

import { getEC2Client } from './aws.config.js';
import logger from '../../utils/logger.js';

/**
 * Get Ubuntu AMI ID for the current region
 */
export const getUbuntuAmiId = async () => {
  try {
    const ec2Client = getEC2Client();
    const command = new DescribeImagesCommand({
      Owners: ['099720109477'], // Canonical (Ubuntu)
      Filters: [
        {
          Name: 'name',
          Values: ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*'],
        },
        {
          Name: 'state',
          Values: ['available'],
        },
        {
          Name: 'architecture',
          Values: ['x86_64'],
        },
      ],
    });

    const response = await ec2Client.send(command);
    
    // Sort by creation date and get the latest
    const sortedImages = response.Images.sort((a, b) => 
      new Date(b.CreationDate) - new Date(a.CreationDate)
    );

    if (sortedImages.length === 0) {
      throw new Error('No Ubuntu AMI found');
    }

    return sortedImages[0].ImageId;
  } catch (error) {
    logger.error('Error getting Ubuntu AMI:', error);
    throw error;
  }
};

/**
 * Create security group for hosting instance
 */
export const createSecurityGroup = async (domainName, vpcId = null) => {
  try {
    const ec2Client = getEC2Client();
    const groupName = `${domainName.replace(/\./g, '-')}-sg`;
    const description = `Security group for ${domainName} hosting`;

    // Check if security group already exists
    try {
      const describeCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [groupName],
          },
        ],
      });
      const existingGroups = await ec2Client.send(describeCommand);
      
      if (existingGroups.SecurityGroups.length > 0) {
        logger.info(`Security group ${groupName} already exists`);
        return {
          securityGroupId: existingGroups.SecurityGroups[0].GroupId,
          securityGroupName: groupName,
        };
      }
    } catch (err) {
      // Group doesn't exist, create it
    }

    // Create security group
    const createParams = {
      GroupName: groupName,
      Description: description,
    };

    if (vpcId) {
      createParams.VpcId = vpcId;
    }

    const createCommand = new CreateSecurityGroupCommand(createParams);
    const response = await ec2Client.send(createCommand);

    // Add inbound rules
    const authorizeCommand = new AuthorizeSecurityGroupIngressCommand({
      GroupId: response.GroupId,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'SSH' }],
        },
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'HTTP' }],
        },
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'HTTPS' }],
        },
        {
          IpProtocol: 'tcp',
          FromPort: 3000,
          ToPort: 9999,
          IpRanges: [{ CidrIp: '0.0.0.0/0', Description: 'Application Ports' }],
        },
      ],
    });
    await ec2Client.send(authorizeCommand);

    logger.info(`✅ Security group created: ${response.GroupId}`);

    return {
      securityGroupId: response.GroupId,
      securityGroupName: groupName,
    };
  } catch (error) {
    logger.error('Error creating security group:', error);
    throw error;
  }
};

/**
 * Create EC2 key pair
 */
export const createKeyPair = async (domainName) => {
  try {
    const ec2Client = getEC2Client();
    const keyName = `${domainName.replace(/\./g, '-')}-key`;

    // Check if key pair already exists
    try {
      const describeCommand = new DescribeKeyPairsCommand({
        KeyNames: [keyName],
      });
      await ec2Client.send(describeCommand);
      logger.info(`Key pair ${keyName} already exists`);
      return { keyName, keyMaterial: null }; // Existing key, no material returned
    } catch (err) {
      // Key doesn't exist, create it
    }

    const command = new CreateKeyPairCommand({
      KeyName: keyName,
      KeyType: 'rsa',
    });

    const response = await ec2Client.send(command);

    logger.info(`✅ Key pair created: ${keyName}`);

    return {
      keyName: response.KeyName,
      keyMaterial: response.KeyMaterial, // Private key (PEM format)
      keyFingerprint: response.KeyFingerprint,
    };
  } catch (error) {
    logger.error('Error creating key pair:', error);
    throw error;
  }
};

/**
 * Delete EC2 key pair
 */
export const deleteKeyPair = async (keyName) => {
  try {
    const ec2Client = getEC2Client();
    const command = new DeleteKeyPairCommand({
      KeyName: keyName,
    });

    await ec2Client.send(command);
    logger.info(`✅ Key pair deleted: ${keyName}`);
  } catch (error) {
    logger.error('Error deleting key pair:', error);
    throw error;
  }
};

/**
 * Generate user data script for instance initialization
 */
const generateUserData = (runtime, appPort = 3000, envVars = {}) => {
  const envExports = Object.entries(envVars)
    .map(([key, value]) => `export ${key}="${value}"`)
    .join('\n');

  const dockerInstall = `
#!/bin/bash
set -e

# Update system
apt-get update -y
apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install monitoring tools
apt-get install -y htop iotop

# Setup environment
mkdir -p /app
cd /app

# Set environment variables
${envExports}

# Create deployment script
cat > /app/deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
cd /app
if [ -f docker-compose.yml ]; then
  docker-compose down
  docker-compose up -d
elif [ -f Dockerfile ]; then
  docker build -t app:latest .
  docker stop app || true
  docker rm app || true
  docker run -d --name app -p ${appPort}:${appPort} --restart unless-stopped app:latest
fi
DEPLOY_SCRIPT

chmod +x /app/deploy.sh

echo "✅ Server setup complete"
`;

  return Buffer.from(dockerInstall).toString('base64');
};

/**
 * Launch EC2 instance
 */
export const launchInstance = async (options) => {
  try {
    const {
      domainName,
      instanceType = 't3.micro',
      runtime = 'docker',
      appPort = 3000,
      envVars = {},
      securityGroupId,
      keyName,
      volumeSize = 20,
    } = options;

    const ec2Client = getEC2Client();

    // Get Ubuntu AMI
    const amiId = await getUbuntuAmiId();

    // Generate user data
    const userData = generateUserData(runtime, appPort, envVars);

    const command = new RunInstancesCommand({
      ImageId: amiId,
      InstanceType: instanceType,
      MinCount: 1,
      MaxCount: 1,
      KeyName: keyName,
      SecurityGroupIds: [securityGroupId],
      UserData: userData,
      BlockDeviceMappings: [
        {
          DeviceName: '/dev/sda1',
          Ebs: {
            VolumeSize: volumeSize,
            VolumeType: 'gp3',
            DeleteOnTermination: true,
          },
        },
      ],
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: `${domainName}-hosting` },
            { Key: 'Domain', Value: domainName },
            { Key: 'ManagedBy', Value: 'SaaSify' },
          ],
        },
      ],
    });

    const response = await ec2Client.send(command);
    const instance = response.Instances[0];

    logger.info(`✅ EC2 instance launched: ${instance.InstanceId}`);

    return {
      instanceId: instance.InstanceId,
      instanceType: instance.InstanceType,
      state: instance.State.Name,
      privateIp: instance.PrivateIpAddress,
      publicIp: instance.PublicIpAddress,
      amiId: instance.ImageId,
      launchTime: instance.LaunchTime,
    };
  } catch (error) {
    logger.error('Error launching EC2 instance:', error);
    throw error;
  }
};

/**
 * Get EC2 instance details
 */
export const getInstance = async (instanceId) => {
  try {
    const ec2Client = getEC2Client();
    const command = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });

    const response = await ec2Client.send(command);
    
    if (response.Reservations.length === 0 || response.Reservations[0].Instances.length === 0) {
      throw new Error('Instance not found');
    }

    const instance = response.Reservations[0].Instances[0];

    return {
      instanceId: instance.InstanceId,
      instanceType: instance.InstanceType,
      state: instance.State.Name,
      privateIp: instance.PrivateIpAddress,
      publicIp: instance.PublicIpAddress,
      launchTime: instance.LaunchTime,
      tags: instance.Tags || [],
    };
  } catch (error) {
    logger.error('Error getting EC2 instance:', error);
    throw error;
  }
};

/**
 * Wait for instance to be running
 */
export const waitForInstanceRunning = async (instanceId, maxWaitTime = 300000) => {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const instance = await getInstance(instanceId);
      
      if (instance.state === 'running') {
        logger.info(`✅ Instance ${instanceId} is running`);
        return instance;
      }

      logger.info(`Waiting for instance ${instanceId} to be running... (current: ${instance.state})`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      logger.error('Error checking instance state:', error);
      throw error;
    }
  }

  throw new Error(`Timeout waiting for instance ${instanceId} to be running`);
};

/**
 * Allocate Elastic IP
 */
export const allocateElasticIp = async () => {
  try {
    const ec2Client = getEC2Client();
    const command = new AllocateAddressCommand({
      Domain: 'vpc',
    });

    const response = await ec2Client.send(command);

    logger.info(`✅ Elastic IP allocated: ${response.PublicIp}`);

    return {
      allocationId: response.AllocationId,
      publicIp: response.PublicIp,
    };
  } catch (error) {
    logger.error('Error allocating Elastic IP:', error);
    throw error;
  }
};

/**
 * Associate Elastic IP with instance
 */
export const associateElasticIp = async (instanceId, allocationId) => {
  try {
    const ec2Client = getEC2Client();
    const command = new AssociateAddressCommand({
      InstanceId: instanceId,
      AllocationId: allocationId,
    });

    const response = await ec2Client.send(command);

    logger.info(`✅ Elastic IP associated with instance ${instanceId}`);

    return {
      associationId: response.AssociationId,
    };
  } catch (error) {
    logger.error('Error associating Elastic IP:', error);
    throw error;
  }
};

/**
 * Disassociate Elastic IP
 */
export const disassociateElasticIp = async (associationId) => {
  try {
    const ec2Client = getEC2Client();
    const command = new DisassociateAddressCommand({
      AssociationId: associationId,
    });

    await ec2Client.send(command);
    logger.info(`✅ Elastic IP disassociated`);
  } catch (error) {
    logger.error('Error disassociating Elastic IP:', error);
    throw error;
  }
};

/**
 * Release Elastic IP
 */
export const releaseElasticIp = async (allocationId) => {
  try {
    const ec2Client = getEC2Client();
    const command = new ReleaseAddressCommand({
      AllocationId: allocationId,
    });

    await ec2Client.send(command);
    logger.info(`✅ Elastic IP released`);
  } catch (error) {
    logger.error('Error releasing Elastic IP:', error);
    throw error;
  }
};

/**
 * Terminate EC2 instance
 */
export const terminateInstance = async (instanceId) => {
  try {
    const ec2Client = getEC2Client();
    const command = new TerminateInstancesCommand({
      InstanceIds: [instanceId],
    });

    const response = await ec2Client.send(command);
    const instance = response.TerminatingInstances[0];

    logger.info(`✅ EC2 instance terminated: ${instanceId}`);

    return {
      instanceId: instance.InstanceId,
      currentState: instance.CurrentState.Name,
      previousState: instance.PreviousState.Name,
    };
  } catch (error) {
    logger.error('Error terminating EC2 instance:', error);
    throw error;
  }
};

/**
 * Get instance SSH connection string
 */
export const getSshConnection = (publicIp, keyPath, username = 'ubuntu') => {
  return {
    command: `ssh -i ${keyPath} ${username}@${publicIp}`,
    host: publicIp,
    username,
    keyPath,
  };
};
