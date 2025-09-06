import React from 'react';
import {Card as AntCard} from 'antd';
import Image from 'next/image';
import CustomButton from '../customButtton/customButton';

interface BaseCardProps {
  className?: string;
  children?: React.ReactNode;
}

interface ProductCardProps extends BaseCardProps {
  variant: 'product';
  title: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  onAddToCart?: () => void;
  onClick?: () => void;
  isLoading?: boolean;
}

interface CategoryCardProps extends BaseCardProps {
  variant: 'category';
  title: string;
  imageUrl: string;
  imageAlt: string;
  onClick?: () => void;
}

interface StatsCardProps extends BaseCardProps {
  variant: 'stats';
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

interface ContentCardProps extends BaseCardProps {
  variant: 'content';
  title?: string;
  actions?: React.ReactNode[];
}

type CardProps =
  | ProductCardProps
  | CategoryCardProps
  | StatsCardProps
  | ContentCardProps;

export default function Card(props: CardProps) {
  const baseClasses = `rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${props.className || ''}`;

  if (props.variant === 'product') {
    return (
      <AntCard
        className={`${baseClasses} cursor-pointer`}
        onClick={props.onClick}
        cover={
          <div className="relative h-48 overflow-hidden">
            <Image
              src={props.imageUrl}
              alt={props.imageAlt}
              fill
              className="object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        }
        actions={[
          <CustomButton
            key="addToCart"
            buttonText="Add to Cart"
            onClick={() => {
              // Note: stopPropagation is handled at the button level
              props.onAddToCart?.();
            }}
            isLoading={props.isLoading}
            backgroundColor="secondary"
            textColor="dark"
          />,
        ]}>
        <AntCard.Meta
          title={
            <h3 className="text-lg font-semibold text-dark">{props.title}</h3>
          }
          description={
            <p className="text-xl font-bold text-secondary">
              ${props.price.toFixed(2)}
            </p>
          }
        />
      </AntCard>
    );
  }

  if (props.variant === 'category') {
    return (
      <AntCard
        className={`${baseClasses} cursor-pointer`}
        onClick={props.onClick}
        cover={
          <div className="relative h-32 overflow-hidden">
            <Image
              src={props.imageUrl}
              alt={props.imageAlt}
              fill
              className="object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        }>
        <AntCard.Meta
          title={
            <h3 className="text-center text-lg font-semibold text-dark">
              {props.title}
            </h3>
          }
        />
      </AntCard>
    );
  }

  if (props.variant === 'stats') {
    const colorClasses = {
      primary: 'bg-primary border-primary',
      secondary: 'bg-secondary border-secondary',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      danger: 'bg-red-50 border-red-200',
    };

    return (
      <AntCard
        className={`${baseClasses} ${colorClasses[props.color || 'primary']}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{props.title}</p>
            <p className="text-2xl font-bold text-dark">{props.value}</p>
          </div>
          {props.icon && (
            <div className="text-3xl text-secondary">{props.icon}</div>
          )}
        </div>
        {props.children}
      </AntCard>
    );
  }

  if (props.variant === 'content') {
    return (
      <AntCard
        className={baseClasses}
        title={props.title}
        actions={props.actions}>
        {props.children}
      </AntCard>
    );
  }

  return null;
}
