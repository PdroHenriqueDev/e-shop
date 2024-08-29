'use client';
import {useEffect, useState} from 'react';
import {ProductProps} from '@/interfaces/product';
import axios from 'axios';
import {Row, Col, Card} from 'antd';
import Image from 'next/image';
import Loading from '@/components/loading/loading';
import CustomButton from '@/components/customButtton/customButton';
import {useCart} from '@/contexts/cartContext';
import {useSearchParams} from 'next/navigation';

export default function CategoryPage() {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const {addToCart} = useCart();

  useEffect(() => {
    const category = searchParams?.get('category');
    if (!category) return;
    setCategory(category);

    const fetchProducts = async () => {
      try {
        const response = await axios.get(`/api/products`, {params: {category}});
        const {data} = response;
        setProducts(data);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const categoryName =
    category && category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="container mx-auto py-12 px-5">
      <h2 className="text-3xl font-bold text-center mb-8">{categoryName}</h2>
      {isLoading ? (
        <div className="flex items-center justify-center w-full">
          <Loading />
        </div>
      ) : (
        <Row
          gutter={[16, 16]}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <Col key={product.id}>
              <Card
                hoverable
                cover={
                  <div className="w-full h-48 relative">
                    <Image
                      alt={product.name}
                      src={
                        product.imageUrl || 'https://via.placeholder.com/300'
                      }
                      layout="fill"
                      objectFit="cover"
                      className="rounded-lg"
                    />
                  </div>
                }
                className="bg-primary p-4 shadow">
                <h3 className="mt-4 text-xl">{product.name}</h3>
                <p className="mt-2 text-gray-700">
                  ${product.price.toFixed(2)}
                </p>
                <div className="mt-4">
                  <CustomButton
                    buttonText={'Add to Cart'}
                    onClick={() => addToCart(product)}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
