"use client";

import React, { createContext, useContext } from 'react';
import NextLink from 'next/link';
import { 
  usePathname, 
  useRouter, 
  useSearchParams as useNextSearchParams,
  useParams as useNextParams
} from 'next/navigation';

// Context to detect if we are inside a react-router environment
export const InRouterContext = typeof React.createContext === 'function'
  ? React.createContext(false)
  : { Provider: ({ children }: any) => children } as any;

export const RouterDetectorProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <InRouterContext.Provider value={true}>
      {children}
    </InRouterContext.Provider>
  );
};

// Safe getter for react-router-dom to prevent server-side execution of its createContext
const getReactRouterDom = () => {
  if (typeof window !== 'undefined') {
    try {
      return require('../../node_modules/react-router-dom');
    } catch (e: any) {
      return null;
    }
  }
  return null;
};

const rrd = getReactRouterDom();

export const BrowserRouter = ({ children }: any) => {
  if (rrd?.BrowserRouter) {
    const OriginalBrowserRouter = rrd.BrowserRouter;
    return (
      <OriginalBrowserRouter>
        <RouterDetectorProvider>
          {children}
        </RouterDetectorProvider>
      </OriginalBrowserRouter>
    );
  }
  return <RouterDetectorProvider>{children}</RouterDetectorProvider>;
};

export const Routes = rrd?.Routes || (({ children }: any) => <>{children}</>);

export const Route = rrd?.Route || (({ children }: any) => null);

export const Outlet = rrd?.Outlet || (() => null);

// Shimmed Link component
export const Link = React.forwardRef(({ to, href, children, ...props }: any, ref: any) => {
  const inRouter = useContext(InRouterContext);
  const target = to || href || '';
  
  if (inRouter) {
    if (rrd?.Link) {
      const OriginalLink = rrd.Link;
      return <OriginalLink to={target} {...props} ref={ref}>{children}</OriginalLink>;
    }
  }
  
  return <NextLink href={target} {...props} ref={ref}>{children}</NextLink>;
});
Link.displayName = 'Link';

// Shimmed NavLink component
export const NavLink = React.forwardRef(({ to, href, className, children, ...props }: any, ref: any) => {
  const inRouter = useContext(InRouterContext);
  const target = to || href || '';
  
  if (inRouter) {
    if (rrd?.NavLink) {
      const OriginalNavLink = rrd.NavLink;
      return <OriginalNavLink to={target} className={className} {...props} ref={ref}>{children}</OriginalNavLink>;
    }
  }
  
  const pathname = usePathname();
  const isActive = pathname === target;
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
  
  return (
    <NextLink href={target} className={computedClassName} {...props} ref={ref}>
      {children}
    </NextLink>
  );
});
NavLink.displayName = 'NavLink';

// Shimmed hooks
export const useLocation = () => {
  const inRouter = useContext(InRouterContext);
  if (inRouter) {
    if (rrd?.useLocation) {
      return rrd.useLocation();
    }
  }
  const pathname = usePathname() || '/';
  return { pathname, search: '', hash: '', state: null, key: '' };
};

export const useNavigate = () => {
  const inRouter = useContext(InRouterContext);
  const router = useRouter();
  
  if (inRouter) {
    if (rrd?.useNavigate) {
      return rrd.useNavigate();
    }
  }
  
  return (to: any, options?: any) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
    } else {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    }
  };
};

export const useParams = () => {
  const inRouter = useContext(InRouterContext);
  if (inRouter) {
    if (rrd?.useParams) {
      return rrd.useParams();
    }
  }
  return useNextParams() || {};
};

export const useSearchParams = () => {
  const inRouter = useContext(InRouterContext);
  if (inRouter) {
    if (rrd?.useSearchParams) {
      return rrd.useSearchParams();
    }
  }
  
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = (nextParams: any) => {
    const params = new URLSearchParams(nextParams);
    router.push(`${pathname}?${params.toString()}`);
  };

  return [searchParams, setSearchParams] as const;
};
