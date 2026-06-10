import NextLink from 'next/link';

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: React.ReactNode;
}

export const Link = ({ to, children, ...props }: LinkProps) => {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
};
