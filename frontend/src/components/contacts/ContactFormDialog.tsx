import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/common/Combobox';
import { contactFormSchema, type ContactFormValues } from '@/lib/validators';
import { useListValues, useAddListItem } from '@/hooks/useSettings';
import { useUsers } from '@/hooks/useUsers';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';
import type { Contact } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

const LEAD_TYPES: ContactFormValues['leadType'][] = ['NEW', 'HOT', 'COLD'];

export function ContactFormDialog({ open, onOpenChange, contact }: Props) {
  const cities = useListValues('city');
  const projectTypes = useListValues('projectType');
  const sources = useListValues('leadSource');
  const addListItem = useAddListItem();
  const { data: users } = useUsers();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const isEdit = !!contact;

  const { register, handleSubmit, control, reset, formState } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { leadType: 'NEW' },
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName: contact?.fullName ?? '',
        phone: contact?.phone ?? '',
        email: contact?.email ?? '',
        address: contact?.address ?? '',
        city: contact?.city ?? '',
        projectType: contact?.projectType ?? '',
        areaSqm: contact?.areaSqm ?? undefined,
        budget: contact?.budget ?? undefined,
        leadType: (contact?.leadType as ContactFormValues['leadType']) ?? 'NEW',
        source: contact?.source ?? '',
        taxId: contact?.taxId ?? '',
        assignedToId: contact?.assignedToId ?? '',
        notes: contact?.notes ?? '',
        nextFollowUpAt: contact?.nextFollowUpAt?.slice(0, 10) ?? '',
      });
    }
  }, [open, contact, reset]);

  const onSubmit = async (values: ContactFormValues) => {
    const payload: Record<string, unknown> = {
      ...values,
      areaSqm: values.areaSqm && !Number.isNaN(values.areaSqm) ? values.areaSqm : null,
      budget: values.budget && !Number.isNaN(values.budget) ? values.budget : null,
      assignedToId: values.assignedToId || null,
      nextFollowUpAt: values.nextFollowUpAt ? new Date(values.nextFollowUpAt).toISOString() : null,
    };
    try {
      if (isEdit) {
        await updateContact.mutateAsync({ id: contact!.id, ...payload });
      } else {
        await createContact.mutateAsync(payload);
      }
      toast.success(he.common.saved);
      onOpenChange(false);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const f = he.contacts.fields;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? he.contacts.editContact : he.contacts.newContact}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <Label>{f.fullName} *</Label>
            <Input {...register('fullName')} />
            {formState.errors.fullName && <p className="mt-1 text-xs text-destructive">{formState.errors.fullName.message}</p>}
          </div>
          <div>
            <Label>{f.phone} *</Label>
            <Input dir="ltr" {...register('phone')} />
            {formState.errors.phone && <p className="mt-1 text-xs text-destructive">{formState.errors.phone.message}</p>}
          </div>
          <div>
            <Label>{f.email}</Label>
            <Input dir="ltr" {...register('email')} />
            {formState.errors.email && <p className="mt-1 text-xs text-destructive">{formState.errors.email.message}</p>}
          </div>
          <div>
            <Label>{f.taxId}</Label>
            <Input dir="ltr" {...register('taxId')} />
            {formState.errors.taxId && <p className="mt-1 text-xs text-destructive">{formState.errors.taxId.message}</p>}
          </div>
          <div>
            <Label>{f.city}</Label>
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <Combobox
                  options={cities}
                  value={field.value}
                  onChange={field.onChange}
                  onAddNew={(v) => addListItem.mutateAsync({ listType: 'city', value: v }).then(() => {})}
                  addNewLabel={he.contacts.addNew}
                  allowClear
                />
              )}
            />
          </div>
          <div>
            <Label>{f.projectType}</Label>
            <Controller
              control={control}
              name="projectType"
              render={({ field }) => (
                <Combobox
                  options={projectTypes}
                  value={field.value}
                  onChange={field.onChange}
                  onAddNew={(v) => addListItem.mutateAsync({ listType: 'projectType', value: v }).then(() => {})}
                  addNewLabel={he.contacts.addNew}
                  allowClear
                />
              )}
            />
          </div>
          <div>
            <Label>{f.source}</Label>
            <Controller
              control={control}
              name="source"
              render={({ field }) => (
                <Combobox
                  options={sources}
                  value={field.value}
                  onChange={field.onChange}
                  onAddNew={(v) => addListItem.mutateAsync({ listType: 'leadSource', value: v }).then(() => {})}
                  addNewLabel={he.contacts.addNew}
                  allowClear
                />
              )}
            />
          </div>
          <div>
            <Label>{f.leadType}</Label>
            <Controller
              control={control}
              name="leadType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{he.contacts.leadType[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>{f.areaSqm}</Label>
            <Input type="number" dir="ltr" {...register('areaSqm')} />
          </div>
          <div>
            <Label>{f.budget}</Label>
            <Input type="number" dir="ltr" {...register('budget')} />
          </div>
          <div>
            <Label>{f.assignedTo}</Label>
            <Controller
              control={control}
              name="assignedToId"
              render={({ field }) => (
                <Select value={field.value || 'none'} onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder={he.common.none} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{he.common.none}</SelectItem>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>{f.nextFollowUpAt}</Label>
            <Input type="date" dir="ltr" {...register('nextFollowUpAt')} />
          </div>
          <div className="sm:col-span-2">
            <Label>{f.address}</Label>
            <Input {...register('address')} />
          </div>
          <div className="sm:col-span-2">
            <Label>{f.notes}</Label>
            <Textarea {...register('notes')} />
          </div>

          <DialogFooter className="sm:col-span-2 mt-2">
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {he.common.save}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {he.common.cancel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
