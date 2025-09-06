'use client';
import React, {Suspense, useEffect, useState} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Card, Col, Row} from 'antd';
import Image from 'next/image';
import axios from '@/lib/axios';
import {ProductProps} from '@/interfaces/product';
import {useCart} from '@/contexts/cartContext';
import CustomButton from '@/components/customButtton/customButton';
import Loading from '@/components/loading/loading';
import {useNotification} from '@/contexts/notificationContext';

interface Category {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

function CategoryPageContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const {notify} = useNotification();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchCategories = async () => {
      try {
        const response = await axios.get('/api/categories');
        const {data} = response;
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        notify({
          type: 'error',
          msg: 'Failed to load categories',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [mounted, notify]);

  if (!mounted) {
    return (
      <div className="container mx-auto py-12 px-5">
        <div className="flex items-center justify-center w-full">
          <Loading />
        </div>
      </div>
    );
  }

  const handleCategoryClick = (categoryId: number) => {
    router.push(`/categories/${categoryId}`);
  };

  return (
    <div className="container mx-auto py-12 px-5">
      <h1 className="text-4xl font-bold text-center mb-8">Browse Categories</h1>
      {isLoading ? (
        <div className="flex items-center justify-center w-full">
          <Loading />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>No categories found.</p>
        </div>
      ) : (
        <div>
          <Row gutter={[16, 16]} justify="center">
            {categories.map(category => (
              <Col key={category.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  className="h-full flex flex-col text-center cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}>
                  <div className="flex flex-col h-full justify-center items-center py-8">
                    <div className="text-6xl mb-4">
                      {category.name === 'Clothing' && '👕'}
                      {category.name === 'Electronics' && '📱'}
                      {category.name === 'Accessories' && '👜'}
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">
                      {category.name}
                    </h3>
                    <CustomButton
                      buttonText={`Browse ${category.name}`}
                      onClick={() => handleCategoryClick(category.id)}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CategoryPageContent />
    </Suspense>
  );
}
