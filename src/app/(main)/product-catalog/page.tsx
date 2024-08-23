'use client';
import CustomButton from '@/components/customButtton/customButton';
import {Card, Col, Row, Pagination} from 'antd';
import {useState} from 'react';
import Image from 'next/image';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import z from 'zod';
import CustomInput from '@/components/customInput';

const FormSchema = z.object({
  searchQuery: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export default function ProductCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      searchQuery: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = form;

  const onSubmit = (data: FormData) => {
    console.log('Search Query:', data.searchQuery);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const products = [
    {
      id: 1,
      name: 'Product 1',
      price: 199.9,
      category: 'Clothing',
      imageUrl:
        'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      id: 2,
      name: 'Product 2',
      price: 299.9,
      category: 'Electronics',
      imageUrl:
        'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      id: 3,
      name: 'Product 3',
      price: 399.9,
      category: 'Accessories',
      imageUrl:
        'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      id: 4,
      name: 'Product 4',
      price: 499.9,
      category: 'Clothing',
      imageUrl:
        'https://plus.unsplash.com/premium_photo-1681488262364-8aeb1b6aac56?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ];

  const filteredProducts = products.filter(
    product =>
      product.name
        .toLowerCase()
        .includes(form.getValues('searchQuery')?.toLowerCase() || '') &&
      (selectedCategory === 'All' || product.category === selectedCategory),
  );

  const pageSize = 8;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="container mx-auto py-12 px-5">
      <Row className="mb-8 p-6 text-center bg-secondary rounded-2xl">
        <Col span={24}>
          <h1 className="text-4xl font-bold">Product Catalog</h1>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="max-w-lg mx-auto my-4">
              <CustomInput
                id="searchQuery"
                type="text"
                placeholder="Search products..."
                register={register}
                name="searchQuery"
                errorMessage={errors.searchQuery?.message}
              />
            </div>
          </form>
        </Col>
      </Row>

      <Row className="mb-8 text-center bg-primary">
        <Col span={24}>
          <h2 className="text-3xl font-bold">Categories</h2>
          <div className="flex justify-center mt-4">
            {['All', 'Clothing', 'Electronics', 'Accessories'].map(category => (
              <div key={category} className="mx-2">
                <CustomButton
                  buttonText={category}
                  onClick={() => handleCategoryChange(category)}
                />
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <Row
        gutter={[16, 16]}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {paginatedProducts.map(product => (
          <Col key={product.id}>
            <Card
              hoverable
              cover={
                <div className="w-full h-48 relative">
                  <Image
                    alt={product.name}
                    src={product.imageUrl}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
              }
              className="p-4 shadow">
              <h3 className="mt-4 text-xl">{product.name}</h3>
              <p className="mt-2 text-accent">${product.price}</p>
              <div className="mt-4">
                <CustomButton buttonText={'Add to Cart'} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-12">
        <Col span={24} className="flex justify-end">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredProducts.length}
            onChange={page => setCurrentPage(page)}
          />
        </Col>
      </Row>
    </div>
  );
}
