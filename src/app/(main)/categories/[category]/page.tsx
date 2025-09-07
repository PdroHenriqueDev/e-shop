'use client';
import React, {useEffect, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {Card, Col, Row} from 'antd';
import Image from 'next/image';
import axios from '@/lib/axios';
import {ProductProps} from '@/interfaces/product';
import {useCart} from '@/contexts/cartContext';
import CustomButton from '@/components/customButtton/customButton';
import Loading from '@/components/loading/loading';
import {useNotification} from '@/contexts/notificationContext';

export default function CategoryProductsPage() {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const {addToCart} = useCart();
  const {notify} = useNotification();

  const categoryId = params?.category as string;
  const [categoryName, setCategoryName] = useState('Loading...');

  useEffect(() => {
    if (!categoryId) {
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products', {
          params: {categoryId},
        });
        const {data} = response;
        setProducts(data);

        // Set category name from the first product's category
        if (data.length > 0 && data[0].category) {
          setCategoryName(data[0].category.name);
        } else {
          // Fallback: fetch category info separately
          const categoryResponse = await axios.get('/api/categories');
          const categories = categoryResponse.data;
          const currentCategory = categories.find(
            (cat: any) => cat.id === parseInt(categoryId),
          );

          if (currentCategory) {
            setCategoryName(currentCategory.name);
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
        notify({
          type: 'error',
          msg: 'Failed to load products',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, notify]);

  const handleAddToCart = (product: ProductProps) => {
    addToCart(product);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-5">
        <div className="flex items-center justify-center w-full">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-5">
      <h1 className="text-4xl font-bold text-center mb-8">{categoryName}</h1>
      {products.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No products found in this category.</p>
        </div>
      ) : (
        <div>
          <Row gutter={[16, 16]}>
            {products.map(product => (
              <Col key={product.id} xs={24} sm={12} md={8} lg={6}>
                <div
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="cursor-pointer">
                  <Card
                    hoverable
                    cover={
                      <div className="relative w-full h-48">
                        <Image
                          src={product.imageUrl ?? ''}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover"
                        />
                      </div>
                    }
                    bodyStyle={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                    <div className="flex flex-col h-full">
                      <h3 className="text-lg font-semibold mb-2">
                        {product.name}
                      </h3>
                      <p className="text-gray-600 mb-2 flex-grow">
                        {product.description}
                      </p>
                      <p className="text-xl font-bold text-primary mb-4">
                        ${product.price}
                      </p>
                      <div className="mt-auto">
                        <div onClick={e => e.stopPropagation()}>
                          <CustomButton
                            buttonText="Add to Cart"
                            onClick={() => handleAddToCart(product)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}
