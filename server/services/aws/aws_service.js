/* eslint-disable no-undef */
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import Container from 'typedi';

const sqsClients = {};

const sqsClient = new SQSClient({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// set the default region sqs client
sqsClients[process.env.AWS_DEFAULT_REGION] = sqsClient;

const getSQSClient = (region) => {
  if (!sqsClients[region]) {
    sqsClients[region] = new SQSClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return sqsClients[region];
};

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Sends a message to an SQS queue.
 * @param {string} queueUrl - The URL of the SQS queue.
 * @param {object} messageBody - The body of the message to be sent.
 * @returns {Promise<object>} - A promise that resolves to the response data from sending the message.
 */
export const sendSQSMessage = async(queueUrl, messageBody) => {
  const logger = Container.get('logger');
  try {
    const params = {
      DelaySeconds: 90,
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
    };
    const data = await sqsClient.send(new SendMessageCommand(params));
    logger.info({
      msg: 'Successfully sent message to SQS queue',
      messageId: data?.MessageId,
    });
    return data;
  } catch (error) {
    logger.error(error, { msg: 'Error in sending message to SQS queue' });
  }
};

/**
 * Sends a message to an SQS queue.
 * @param {string} queueUrl - The URL of the SQS queue.
 * @param {object} messageBody - The body of the message to be sent.
 * @param {string} region - The region of the SQS queue.
 * @returns {Promise<object>} - A promise that resolves to the response data from sending the message.
 */
export const sendSQSMessageByRegion = async(queueUrl, messageBody, region = process.env.AWS_DEFAULT_REGION) => {
  const logger = Container.get('logger');
  try {
    // frame the params
    const params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(messageBody),
    };
    // intialize the SQS client for the given region
    const sqsRegionClient = getSQSClient(region);
    // pusht to sqq
    const data = await sqsRegionClient.send(new SendMessageCommand(params));
    logger.info({
      msg: 'Successfully sent message to SQS queue',
      messageId: data?.MessageId,
      region: region
    });
    // return the response
    return data;
  } catch (error) {
    logger.error(error, { msg: 'Error in sending message to SQS queue' });
  }
};

// Function to create a signed URL for an S3 object
export const getDomainAttachmentSignedUrl = async(userId, domainName, email, fileName, contentType = 'application/zip', expiresIn = 3600) => {
  // Set up the PutObjectCommand with ContentType and ACL
  const command = new PutObjectCommand({
    Bucket: 'skysenders-domain-attachments',
    Key: `message-attachments/${userId}/${domainName}/${email}/${Math.random().toString(36).substring(2, 8)}/${fileName}`,
    ContentType: contentType, // Set content type as application/zip
    ACL: 'public-read', // Make the object publicly accessible
  });

  try {
    // Generate the signed URL for the put operation
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error creating signed URL for upload:', error);
    throw error;
  }
};

// Function to create a signed URL for an S3 object
export const getPartnerBrandingLogoUrl = async(partnerId, fileName, contentType = 'application/zip', expiresIn = 3600) => {
  // Set up the PutObjectCommand with ContentType and ACL
  const command = new PutObjectCommand({
    Bucket: 'outreach-partners-asserts',
    Key: `partners-branding/${partnerId}/logo/${Math.random().toString(36).substring(2, 8)}/${fileName}`,
    ContentType: contentType, // Set content type as application/zip
    ACL: 'public-read', // Make the object publicly accessible
  });

  try {
    // Generate the signed URL for the put operation
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error creating signed URL for partners logo:', error);
    throw error;
  }
};

// Function to create a signed URL for an S3 object
export const getPartnerBrandingFavIconUrl = async(partnerId, fileName, contentType = 'application/zip', expiresIn = 3600) => {
  // Set up the PutObjectCommand with ContentType and ACL
  const command = new PutObjectCommand({
    Bucket: 'outreach-partners-asserts',
    Key: `partners-branding/${partnerId}/fav-icon/${Math.random().toString(36).substring(2, 8)}/${fileName}`,
    ContentType: contentType, // Set content type as application/zip
    ACL: 'public-read', // Make the object publicly accessible
  });

  try {
    // Generate the signed URL for the put operation
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error creating signed URL for partners fav icon:', error);
    throw error;
  }
};


// Function to create a signed URL for an S3 object
export const getWorkspaceBrandingLogoUrl = async(partnerId, workspaceId, fileName, contentType = 'application/zip', expiresIn = 3600) => {
  // Set up the PutObjectCommand with ContentType and ACL
  const command = new PutObjectCommand({
    Bucket: 'outreach-partners-asserts',
    Key: `workspace-branding/${partnerId}/workspace/${workspaceId}/logo/${Math.random().toString(36).substring(2, 8)}/${fileName}`,
    ContentType: contentType, // Set content type as application/zip
    ACL: 'public-read', // Make the object publicly accessible
  });

  try {
    // Generate the signed URL for the put operation
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error creating signed URL for workspace logo:', error);
    throw error;
  }
};

// Function to create a signed URL for an S3 object
export const getUserProfileLogoUrl = async(partnerId, userId, fileName, contentType = 'application/zip', expiresIn = 3600) => {
  // Set up the PutObjectCommand with ContentType and ACL
  const command = new PutObjectCommand({
    Bucket: 'outreach-partners-asserts',
    Key: `user-profile/${partnerId}/user/${userId}/logo/${Math.random().toString(36).substring(2, 8)}/${fileName}`,
    ContentType: contentType, // Set content type as application/zip
    ACL: 'public-read', // Make the object publicly accessible
  });

  try {
    // Generate the signed URL for the put operation
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error creating signed URL for user profile logo:', error);
    throw error;
  }
};

const lambdaClients = new Map();

const getLambdaClient = (region) => {
  if (!lambdaClients.has(region)) {
    lambdaClients.set(region, new LambdaClient({ region }));
  }
  return lambdaClients.get(region);
};

export const invokeLambdaFunction = async(functionName, payload, region = process.env.AWS_DEFAULT_REGION) => {
  try {
    const lambdaClient = getLambdaClient(region);

    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await lambdaClient.send(command);

    // Lambda returns the payload as a Uint8Array, so we need to convert it to a string
    const rawPayload = response.Payload
      ? Buffer.from(response.Payload).toString()
      : null;

    // Check if the Lambda function returned an error
    if (response.FunctionError) {
      throw new Error(`Lambda error: ${rawPayload}`);
    }
    // Parse the payload as JSON and return it
    return rawPayload ? JSON.parse(rawPayload) : null;
  } catch (err) {
    console.error('Exception occurred while invoking Lambda function:', err);
    throw err;
  }
};

export const verifySMTPMailbox = async(payload) => {
  try {
    const lambdaClient = getLambdaClient(process.env.AWS_DEFAULT_REGION);

    const command = new InvokeCommand({
      FunctionName: 'skysenders-verify-smtp-accounts',
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await lambdaClient.send(command);

    // Lambda returns the payload as a Uint8Array, so we need to convert it to a string
    const rawPayload = response.Payload
      ? Buffer.from(response.Payload).toString()
      : null;

    // Check if the Lambda function returned an error
    if (response.FunctionError) {
      throw new Error(`Lambda error: ${rawPayload}`);
    }
    // Parse the payload as JSON and return it
    return rawPayload ? JSON.parse(rawPayload) : null;
  } catch (err) {
    console.error('Exception occurred while invoking Lambda function:', err);
    throw err;
  }
};
