import { notFound } from 'next/navigation';
import { Product } from '@/lib/mock-data';
import { doc, getDoc, collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Metadata } from 'next'
import { ProductDetailClient } from '@/components/products/product-detail-client';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const product = docSnap.data() as Product;
      const firstImage = product.imageUrls?.[0] || 'https://placehold.co/1200x630.png';
      
      return {
        title: `${product.name} | LE QG DE LA SAPE`,
        description: product.description,
        openGraph: {
          title: product.name,
          description: product.description,
          images: [
            {
              url: firstImage,
              width: 1200,
              height: 630,
              alt: product.name,
            },
          ],
          siteName: 'LE QG DE LA SAPE',
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: product.name,
          description: product.description,
          images: [firstImage],
        },
      }
    }
  } catch (error) {
    console.error("Failed to fetch product for metadata:", error);
  }

  // Fallback metadata
  return {
    title: 'Produit non trouvé',
    description: "L'élégance a son quartier général.",
  }
}

async function getProduct(id: string): Promise<Product | null> {
    if (!id) return null;
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
