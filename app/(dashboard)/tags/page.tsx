import { TagsClient } from '@/app/(dashboard)/tags/tags-client';
import { getTags } from '@/lib/queries/tags';

export const metadata = {
  title: 'Tags - Controle Financeiro',
};

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="py-6">
      <TagsClient tags={tags} />
    </div>
  );
}
