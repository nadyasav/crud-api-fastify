import crypto from 'crypto';
import { UUID, Product } from './types';
import { API_PRODUCTS } from './constants';
import dotenv from 'dotenv';
import { validate as isValidUUID } from 'uuid';
import Fastify from 'fastify'
import { ProductData, productSchema } from './schema';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const products: Record<UUID, Product> = {};

const server = Fastify({
  logger: true
});

server.get(API_PRODUCTS, (_request, reply) => {
  return reply.code(200).send({ data: Object.values(products) })
});

server.get<{ Params: { productId: string } }>(`${API_PRODUCTS}/:productId`, async (request, reply) => {
  const { productId } = request.params;

  if (!isValidUUID(productId)) {
    return reply.code(400).send({ error: 'Invalid product id format' });
  }

  const product = products[productId as UUID];

  if(!product) {
    return reply.code(404).send({ error: 'Product not found' });
  }

  return reply.code(200).send({ data: product });
});

server.post<{ Body: ProductData }>(API_PRODUCTS, async (request, reply) => {
  const body = productSchema.safeParse(request.body);

  if(!body.success) {
    return reply.status(400).send({ error: 'Invalid product data' });
  }

  const productId = crypto.randomUUID();
  const newProduct: Product = {
    id: productId,
    ...body.data,
  };
  products[productId] = newProduct;

  return reply.status(201).send({ data: newProduct });
});

server.put<{ Params: { productId: string }; Body: ProductData }>(`${API_PRODUCTS}/:productId`, async (request, reply) => {
  const { productId } = request.params;

  if (!isValidUUID(productId)) {
    return reply.code(400).send({ error: 'Invalid product id format' });
  }

  const product = products[productId as UUID];
  if(!product) {
    return reply.code(404).send({ error: 'Product not found' });
  }

  const body = productSchema.safeParse(request.body);
  if(!body.success) {
    return reply.status(400).send({ error: 'Invalid product data' });
  }

  products[productId as UUID] = {
    id: productId as UUID,
    ...body.data,
  };

  return reply.status(200).send({ data: products[productId as UUID] });
});

server.delete<{ Params: { productId: string } }>(`${API_PRODUCTS}/:productId`, async (request, reply) => {
  const { productId } = request.params;

  if (!isValidUUID(productId)) {
    return reply.code(400).send({ error: 'Invalid product id format' });
  }

  if(!products[productId as UUID]) {
    return reply.code(404).send({ error: 'Product not found' });
  }

  delete products[productId as UUID];
  return reply.status(204).send();
});

server.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({ error: 'Not found' });
});

server.setErrorHandler((error, _request, reply) => {
  console.log('Internal server error: ', error)
  reply.status(500).send({ error: 'Internal server error' });
});

server.listen({ port: PORT }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Server running on port ${PORT}`);
})
