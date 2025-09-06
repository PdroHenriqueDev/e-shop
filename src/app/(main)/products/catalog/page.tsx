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
import {useRouter} from 'next/navigation';

const FormSchema = z.object({
  searchQuery: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export default function ProductCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [categories, setCategories] = useState<{id: number; name: string}[]>(
    [],
  );
  const {notify} = useNotification();
  const {addToCart, cartIsLoading} = useCart();
  const router = useRouter();

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

  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const [products, setProducts] = useState<ProductProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await axios.get('/api/categories');
        setCategories(categoriesResponse.data);

        const productsParams = selectedCategory
          ? {categoryId: selectedCategory}
          : {};
        const productsResponse = await axios.get('/api/products', {
          params: productsParams,
        });
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        notify({type: 'error', msg: 'Failed to load data'});
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [notify, selectedCategory]);

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
    <div className="min-h-screen">
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

      <Row className="mb-12 py-8 text-center bg-primary">
        <Col span={24}>
          <h2 className="text-3xl font-bold mb-6">Categories</h2>
          <div className="flex justify-center flex-wrap gap-2">
            <div key="all" className="mx-2">
              <CustomButton
                buttonText="All"
                onClick={() => handleCategorySelect(null)}
                backgroundColor={
                  selectedCategory === null ? 'accent' : 'secondary'
                }
              />
            </div>
            {categories.map(category => (
              <div key={category.id} className="mx-2">
                <CustomButton
                  buttonText={category.name}
                  onClick={() => handleCategorySelect(category.id)}
                  backgroundColor={
                    selectedCategory === category.id ? 'accent' : 'secondary'
                  }
                />
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Row gutter={[16, 16]} className="mb-8">
          {paginatedProducts.map(product => (
            <Col
              key={product.id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              className="mb-4">
              <div
                onClick={() => router.push(`/products/${product.id}`)}
                className="cursor-pointer">
                <Card
                  hoverable
                  cover={
                    <div className="w-full h-48 relative">
                      <Image
                        alt={product.name}
                        src={product.imageUrl || product.image}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        className="rounded-lg object-cover"
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
                      <div onClick={e => e.stopPropagation()}>
                        <CustomButton
                          buttonText={'Add to Cart'}
                          onClick={() => handleAddToCart(product)}
                          disabled={cartIsLoading}
                          backgroundColor={
                            cartIsLoading ? 'accent' : 'secondary'
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </Col>
          ))}
        </Row>

        <Row className="mt-12">
          <Col span={24} className="flex justify-center py-8">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredProducts.length}
              onChange={page => setCurrentPage(page)}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
