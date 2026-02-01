import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"a">;

const PaginationLink = ({
  className,
  isActive,
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size: "icon",
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

function range(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

export function TablePagination({
  page,
  totalPages,
  onPageChange,
  testId,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  testId?: string;
}) {
  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);

  const items = React.useMemo(() => {
    if (safeTotal <= 7) return range(1, safeTotal).map((p) => ({ type: "page" as const, p }));

    const pages = new Set<number>([1, safeTotal, safePage, safePage - 1, safePage + 1]);
    const clamped = Array.from(pages)
      .filter((p) => p >= 1 && p <= safeTotal)
      .sort((a, b) => a - b);

    const out: Array<{ type: "page"; p: number } | { type: "ellipsis"; key: string }> = [];

    let prev = 0;
    for (const p of clamped) {
      if (prev && p - prev > 1) out.push({ type: "ellipsis", key: `${prev}-${p}` });
      out.push({ type: "page", p });
      prev = p;
    }

    return out;
  }, [safePage, safeTotal]);

  return (
    <Pagination data-testid={testId ?? "pagination"}>
      <PaginationContent>
        <PaginationItem>
          <Button
            variant="ghost"
            className="h-9 px-3"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            data-testid="button-page-prev"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Prev
          </Button>
        </PaginationItem>

        {items.map((it) => {
          if (it.type === "ellipsis") {
            return (
              <PaginationItem key={it.key}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={it.p}>
              <PaginationLink
                href="#"
                isActive={it.p === safePage}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(it.p);
                }}
                data-testid={`button-page-${it.p}`}
              >
                {it.p}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <Button
            variant="ghost"
            className="h-9 px-3"
            onClick={() => onPageChange(Math.min(safeTotal, safePage + 1))}
            disabled={safePage === safeTotal}
            data-testid="button-page-next"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
