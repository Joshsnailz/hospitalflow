'use client';

import { ImageIcon } from 'lucide-react';

export default function ClinicalImagingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <ImageIcon className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Clinical Imaging</h1>
      <p className="text-gray-500 max-w-md">
        Access and manage clinical imaging requests and results. View X-rays, CT scans, MRIs, and other diagnostic images.
      </p>
    </div>
  );
}
