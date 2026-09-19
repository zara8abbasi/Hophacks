import { cn } from "@/lib/utils";
import {
  pageCardClass,
  pageCardPaddingClass,
  pageLeadClass,
  pageTitleClass,
} from "@/lib/hophacks-ui";

type PageCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageCard({ children, className }: PageCardProps) {
  return (
    <div className={cn(pageCardClass, pageCardPaddingClass, className)}>
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={className}>
      <h1 className={pageTitleClass}>{title}</h1>
      {description ? (
        <p className={pageLeadClass}>{description}</p>
      ) : null}
    </header>
  );
}

type LoadingCardProps = {
  message: string;
};

export function LoadingCard({ message }: LoadingCardProps) {
  return (
    <PageCard>
      <p className="text-sm text-black/65" aria-live="polite">
        {message}
      </p>
    </PageCard>
  );
}
