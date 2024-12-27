'use client'

import expenseSchema from '../schema';
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cardOwnerArr, categoriesArr, ExpenseFormInput, paymentMethodArr } from '../types';
// import { Expense, PaymentMethod, Category, CardOwner } from '../types';

const ExpenseForm: React.FC = () => {
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExpenseFormInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      fixed: false,
      payment_method: 'PORTO',
      category: 'OTHER',
      installments: 1,
      description: ''
    },
  });

  const paymentMethod = watch('payment_method');
  const fixed = watch('fixed');
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const onSubmit: SubmitHandler<ExpenseFormInput> = async (data) => {
    setServerError(null);
    setSuccess(false);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(baseUrl + '/expenses/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.message || 'Something went wrong');
      }

      const result = await response.json();
      console.log(result);
      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

      reset(); // Reset form to default values
    } catch (error: any) {
      setServerError(error.message || 'Something went wrong');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='expense-form'>
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


      {/* Payment Method */}
      <div style={{gap: '50px'}}>
        <label htmlFor='payment_method'>Payment Method</label>
        <select id='payment_method' {...register('payment_method')}>
          {paymentMethodArr.map((method) => <option value={method} key={method}>{method}</option>)}
        </select>
        {errors.payment_method && <p className='error'>{errors.payment_method.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor='category'>Category</label>
        <select id='category' {...register('category')}>
          {categoriesArr.map((method) => <option value={method} key={method}>{method}</option>)}
        </select>
        {errors.category && <p className='error'>{errors.category.message}</p>}
      </div>

      {/* Installments (Conditional) */}
      {(paymentMethod === 'NU' || paymentMethod === 'PORTO') && !fixed && (
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
            {cardOwnerArr.map((method) => <option value={method} key={method}>{method}</option>)}
          </select>
          {errors.card_owner && <p className='error'>{errors.card_owner.message}</p>}
        </div>
      )}
      {/* Description */}
      <div>
        <label htmlFor='description'>Description</label>
        <input type='text' {...register('description')}/>
      </div>

      {/* Server Error */}
      {serverError && <p className='error'>{serverError}</p>}

      {/* Success Message */}
      {success && <p className='success'>Expense added successfully!</p>}

      {/* Submit Button */}
      <button type='submit'>Add Expense</button>

      {/* Styles (Optional) */}
      <style jsx>{`
        .expense-form {
          display: flex;
          flex-direction: column;
          align-items: right;
        }
        div {
          margin-bottom: 0.4rem;
          width: 25rem;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }
        input#fixed {
          margin-right: 1rem;
          background-color: #F0FFFF;
          }
        select {
            color: #1c2430;
            background-color: #F0FFFF;
            border-radius: 0.1rem;
        }
        input {
          color: #1c2430;
          padding-left: 0.5rem;
          background-color: #F0FFFF;
          border-radius: 0.1rem;
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
          border-radius: 0.1rem;
          margin-top: 1rem;
        }
        button:hover {
          background-color: #005bb5;
        }
      `}</style>
    </form>
  );
};

export default ExpenseForm;