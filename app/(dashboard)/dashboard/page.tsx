import { Suspense } from "react";
import UsersCount from "@/components/dashboard/UsersCount";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardChartsLoader from "@/components/dashboard/DashboardChartsLoader";
import PaymentLogsLoader from "@/components/payment_logs/PaymentLogsLoader";
import PostHogInsightsLoader from "@/components/dashboard/PostHogInsightsLoader";
import { CoursesUsersServer } from "@/components/admin/CoursesUsersServer";

function StatSkeleton() {
  return (
    <div className="border border-neutral-800/50 rounded-xl p-4 animate-pulse">
      <div className="h-3 w-12 bg-neutral-800 rounded mb-3" />
      <div className="h-7 w-20 bg-neutral-800 rounded" />
    </div>
  );
}

function CardSkeleton({ h = "h-[260px]" }: { h?: string }) {
  return (
    <div className="border border-neutral-800/50 rounded-xl p-5 animate-pulse">
      <div className="h-3 w-24 bg-neutral-800 rounded mb-5" />
      <div className={`${h} bg-neutral-800/20 rounded-lg`} />
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen px-5 sm:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Dashboard <span className="text-red-400">.</span></h1>
        <p className="text-xs text-neutral-500 mt-1">
          Resumen de tu plataforma
        </p>
      </div>

      {/* Stats */}
      {/* 5 tiles: users, courses, ARS revenue, USD revenue, sales count. */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        <Suspense fallback={<StatSkeleton />}>
          <UsersCount />
        </Suspense>
        <Suspense
          fallback={
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </>
          }
        >
          <DashboardStats />
        </Suspense>
      </div>

      {/* Charts */}
      <div className="mb-6">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <CardSkeleton h="h-[200px]" />
              <CardSkeleton h="h-[200px]" />
            </div>
          }
        >
          <DashboardChartsLoader />
        </Suspense>
      </div>

      {/* Behaviour, from PostHog. Streams separately: the Query API is a real
          analytical query and shouldn't hold up the revenue panels above. */}
      <div className="mb-6">
        <Suspense
          fallback={
            <>
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <CardSkeleton h="h-[200px]" />
                </div>
                <CardSkeleton h="h-[200px]" />
              </div>
            </>
          }
        >
          <PostHogInsightsLoader />
        </Suspense>
      </div>

      {/* Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="border border-neutral-800/50 rounded-xl p-5">
          <h2 className="text-xs font-medium text-neutral-400 mb-4">
            Asignar Curso
          </h2>
          <CoursesUsersServer />
        </div>
        <Suspense fallback={<CardSkeleton h="h-[300px]" />}>
          <PaymentLogsLoader />
        </Suspense>
      </div>
    </div>
  );
}
