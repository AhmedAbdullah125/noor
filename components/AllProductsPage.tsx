import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from './ProductCard';
import AppHeader from './AppHeader';
import { getLang } from '../services/i18n';
import { useGetServices } from './services/useGetServices';
import { mapServicesToProducts } from './home/serviceMappers';

interface AllProductsPageProps {
  onBook: (product: Product, quantity: number) => void;
  favourites: number[];
  onToggleFavourite: (productId: number) => void;
}

const AllProductsPage: React.FC<AllProductsPageProps> = ({
  onBook,
  favourites,
  onToggleFavourite
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getLang();
  const servicesQuery = useGetServices(lang, 1);
  const products = useMemo(
    () => mapServicesToProducts((servicesQuery.data?.items?.services ?? []) as any[]),
    [servicesQuery.data],
  );

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`, { state: { from: location.pathname } });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-app-bg relative font-active overflow-hidden">
      {/* Header */}
      <AppHeader
        title="جميع الخدمات"
        onBack={handleBack}
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto w-full pb-28 px-6 pt-24">
        {servicesQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-4">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-56 rounded-3xl bg-white animate-pulse" />)}</div>
        ) : servicesQuery.isError ? (
          <div className="text-center text-app-textSec py-12">{lang === 'ar' ? 'تعذر تحميل الخدمات' : 'Unable to load services'}</div>
        ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isFavourite={favourites.includes(product.id)}
              onBook={onBook}
              onClick={handleProductClick}
              lang={lang}
            />
          ))}
        </div>
        )}
      </main>
    </div>
  );
};

export default AllProductsPage;
