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
  function _getResolverInstance(resolver: Resolve<any> | Type<Resolve<any>>) {
    return 'resolve' in resolver ? resolver : injector.get(resolver);
  }

  function _collectResolverInstances(
    factory: ComponentFactoryResult
  ): Array<[string, Resolve<any>]> {
    if (factory.resolve != null) {
      const resolve = factory.resolve;
      return Object.keys(factory.resolve).map(
        (key): [string, Resolve<any>] => [key, _getResolverInstance(resolve[key])]
      );
    }

    return [];
  }

  function _resolveData(resolver: Resolve<any>) {
    const data = resolver.resolve(activatedRoute.snapshot, router.routerState.snapshot);
    const data$ = wrapIntoObservable(data);

    return data$.pipe(take(1)).toPromise();
  }

  return function resolveData(factories: ComponentFactoryResult[]) {
    return Promise.all(
      factories.map((factory) => {
        const resolvers = _collectResolverInstances(factory);
        const pendingData = resolvers.map(([key, resolver]) =>
          _resolveData(resolver).then((data): [string, any] => [key, data])
        );

        return Promise.all(pendingData)
          .then((allData) =>
            allData.reduce<Record<string, any>>((acc, [key, data]) => {
              acc[key] = data;
              return acc;
            }, {})
          )
          .then((data) => ({ factory, data }));
      })
    );
  };
}
