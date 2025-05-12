// src/components/CustomerCard.tsx
import React from 'react';

type CustomerCardProps = {
  name: string;
  phone?: string;
  email?: string;
};

export default function CustomerCard({ name, phone, email }: CustomerCardProps) {
  return (
    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
      <h3 className="font-medium text-lg">{name}</h3>
      {phone && <p className="text-gray-600 text-sm">{phone}</p>}
      {email && <p className="text-gray-600 text-sm">{email}</p>}
    </div>
  );
}