"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CustomPagination({ currentPage, totalPages, onPageChange }: CustomPaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <Button key={1} variant="outline" size="icon" onClick={() => onPageChange(1)} className="w-8 h-8">1</Button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(i)}
          className="w-8 h-8"
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
      }
      pages.push(
        <Button key={totalPages} variant="outline" size="icon" onClick={() => onPageChange(totalPages)} className="w-8 h-8">{totalPages}</Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {renderPageNumbers()}
      
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
