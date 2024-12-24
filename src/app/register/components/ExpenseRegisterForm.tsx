'use client'
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
// import { Expense, PaymentMethod, Category, CardOwner } from '../types';

// Define Zod schema for form validation
const expenseSchema = z.object({
  amount: z
    .number({ invalid_type_error: 'Amount is required' })
    .positive({ message: 'Amount must be positive' }),
  fixed: z.boolean().optional(),
  payment_method: z.enum(['NU', 'PORTO', 'PIX']),
  category: z.enum(['APPS', 'BILLS', 'CAR_REVIEW', 'CAR_TAX', 'CONECTCAR', 'EDUCATION', 'ENTERTAINMENT', 'FUEL', 'HEALTH', 'MARKET', 'PHARMACY', 'PHONE', 'OTHER', 'RENT', 'SHOPPING']),
  installments: z.number().min(1, { message: 'At least 1 installment' }).optional(),
  card_owner: z.enum(['MARCELO', 'MARILIA']).optional(),
});

// Infer TypeScript type from Zod schema
type ExpenseFormInput = z.infer<typeof expenseSchema>;

const ExpenseForm: React.FC = () => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      fixed: false,
      payment_method: 'PORTO',
      category: 'EDUCATION',
      installments: 1,
      card_owner: 'MARCELO',
    },
  });

  const paymentMethod = watch('payment_method');
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const onSubmit: SubmitHandler<ExpenseFormInput> = async (data) => {
    setServerError(null);
    setSuccess(false);

    try {
      console.log(JSON.stringify(data))
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(baseUrl + '/expenses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      const result = await response.json();
      setSuccess(true);
      reset(); // Reset form to default values
    } catch (error: any) {
      setServerError(error.message || 'Something went wrong');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='expense-form'>
      {/* Amount */}
      <div>
        <label htmlFor='amount'>Amount</label>
        <input
          type='number'
          step='0.01'
          id='amount'
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount && <p className='error'>{errors.amount.message}</p>}
      </div>

      {/* Fixed */}
      <div>
        <label htmlFor='fixed'>
          <input
            type='checkbox'
            id='fixed'
            {...register('fixed')}
          />
          Fixed
        </label>
        {errors.fixed && <p className='error'>{errors.fixed.message}</p>}
      </div>

      {/* Payment Method */}
      <div>
        <label htmlFor='payment_method'>Payment Method</label>
        <select id='payment_method' {...register('payment_method')}>
          <option value='NU'>NU</option>
          <option value='PORTO'>PORTO</option>
          <option value='PIX'>PIX</option>
        </select>
        {errors.payment_method && <p className='error'>{errors.payment_method.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor='category'>Category</label>
        <select id='category' {...register('category')}>
          {/* 'PHONE', 'OTHER', 'RENT', 'SHOPPING' */}
          <option value='APPS'>APPS</option>
          <option value='BILLS'>BILLS</option>
          <option value='CAR_REVIEW'>CAR_REVIEW</option>
          <option value='CAR_TAX'>CAR_TAX</option>
          <option value='CONECTCAR'>CONECTCAR</option>
          <option value='EDUCATION'>EDUCATION</option>
          <option value='ENTERTAINMENT'>ENTERTAINMENT</option>
          <option value='FUEL'>FUEL</option>
          <option value='HEALTH'>HEALTH</option>
          <option value='MARKET'>MARKET</option>
          <option value='PHARMACY'>PHARMACY</option>
          <option value='PHONE'>PHONE</option>
          <option value='OTHER'>OTHER</option>
          <option value='RENT'>RENT</option>
          <option value='SHOPPING'>SHOPPING</option>
        </select>
        {errors.category && <p className='error'>{errors.category.message}</p>}
      </div>

      {/* Installments (Conditional) */}
      {(paymentMethod === 'NU' || paymentMethod === 'PORTO') && (
        <div>
          <label htmlFor='installments'>Installments</label>
          <input
            type='number'
            id='installments'
            {...register('installments', { valueAsNumber: true })}
            min='1'
          />
          {errors.installments && <p className='error'>{errors.installments.message}</p>}
        </div>
      )}

      {/* Card Owner (Conditional) */}
      {(paymentMethod === 'NU' || paymentMethod === 'PORTO') && (
        <div>
          <label htmlFor='card_owner'>Card Owner</label>
          <select id='card_owner' {...register('card_owner')}>
            <option value='MARCELO'>Personal</option>
            <option value='MARILIA'>Business</option>
          </select>
          {errors.card_owner && <p className='error'>{errors.card_owner.message}</p>}
        </div>
      )}

      {/* Server Error */}
      {serverError && <p className='error'>{serverError}</p>}

      {/* Success Message */}
      {success && <p className='success'>Expense added successfully!</p>}

      {/* Submit Button */}
      <button type='submit'>Add Expense</button>

      {/* Styles (Optional) */}
      <style jsx>{`
        .expense-form {
          max-width: 400px;
          margin: 0 auto;
        }
        .expense-form div {
          margin-bottom: 1rem;
        }
        .error {
          color: red;
          font-size: 0.875rem;
        }
        .success {
          color: green;
          font-size: 0.875rem;
        }
        button {
          padding: 0.5rem 1rem;
          background-color: #0070f3;
          color: white;
          border: none;
          cursor: pointer;
        }
        button:hover {
          background-color: #005bb5;
        }
      `}</style>
    </form>
  );
};

export default ExpenseForm;