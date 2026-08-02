import { useEffect } from 'react';

interface SchemaOrgOrderProps {
  txHash?: string;
  productQuantaHash: string;
  total: number;
  currency: string;
  status: string;
}

export default function SchemaOrgOrder({ txHash, productQuantaHash, total, currency, status }: SchemaOrgOrderProps) {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Order',
      orderNumber: txHash || 'pending',
      orderStatus: status === 'COMPLETED' ? 'https://schema.org/OrderDelivered' : 'https://schema.org/OrderProcessing',
      merchant: {
        '@type': 'Organization',
        name: 'MotherCheckoutQuanta',
        url: window.location.origin,
      },
      acceptedOffer: {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: `Product ${productQuantaHash}`,
          productID: productQuantaHash,
        },
        price: total,
        priceCurrency: currency,
      },
      totalPrice: {
        '@type': 'MonetaryAmount',
        value: total,
        currency: currency,
      },
    };

    const scriptId = 'schema-org-order';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      script.remove();
    };
  }, [txHash, productQuantaHash, total, currency, status]);

  return null;
}
