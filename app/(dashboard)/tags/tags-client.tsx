'use client';

import { TagsList } from '@/app/(dashboard)/tags/components/tags-list';
import type { TagDTO } from '@/lib/queries/tags';

interface TagsClientProps {
  tags: TagDTO[];
}

export function TagsClient({ tags }: TagsClientProps) {
  return <TagsList tags={tags} />;
}
