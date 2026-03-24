import mongoose from 'mongoose';

const infrastructureSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    unique: true,
    index: true,
  },
  ec2InstanceId: String,
  rdsInstanceId: String,
  elasticIp: String,
  s3Bucket: String,
  cloudfrontDistributionId: String,
  certificateArn: String,
  securityGroupId: String,
  route53RecordId: String,
  provisioningLogs: [String],
}, {
  timestamps: true,
});

export default mongoose.model('Infrastructure', infrastructureSchema);
