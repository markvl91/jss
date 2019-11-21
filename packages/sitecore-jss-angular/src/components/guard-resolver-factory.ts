import { Injector, Type } from '@angular/core';
import { ActivatedRoute, CanActivate, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { ComponentFactoryResult } from '../jss-component-factory.service';
import { wrapIntoObservable } from '../utils';

export function guardResolverFactory(
  injector: Injector,
  activatedRoute: ActivatedRoute,
  router: Router
) {
  function _getGuardInstance(guard: CanActivate | Type<CanActivate>) {
    return 'canActivate' in guard ? guard : injector.get(guard);
  }

  function _collectGuardInstances(factory: ComponentFactoryResult): CanActivate[] {
    if (factory.canActivate != null) {
      return Array.isArray(factory.canActivate)
        ? factory.canActivate.map(_getGuardInstance)
        : [_getGuardInstance(factory.canActivate)];
    }

    return [];
  }

  function _resolveGuard(guard: CanActivate) {
    const guardValue = guard.canActivate(activatedRoute.snapshot, router.routerState.snapshot);

    const canActivate$ = wrapIntoObservable(guardValue);

    return canActivate$.pipe(take(1)).toPromise();
  }

  return function resolveGuards(factories: ComponentFactoryResult[]) {
    const resolved = factories.map((factory) => {
      const guards = _collectGuardInstances(factory);
      const pending = guards.map(_resolveGuard);
      return Promise.all(pending)
        .then((canActive) => canActive.every((v) => v))
        .then((canActivate) => ({
          factory,
          canActivate,
        }));
    });

    return Promise.all(resolved).then((mapped) =>
      mapped.filter((m) => m.canActivate).map((m) => m.factory)
    );
  };
}
