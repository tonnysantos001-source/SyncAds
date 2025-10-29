// ============================================
// LAZY LOAD COMPONENT WITH PRELOADING
// ============================================
// Componente otimizado para lazy loading com:
// - Preloading de rotas críticas
// - Fallback customizável
// - Error boundaries
// ============================================

import { Suspense, ComponentType, lazy, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyLoad({ children, fallback }: LazyLoadProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// ===== PRELOADER =====

interface PreloadableComponent<T = any> extends ComponentType<T> {
  preload?: () => Promise<{ default: ComponentType<T> }>;
}

const preloadedRoutes = new Set<string>();

export function preloadRoute(route: string, component: PreloadableComponent) {
  if (preloadedRoutes.has(route)) {
    return; // Já foi preloaded
  }

  if (component.preload) {
    component.preload().then(() => {
      preloadedRoutes.add(route);
      console.log(`✅ Preloaded: ${route}`);
    });
  }
}

// ===== LAZY LOAD WITH PRELOAD =====

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): PreloadableComponent<React.ComponentProps<T>> {
  const Component = lazy(factory) as PreloadableComponent<React.ComponentProps<T>>;
  Component.preload = factory;
  return Component;
}

// ===== PRELOAD ON HOVER =====

interface PreloadOnHoverProps {
  route: string;
  component: PreloadableComponent;
  children: React.ReactNode;
}

export function PreloadOnHover({ route, component, children }: PreloadOnHoverProps) {
  const handleMouseEnter = () => {
    preloadRoute(route, component);
  };

  return <div onMouseEnter={handleMouseEnter}>{children}</div>;
}

// ===== PRELOAD ON MOUNT =====

interface PreloadOnMountProps {
  routes: Array<{ path: string; component: PreloadableComponent }>;
  delay?: number;
}

export function PreloadOnMount({ routes, delay = 1000 }: PreloadOnMountProps) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      routes.forEach(({ path, component }) => {
        preloadRoute(path, component);
      });
    }, delay);

    return () => clearTimeout(timeout);
  }, [routes, delay]);

  return null;
}

