import React from 'react';
import {
  useForm,
  UseFormReturn,
  FieldValues,
  Path,
  DefaultValues,
} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {ZodSchema} from 'zod';
import CustomInput from '../customInput';
import CustomButton from '../customButtton/customButton';

interface FormField<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  label?: string;
  type: string;
  placeholder: string;
  id: string;
}

interface FormProps<TFieldValues extends FieldValues> {
  schema: ZodSchema<TFieldValues>;
  defaultValues: DefaultValues<TFieldValues>;
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  fields: FormField<TFieldValues>[];
  submitButtonText: string;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function Form<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  fields,
  submitButtonText,
  isLoading = false,
  className = '',
  children,
}: FormProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      {fields.map(field => (
        <CustomInput
          key={field.name}
          id={field.id}
          label={field.label}
          type={field.type}
          placeholder={field.placeholder}
          register={register}
          name={field.name}
          errorMessage={errors[field.name]?.message as string}
        />
      ))}
      {children}

      <CustomButton
        type="submit"
        buttonText={submitButtonText}
        isLoading={isLoading}
        backgroundColor="secondary"
        textColor="dark"
      />
    </form>
  );
}

export function useFormReturn<TFieldValues extends FieldValues>(
  schema: ZodSchema<TFieldValues>,
  defaultValues: DefaultValues<TFieldValues>,
): UseFormReturn<TFieldValues> {
  return useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
}
