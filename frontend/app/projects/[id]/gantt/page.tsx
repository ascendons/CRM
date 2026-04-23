"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function GanttPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}`} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Gantt Chart</h1>
      </div>
      <p className="text-gray-500">
        View the Gantt chart on the{" "}
        <Link href={`/projects/${id}`} className="text-blue-600 hover:underline">
          project detail page
        </Link>{" "}
        under the Gantt tab.
      </p>
    </div>
  );
}
