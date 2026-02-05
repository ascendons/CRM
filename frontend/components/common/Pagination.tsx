"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalElements: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
}

export function Pagination({
    currentPage,
    totalPages,
    totalElements,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: PaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalElements);

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Information and Page Size */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-600">
                <p>
                    Showing <span className="font-semibold text-slate-900">{startItem}</span> to{" "}
                    <span className="font-semibold text-slate-900">{endItem}</span> of{" "}
                    <span className="font-semibold text-slate-900">{totalElements}</span> results
                </p>

                <div className="flex items-center gap-2">
                    <span>Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="px-2 py-1 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span>per page</span>
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors hidden sm:block"
                >
                    First
                </button>

                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    aria-label="Previous Page"
                >
                    <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>

                <span className="px-2 text-sm text-slate-900 font-medium">
                    Page {currentPage} of {totalPages}
                </span>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                    aria-label="Next Page"
                >
                    <ChevronRight className="h-5 w-5 text-slate-600" />
                </button>

                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors hidden sm:block"
                >
                    Last
                </button>
            </div>
        </div>
    );
}
