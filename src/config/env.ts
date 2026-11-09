import dotenv from 'dotenv';
dotenv.config();

export const env = {
    port: process.env.PORT || '5000',
    nodeEnv: process.env.NODE_ENV || 'development',

    // JWT
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // Bcrypt
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),

    // Mailtrap
    mailtrapHost: process.env.MAILTRAP_HOST as string,
    mailtrapPort: parseInt(process.env.MAILTRAP_PORT || '2525'),
    mailtrapUser: process.env.MAILTRAP_USER as string,
    mailtrapPass: process.env.MAILTRAP_PASS as string,
    emailFrom: process.env.EMAIL_FROM || 'noreply@nigt.com',

    // AWS S3
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    awsS3Bucket: process.env.AWS_S3_BUCKET as string,

    // Cloudinary
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',

    // App URLs
    appUrl: process.env.APP_URL || 'http://localhost:5000',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};
