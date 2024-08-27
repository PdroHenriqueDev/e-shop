'use client';
import CustomButton from '@/components/customButtton/customButton';
import {Card, Col, Row} from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import {Footer} from 'antd/es/layout/layout';
import {useEffect, useState} from 'react';
import axios from 'axios';
import {ProductProps} from '@/interfaces/product';
import Loading from '@/components/loading/loading';

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
              <Link href="/product-catalog">
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
                    <CustomButton buttonText={'Add to Cart'} />
                  </div>
                </Card>
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
              <CustomButton buttonText="Clothing" />
            </div>
            <div>
              <CustomButton buttonText="Electronics" />
            </div>
            <div>
              <CustomButton buttonText="Accessories" />
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
