'use client';

import { PermissionTree } from '@/components/permissions/permission-tree';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormTabContent, FormTabsList, type FormTabDefinition } from '@/components/ui/form-tabs';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  permissionProfileSchema,
  usePermissionProfileForm,
  type PermissionProfileFormValues,
} from '@/hooks/forms/use-permission-profile-form';
import type { PermissionProfileDTO } from '@/lib/queries/permission-profiles';
import type { PermissionTreeNode } from '@/lib/services/permission-profiles';
import {
  findFirstTabWithError,
  focusFirstInvalidField,
  getInvalidFieldLabels,
  getTabsWithErrors,
  type TabFieldMap,
} from '@/lib/utils/form-tabs';
import { showWarning } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';

type ProfileTab = 'identification' | 'permissions';

const PROFILE_TABS: readonly FormTabDefinition<ProfileTab>[] = [
  { value: 'identification', label: 'Identificação', icon: <FileText className="h-4 w-4" /> },
  { value: 'permissions', label: 'Permissões', icon: <ShieldCheck className="h-4 w-4" /> },
];

const TAB_ORDER: readonly ProfileTab[] = ['identification', 'permissions'];

const TAB_FIELDS: TabFieldMap<ProfileTab> = {
  identification: ['name', 'description'],
  permissions: ['permissionIds'],
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  description: 'Descrição',
  permissionIds: 'Permissões',
};

const LIST_PATH = '/permission-profiles';

interface PermissionProfileFormPageProps {
  profile?: PermissionProfileDTO | null;
  catalog: PermissionTreeNode[];
}

export function PermissionProfileFormPage({ profile, catalog }: PermissionProfileFormPageProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('identification');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSystem = !!profile?.isSystem;

  const { isEditing, handleSubmit } = usePermissionProfileForm({
    profile,
    onSuccess: () => router.push(LIST_PATH),
  });

  const form = useForm<PermissionProfileFormValues>({
    resolver: zodResolver(permissionProfileSchema),
    defaultValues: {
      name: profile?.name ?? '',
      description: profile?.description ?? '',
      permissionIds: profile?.permissionIds ?? [],
    },
  });

  const errorTabs = getTabsWithErrors(form.formState.errors, TAB_FIELDS);

  /** Lista os campos pendentes e leva o usuário à aba do primeiro deles. */
  function onInvalid(errors: FieldErrors<PermissionProfileFormValues>) {
    const labels = getInvalidFieldLabels(errors, TAB_FIELDS, TAB_ORDER, FIELD_LABELS);
    showWarning('Preencha os campos obrigatórios', labels.join(', '));
    const tab = findFirstTabWithError(errors, TAB_FIELDS, TAB_ORDER);
    if (tab) setActiveTab(tab);
    focusFirstInvalidField(formRef.current);
  }

  async function onSubmit(values: PermissionProfileFormValues) {
    setIsSubmitting(true);
    try {
      await handleSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-[90%] space-y-6">
      <Button
        type="button"
        variant="ghost"
        className="gap-2"
        onClick={() => router.push(LIST_PATH)}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Editar perfil de permissão' : 'Novo perfil de permissão'}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Defina o nome do perfil e marque o que ele pode visualizar, criar, editar ou excluir.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={(event) => form.handleSubmit(onSubmit, onInvalid)(event)}
              className="flex flex-col gap-4"
              noValidate
            >
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)}>
                <FormTabsList tabs={PROFILE_TABS} errorTabs={errorTabs} />

                <FormTabContent value="identification">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Financeiro, Suporte, Somente leitura..."
                            {...field}
                            disabled={isSystem}
                          />
                        </FormControl>
                        {isSystem && (
                          <p className="text-muted-foreground text-xs">
                            O nome de perfis do sistema não pode ser alterado.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Breve descrição do que este perfil pode fazer"
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormTabContent>

                <FormTabContent value="permissions">
                  <FormField
                    control={form.control}
                    name="permissionIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PermissionTree
                            catalog={catalog}
                            selectedIds={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormTabContent>
              </Tabs>

              <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => router.push(LIST_PATH)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
