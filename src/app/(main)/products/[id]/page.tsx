'use client';
import {useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import Image from 'next/image';
import CustomButton from '@/components/customButtton/customButton';
import Loading from '@/components/loading/loading';
import {ProductProps} from '@/interfaces/product';
import axios from 'axios';
import {useCart} from '@/contexts/cartContext';

export default function ProductDetails() {
  const {id} = useParams() ?? {};
  const [product, setProduct] = useState<ProductProps>();
  const [isLoading, setIsLoading] = useState(true);

  const {addToCart, cartIsLoading} = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const response = await axios.get(`/api/products/${id}`);
        const {data} = response;

        setProduct(data);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loading />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <span className="text-secondary font-bold">Product not found</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative w-full h-96">
          <Image
            src={product.imageUrl ?? ''}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-lg object-cover"
          />
        </div>
        <div>
          <h1 className="text-4xl font-bold">{product.name}</h1>
          <p className="mt-4 text-lg">{product.description}</p>
          <p className="mt-4 text-2xl font-bold text-primary">
            ${product.price.toFixed(2)}
          </p>

          <div className="mt-6">
            <CustomButton
              buttonText="Add to Cart"
              onClick={() => addToCart(product)}
              disabled={cartIsLoading}
              backgroundColor={cartIsLoading ? 'accent' : 'secondary'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
