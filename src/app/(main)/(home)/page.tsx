'use client';
import CustomButton from '@/components/customButtton/customButton';
import {Col, Row} from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import {Footer} from 'antd/es/layout/layout';
import {useEffect, useState} from 'react';
import axios from 'axios';
import {ProductProps} from '@/interfaces/product';
import Loading from '@/components/loading/loading';
import Card from '@/components/card/card';

export default function Home() {
  const [products, setProducts] = useState<ProductProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        const {data} = response;
        setProducts(data);
      } catch (err) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <Row className="bg-secondary text-center py-12">
        <Col span={24}>
          <h1 className="text-4xl font-bold">Welcome to E-Shop!</h1>
          <p className="mt-4 text-xl">Check out our exclusive offers!</p>
          <div className="flex justify-center mt-6">
            <div className="max-w-40">
              <Link href="/products/catalog">
                <CustomButton
                  backgroundColor={'dark'}
                  textColor={'primary'}
                  buttonText={'Shop Now'}
                />
              </Link>
            </div>
          </div>
        </Col>
      </Row>

      <div className="container mx-auto py-12 px-5 bg-primary">
        <h2 className="text-3xl font-bold text-center mb-8">
          Featured Products
        </h2>
        {isLoading ? (
          <div className="flex items-center justify-center w-full">
            <Loading />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {products.map(product => (
              <Col
                key={product.id}
                xs={24}
                sm={12}
                md={8}
                lg={6}
                className="mb-4">
                <Card
                  variant="product"
                  title={product.name}
                  price={product.price}
                  imageUrl={
                    product.imageUrl || 'https://via.placeholder.com/300'
                  }
                  imageAlt={product.name}
                  onClick={() =>
                    (window.location.href = `/products/${product.id}`)
                  }
                  className="h-80"
                />
              </Col>
            ))}
          </Row>
        )}
      </div>

      <Row className="py-12">
        <Col span={24} className="text-center">
          <h2 className="text-3xl font-bold mb-8">Categories</h2>
          <div className="flex justify-around">
            <div>
              <Link href="/categories/clothing">
                <CustomButton buttonText="Clothing" />
              </Link>
            </div>
            <div>
              <Link href="/categories/electronics">
                <CustomButton buttonText="Electronics" />
              </Link>
            </div>
            <div>
              <Link href="/categories/accessories">
                <CustomButton buttonText="Accessories" />
              </Link>
            </div>
          </div>
        </Col>
      </Row>

      <Footer className="bg-dark text-white py-6">
        <div className="text-center">
          <p>© {currentYear} E-Shop. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Link href="/">Terms of Service</Link>
            <Link href="/">Privacy Policy</Link>
          </div>
        </div>
      </Footer>
    </div>
  );
}
