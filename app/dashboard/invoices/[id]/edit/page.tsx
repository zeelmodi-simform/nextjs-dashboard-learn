import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/invoices/edit-form';
import { notFound } from 'next/navigation';

export default async function Page({
  params: { id },
}: {
  params: { id: string };
}) {
  const [customers, invoice] = await Promise.all([
    fetchCustomers(),
    fetchInvoiceById(id),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoices',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form customers={customers} invoice={invoice} />
    </main>
  );
}
