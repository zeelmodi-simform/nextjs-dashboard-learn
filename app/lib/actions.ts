'use server';

import { signIn } from '@/auth';
import { sql } from '@vercel/postgres';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0' }),
  status: z.enum(['paid', 'pending'], {
    invalid_type_error: 'Please select an invoice status',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  //   const rawFormData = {
  //     customerId: formData.get('customerId'),
  //     amount: formData.get('amount'),
  //     status: formData.get('status'),
  //   };
  //   console.log({ rawFormData });

  const validateFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: `Missing Fields. Failed to Create Invoice.`,
    };
  }

  const { amount, customerId, status } = validateFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
  } catch (error) {
    return {
      message: `Database Error: Failed to Create Invoice.`,
    };
  }

  revalidatePath(`/dashboard/invoices`);
  redirect(`/dashboard/invoices`);
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validateFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validateFields.success) {
    return {
      errors: validateFields.error.flatten().fieldErrors,
      message: `Missing Fields. Failed to Update Invoice.`,
    };
  }

  const { amount, customerId, status } = validateFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
  UPDATE invoices SET customer_id=${customerId}, amount=${amountInCents}, status=${status} WHERE id=${id}
  `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath(`/dashboard/invoices`);
  redirect(`/dashboard/invoices`);
}

// export async function deleteInvoice(id: string) { // NOTE:
export async function deleteInvoice(formData: FormData) {
  // To manually enforce error: for error.tsx
  // throw new Error('Failed to Delete Invoice');

  const id = formData.get('id') as string;

  try {
    await sql`DELETE FROM invoices WHERE id=${id}`;
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }

  revalidatePath(`/dashboard/invoices`);
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid Credentials';

        default:
          return 'Something Went Wrong';
      }
    }
    throw error;
  }
}
