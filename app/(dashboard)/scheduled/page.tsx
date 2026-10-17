'use client';

import { ScheduledEmailsTab } from '@/components/scheduled/scheduled-emails-tab';
import { ScheduledTransactionsTab } from '@/components/scheduled/scheduled-transactions-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftRight, Mail } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type ScheduledPageTab = 'transactions' | 'emails';

function ScheduledPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: ScheduledPageTab = searchParams.get('tab') === 'emails' ? 'emails' : 'transactions';

  const changeTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'emails') params.set('tab', 'emails');
    else params.delete('tab');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agendamentos</h2>
        <p className="text-muted-foreground">
          Transações recorrentes e e-mails automáticos de lembretes e resumos
        </p>
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="transactions" className="px-3">
            <ArrowLeftRight />
            Transações
          </TabsTrigger>
          <TabsTrigger value="emails" className="px-3">
            <Mail />
            E-mails
          </TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="pt-2">
          <ScheduledTransactionsTab />
        </TabsContent>
        <TabsContent value="emails" className="pt-2">
          <ScheduledEmailsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ScheduledPage() {
  return (
    <Suspense>
      <ScheduledPageContent />
    </Suspense>
  );
}
