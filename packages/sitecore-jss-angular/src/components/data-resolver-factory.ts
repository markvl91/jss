import { Injector, Type } from '@angular/core';
import { ActivatedRoute, Resolve, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ComponentFactoryResult } from '../jss-component-factory.service';
import { wrapIntoObservable } from '../utils';

export function dataResolverFactory(
  injector: Injector,
  activatedRoute: ActivatedRoute,
  router: Router
) {
  function _getResolverInstance(resolver: Resolve<unknown> | Type<Resolve<unknown>>) {
    return 'resolve' in resolver ? resolver : injector.get(resolver);
  }

  function _collectResolverInstances(
    factory: ComponentFactoryResult
  ): Array<[string, Resolve<unknown>]> {
    if (factory.resolve != null) {
      const resolve = factory.resolve;
      return Object.keys(factory.resolve).map((key) => [key, _getResolverInstance(resolve[key])]);
    }

    return [];
  }

  function _resolveData(resolver: Resolve<unknown>) {
    const data = resolver.resolve(activatedRoute.snapshot, router.routerState.snapshot);
    const data$ = wrapIntoObservable(data);

    return data$.pipe(take(1)).toPromise();
  }

  return function resolveData(factories: ComponentFactoryResult[]) {
    return Promise.all(
      factories.map((factory) => {
        const resolvers = _collectResolverInstances(factory);
        const pendingData = resolvers.map(([key, resolver]) =>
          _resolveData(resolver).then((data): [string, unknown] => [key, data])
        );

        return Promise.all(pendingData)
          .then((allData) =>
            allData.reduce<Record<string, unknown>>((acc, [key, data]) => {
              acc[key] = data;
              return acc;
            }, {})
          )
          .then((data) => ({ factory, data }));
      })
    );
  };
}
