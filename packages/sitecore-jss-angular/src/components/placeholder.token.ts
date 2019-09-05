import { InjectionToken, Type } from '@angular/core';
import { CanActivate, Data, LoadChildren, Resolve } from '@angular/router';
import { ComponentFactoryResult } from '../jss-component-factory.service';

/** Registers a statically loaded component */
export class ComponentNameAndType {
  name: string;
  type: Type<any>;

  canActivate?: CanActivate | Type<CanActivate> | Array<CanActivate | Type<CanActivate>>;
  resolve?: { [key: string]: Resolve<unknown> | Type<Resolve<unknown>> };
}

/** Registers a lazily loaded component by name and module to lazy load when it's needed */
export interface ComponentNameAndModule {
  /** Name of the component */
  path: string;
  /**
   * Module path that defines the component and export name,
   * e.g. ./path/to/lazyloadedcomponent.module#LazyLoadedComponentModuleExportName
   */
  loadChildren: LoadChildren;
  canActivate?: CanActivate | Type<CanActivate> | Array<CanActivate | Type<CanActivate>>;
  resolve?: { [key: string]: Resolve<unknown> | Type<Resolve<unknown>> };
}

export function instanceOfComponentNameAndType(object: any): object is ComponentNameAndType {
  return 'type' in object;
}

export function instanceOfComponentNameAndModule(object: any): object is ComponentNameAndModule {
  return 'module' in object;
}

export const PLACEHOLDER_COMPONENTS = new InjectionToken<ComponentNameAndType[]>(
  'Sc.placeholder.components'
);
export const PLACEHOLDER_LAZY_COMPONENTS = new InjectionToken<ComponentNameAndType[]>(
  'Sc.placeholder.lazyComponents'
);
export const PLACEHOLDER_MISSING_COMPONENT_COMPONENT = new InjectionToken<Type<any>>(
  'Sc.placeholder.missingComponentComponent'
);
export const DYNAMIC_COMPONENT = new InjectionToken<Type<any> | { [s: string]: any }>(
  'Sc.placeholder.dynamicComponent'
);

export type GuardResolver = (result: ComponentFactoryResult[]) => Promise<ComponentFactoryResult[]>;

export const GUARD_RESOLVER = new InjectionToken<GuardResolver>('Sc.placeholder.guardResolver');

export type DataResolver = (
  result: ComponentFactoryResult[]
) => Promise<Array<{ factory: ComponentFactoryResult; data: Data }>>;

export const DATA_RESOLVER = new InjectionToken<DataResolver>('Sc.placeholder.dataResolver');
