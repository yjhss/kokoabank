import { useQuery } from '@tanstack/react-query';
import { Activity, Boxes, Database, Rocket } from 'lucide-react';
import FadeIn from '../components/motion/FadeIn';
import { catalogApi } from '../features/catalog/api';

export default function OverviewPage() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['services'],
    queryFn: catalogApi.list,
  });

  const stats = [
    { label: 'Registered Services', value: data.length, icon: Boxes },
    {
      label: 'Backend Services',
      value: data.filter((s) => s.serviceType === 'BACKEND').length,
      icon: Database,
    },
  ];

  return (
    <div className="space-y-7">
      <FadeIn>
        <p className="mb-2 text-sm font-medium text-slate-500">
          KokoaBank / Overview
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-2 text-slate-500">
          금융서비스 개발·배포·운영을 위한 플랫폼입니다.
        </p>
      </FadeIn>

      {isError && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          서비스 정보를 불러오지 못했습니다. 백엔드 연결을 확인하세요.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }, index) => (
          <FadeIn key={label} delay={index * 0.06}>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <Icon size={20} className="text-slate-500" />
              <p className="mt-5 text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold">
                {isLoading ? '...' : value}
              </p>
            </div>
          </FadeIn>
        ))}

        <FadeIn delay={0.12}>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">
            <Rocket size={20} className="text-slate-400" />
            <p className="mt-5 text-sm text-slate-500">Deployments</p>
            <p className="mt-2 text-sm font-semibold">연동 예정</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.18}>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6">
            <Activity size={20} className="text-slate-400" />
            <p className="mt-5 text-sm text-slate-500">Observability</p>
            <p className="mt-2 text-sm font-semibold">연동 예정</p>
          </div>
        </FadeIn>
      </div>

      <FadeIn delay={0.2}>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Registered Services</h2>
          <p className="mt-1 text-sm text-slate-500">
            PostgreSQL Service Catalog에서 조회한 목록입니다.
          </p>

          <div className="mt-5 space-y-3">
            {data.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
              >
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-slate-500">
                    {service.serviceKey}
                  </p>
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs">
                  {service.serviceType}
                </span>
              </div>
            ))}
            {!isLoading && data.length === 0 && (
              <p className="text-sm text-slate-500">
                아직 등록된 서비스가 없습니다.
              </p>
            )}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
