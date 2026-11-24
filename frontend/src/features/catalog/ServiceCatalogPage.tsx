import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Pencil, X } from 'lucide-react';
import FadeIn from '../../components/motion/FadeIn';
import { catalogApi } from './api';
import type { CatalogService, ServiceInput, ServiceType } from './types';

const emptyForm: ServiceInput = {
  serviceKey: '',
  name: '',
  description: '',
  serviceType: 'BACKEND',
  repositoryUrl: '',
  owner: '',
};

export default function ServiceCatalogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | ServiceType>('ALL');
  const [editing, setEditing] = useState<CatalogService | null>(null);
  const [form, setForm] = useState<ServiceInput>(emptyForm);
  const [isFormOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');

  const {
    data = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['services'],
    queryFn: catalogApi.list,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['services'] });

  const createMutation = useMutation({
    mutationFn: catalogApi.create,
    onSuccess: () => {
      refresh();
      closeForm();
    },
    onError: () => setError('서비스 등록에 실패했습니다. 입력값과 중복 키를 확인하세요.'),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: number; data: ServiceInput }) =>
      catalogApi.update(input.id, input.data),
    onSuccess: () => {
      refresh();
      closeForm();
    },
    onError: () => setError('서비스 수정에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: catalogApi.remove,
    onSuccess: refresh,
    onError: () => setError('서비스 삭제에 실패했습니다.'),
  });

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setError('');
  };

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setFormOpen(true);
  };

  const startEdit = (service: CatalogService) => {
    setEditing(service);
    setForm({
      serviceKey: service.serviceKey,
      name: service.name,
      description: service.description || '',
      serviceType: service.serviceType,
      repositoryUrl: service.repositoryUrl || '',
      owner: service.owner || '',
    });
    setError('');
    setFormOpen(true);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const remove = (service: CatalogService) => {
    if (window.confirm(`${service.name} 서비스를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(service.id);
    }
  };

  const filtered = data.filter((service) => {
    const matchesSearch =
      `${service.name} ${service.serviceKey}`
        .toLowerCase()
        .includes(search.toLowerCase());

    return (
      matchesSearch &&
      (filter === 'ALL' || service.serviceType === filter)
    );
  });

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <FadeIn>
        <p className="mb-2 text-sm text-slate-500">
          KokoaBank / Service Catalog
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Service Catalog</h1>
            <p className="mt-2 text-sm text-slate-500">
              금융 워크로드의 메타데이터를 등록하고 관리합니다.
            </p>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-semibold transition-transform hover:scale-[1.02]"
          >
            <Plus size={17} /> Add Service
          </button>
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
              <Search size={18} className="text-slate-400" />
              <input
                aria-label="서비스 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="서비스 이름 또는 Key 검색"
                className="w-full py-3 text-sm outline-none"
              />
            </label>
            <select
              aria-label="서비스 유형 필터"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-xl border border-slate-200 px-4 text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="BACKEND">Backend</option>
              <option value="FRONTEND">Frontend</option>
              <option value="WORKER">Worker</option>
            </select>
          </div>
        </div>
      </FadeIn>

      {(isError || error) && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error || '서비스 목록을 불러오지 못했습니다.'}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((service, index) => (
          <FadeIn key={service.id} delay={index * 0.04}>
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{service.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {service.serviceKey}
                  </p>
                </div>
                <span className="rounded-lg bg-[#FFF6C2] px-3 py-1 text-xs font-semibold">
                  {service.serviceType}
                </span>
              </div>

              <p className="mt-4 min-h-10 text-sm text-slate-600">
                {service.description || '등록된 설명이 없습니다.'}
              </p>

              <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p>Owner: {service.owner || 'Unassigned'}</p>
                <p className="mt-1">
                  Repository: {service.repositoryUrl || 'Not connected'}
                </p>
                <p className="mt-1">
                  Updated: {new Date(service.updatedAt).toLocaleString('ko-KR')}
                </p>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => startEdit(service)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <Pencil size={15} /> Edit
                </button>
                <button
                  onClick={() => remove(service)}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </article>
          </FadeIn>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          표시할 서비스가 없습니다.
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-form-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="catalog-form-title" className="text-xl font-bold">
                {editing ? 'Edit Service' : 'Add Service'}
              </h2>
              <button onClick={closeForm} aria-label="닫기">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <label className="block text-sm font-medium">
                Service Key
                <input
                  required
                  maxLength={80}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  disabled={!!editing}
                  value={form.serviceKey}
                  onChange={(e) =>
                    setForm({ ...form, serviceKey: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3 disabled:bg-slate-100"
                />
              </label>

              <label className="block text-sm font-medium">
                Name
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                />
              </label>

              <label className="block text-sm font-medium">
                Description
                <textarea
                  maxLength={500}
                  value={form.description || ''}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                />
              </label>

              <label className="block text-sm font-medium">
                Service Type
                <select
                  value={form.serviceType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      serviceType: e.target.value as ServiceType,
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                >
                  <option value="BACKEND">Backend</option>
                  <option value="FRONTEND">Frontend</option>
                  <option value="WORKER">Worker</option>
                </select>
              </label>

              <label className="block text-sm font-medium">
                Repository URL
                <input
                  type="url"
                  maxLength={500}
                  value={form.repositoryUrl || ''}
                  onChange={(e) =>
                    setForm({ ...form, repositoryUrl: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                />
              </label>

              <label className="block text-sm font-medium">
                Owner
                <input
                  maxLength={120}
                  value={form.owner || ''}
                  onChange={(e) =>
                    setForm({ ...form, owner: e.target.value })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3"
                />
              </label>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#FEE500] p-3 font-semibold disabled:opacity-50"
              >
                {busy ? 'Saving...' : editing ? 'Save Changes' : 'Create Service'}
              </button>

              {error && (
                <p role="alert" className="text-sm text-red-600">{error}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
