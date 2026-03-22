import { FastifyPluginAsync } from 'fastify';
import { propertyService } from './property.service';
import S3 from 'aws-sdk/clients/s3';
import { env } from '../../config/env';

const s3 = new S3({
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  region: env.AWS_REGION,
});

export const propertyRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /property
  fastify.get('/', {
    preHandler: [fastify.authenticate],
  }, async () => {
    const property = await propertyService.getProperty();
    return property ?? {};
  });

  // PUT /property
  fastify.put('/', {
    preHandler: [fastify.authenticate],
  }, async (req) => {
    return propertyService.updateProperty(req.body as any);
  });

  // POST /property/photos
  fastify.post('/photos', {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'No file provided' });

    const body = req.body as any;
    const label = body?.label ?? 'Photo';
    const order = Number(body?.order ?? 0);

    const key = `photos/${Date.now()}-${data.filename}`;
    const buffer = await data.toBuffer();

    const upload = await s3.upload({
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: data.mimetype,
      ACL: 'public-read',
    }).promise();

    const updated = await propertyService.addPhoto(key, label, upload.Location, order);
    return { url: upload.Location, key, property: updated };
  });

  // DELETE /property/photos/:key
  fastify.delete('/photos/:key', {
    preHandler: [fastify.authenticate],
  }, async (req, reply) => {
    const { key } = req.params as { key: string };

    await s3.deleteObject({ Bucket: env.AWS_S3_BUCKET, Key: key }).promise();
    const updated = await propertyService.removePhoto(key);

    return { success: true, property: updated };
  });
};
