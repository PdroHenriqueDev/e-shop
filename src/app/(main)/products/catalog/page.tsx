'use client';
import CustomButton from '@/components/customButtton/customButton';
import {Card, Col, Row, Pagination} from 'antd';
import {useState, useEffect} from 'react';
import Image from 'next/image';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import z from 'zod';
import axios from 'axios';
import CustomInput from '@/components/customInput';
import {useNotification} from '@/contexts/notificationContext';
import {useCart} from '@/contexts/cartContext';
import {ProductProps} from '@/interfaces/product';

const FormSchema = z.object({
  searchQuery: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export default function ProductCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const {notify} = useNotification();
  const {addToCart, cartIsLoading} = useCart();

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
    setSearchQuery(data.searchQuery || '');
    notify({
      type: 'info',
      msg: `Searching for: ${data.searchQuery || 'all products'}`,
    });
  };

  const handleAddToCart = (product: ProductProps) => {
    addToCart(product);
  };

  const [products, setProducts] = useState<ProductProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        const {data} = response;
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        notify({type: 'error', msg: 'Failed to load products'});
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [notify]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pageSize = 8;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (isLoading) {
    return (
      <div>
        <Row className="mb-8 py-12 text-center bg-secondary">
          <Col span={24}>
            <h1 className="text-4xl font-bold">Product Catalog</h1>
            <div className="flex justify-center items-center h-64">
              <div className="text-lg">Loading products...</div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <Row className="mb-8 py-12 text-center bg-secondary">
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
                <CustomButton buttonText={category} onClick={() => {}} />
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {paginatedProducts.map(product => (
          <Col key={product.id} xs={24} sm={12} md={8} lg={6} className="mb-4">
            <Card
              hoverable
              cover={
                <div className="w-full h-48 relative">
                  <Image
                    alt={product.name}
                    src={product.imageUrl || product.image}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
              }
              className="shadow h-80 w-full flex flex-col">
              <div className="p-4 flex flex-col h-full">
                <h3 className="text-base h-12 leading-4 line-clamp-2">
                  {product.name}
                </h3>
                <p className="mt-2 text-accent">${product.price}</p>
                <div className="mt-auto">
                  <CustomButton
                    buttonText={'Add to Cart'}
                    onClick={() => handleAddToCart(product)}
                    disabled={cartIsLoading}
                    backgroundColor={cartIsLoading ? 'accent' : 'secondary'}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="mt-12">
        <Col span={24} className="flex justify-end py-5">
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
