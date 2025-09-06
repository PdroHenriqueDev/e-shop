'use client';
import React, {Suspense, useEffect, useState} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import {Col, Row} from 'antd';
import Card from '@/components/card/card';
import Image from 'next/image';
import axios from '@/lib/axios';
import {ProductProps} from '@/interfaces/product';
import {Category} from '@/interfaces/category';
import {useCart} from '@/contexts/cartContext';
import CustomButton from '@/components/customButtton/customButton';
import Loading from '@/components/loading/loading';
import {useNotification} from '@/contexts/notificationContext';

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
            {categories.map(category => {
              const getIconForCategory = (name: string) => {
                if (name === 'Clothing') return '👕';
                if (name === 'Electronics') return '📱';
                if (name === 'Accessories') return '👜';
                return '📦';
              };

              return (
                <Col key={category.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    variant="category"
                    title={category.name}
                    imageUrl={`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="120" font-size="80" text-anchor="middle">${getIconForCategory(category.name)}</text></svg>`)}`}
                    imageAlt={category.name}
                    onClick={() => handleCategoryClick(category.id)}
                    className="h-full"
                  />
                </Col>
              );
            })}
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
