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
      return require('react-router-dom');
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const BrowserRouter = ({ children }: any) => {
  const rrd = getReactRouterDom();
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

export const Routes = ({ children }: any) => {
  const rrd = getReactRouterDom();
  if (rrd?.Routes) {
    const OriginalRoutes = rrd.Routes;
    return <OriginalRoutes>{children}</OriginalRoutes>;
  }
  return <>{children}</>;
};

export const Route = ({ children, ...props }: any) => {
  const rrd = getReactRouterDom();
  if (rrd?.Route) {
    const OriginalRoute = rrd.Route;
    return <OriginalRoute {...props}>{children}</OriginalRoute>;
  }
  return null;
};

export const Outlet = (props: any) => {
  const rrd = getReactRouterDom();
  if (rrd?.Outlet) {
    const OriginalOutlet = rrd.Outlet;
    return <OriginalOutlet {...props} />;
  }
  return null;
};

// Shimmed Link component
export const Link = React.forwardRef(({ to, href, children, ...props }: any, ref: any) => {
  const inRouter = useContext(InRouterContext);
  const target = to || href || '';
  
  if (inRouter) {
    const rrd = getReactRouterDom();
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
    const rrd = getReactRouterDom();
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
    const rrd = getReactRouterDom();
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
    const rrd = getReactRouterDom();
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
    const rrd = getReactRouterDom();
    if (rrd?.useParams) {
      return rrd.useParams();
    }
  }
  return useNextParams() || {};
};

export const useSearchParams = () => {
  const inRouter = useContext(InRouterContext);
  if (inRouter) {
    const rrd = getReactRouterDom();
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
