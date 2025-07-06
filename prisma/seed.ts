import {PrismaClient} from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [{name: 'Clothing'}, {name: 'Electronics'}, {name: 'Accessories'}],
    skipDuplicates: true,
  });

  await prisma.product.createMany({
    data: [
      {
        name: 'Product 1',
        description: 'Description for Product 1',
        price: 199.9,
        imageUrl:
          'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        categoryId: 1,
      },
      {
        name: 'Product 2',
        description: 'Description for Product 2',
        price: 299.9,
        imageUrl:
          'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        categoryId: 2,
      },
      {
        name: 'Product 3',
        description: 'Description for Product 3',
        price: 399.9,
        imageUrl:
          'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        categoryId: 3,
      },
      {
        name: 'Product 4',
        description: 'Description for Product 4',
        price: 499.9,
        imageUrl:
          'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        categoryId: 1,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
