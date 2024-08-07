import React from 'react';
import {
  UseFormRegister,
  FieldValues,
  Path,
  FieldError,
  Merge,
  FieldErrorsImpl,
} from 'react-hook-form';
import ErrorMessage from '../errorMessage';

interface InputProps<TFieldValues extends FieldValues> {
  label?: string;
  id: string;
  type: string;
  placeholder: string;
  register: UseFormRegister<TFieldValues>;
  name: Path<TFieldValues>;
  errorMessage?:
    | string
    | FieldError
    | Merge<FieldError, FieldErrorsImpl<any>>
    | undefined;
}

export default function CustomInput<TFieldValues extends FieldValues>({
  label,
  id,
  type,
  placeholder,
  register,
  name,
  errorMessage,
}: InputProps<TFieldValues>) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-dark" htmlFor={id}>
          {label}
        </label>
      )}

      <input
        {...register(name)}
        className="w-full px-4 py-2 mt-2 text-sm bg-primary border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
        type={type}
        id={id}
        placeholder={placeholder}
      />
      {errorMessage && <ErrorMessage message={String(errorMessage)} />}
    </div>
  );
}
