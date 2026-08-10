import { FormSkeleton } from '@/components/ui/page-skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <FormSkeleton fields={2} />
      <FormSkeleton fields={2} withHeader={false} />
    </div>
  );
}
