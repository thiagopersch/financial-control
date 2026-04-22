import { getCategories } from '@/lib/queries/categories';
import { CategoriesClient } from './categories-client';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="py-6">
      <CategoriesClient categories={categories} />
    </div>
  );
}
