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
        name: 'Classic Cotton T-Shirt',
        description:
          'Comfortable 100% cotton t-shirt perfect for everyday wear. Available in multiple colors.',
        price: 29.99,
        imageUrl:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
        categoryId: 1,
      },
      {
        name: 'Wireless Bluetooth Headphones',
        description:
          'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
        price: 199.99,
        imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop',
        categoryId: 2,
      },
      {
        name: 'Leather Wallet',
        description:
          'Premium genuine leather wallet with RFID blocking technology and multiple card slots.',
        price: 79.99,
        imageUrl:
          'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=1000&auto=format&fit=crop',
        categoryId: 3,
      },
      {
        name: 'Denim Jacket',
        description:
          'Vintage-style denim jacket made from premium denim fabric. Perfect for layering.',
        price: 89.99,
        imageUrl:
          'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?q=80&w=1000&auto=format&fit=crop',
        categoryId: 1,
      },
      {
        name: 'Smartphone',
        description:
          'Latest smartphone with advanced camera system, fast processor, and all-day battery.',
        price: 699.99,
        imageUrl:
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000&auto=format&fit=crop',
        categoryId: 2,
      },
      {
        name: 'Sunglasses',
        description:
          'Stylish sunglasses with UV protection and polarized lenses for clear vision.',
        price: 149.99,
        imageUrl:
          'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1000&auto=format&fit=crop',
        categoryId: 3,
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
