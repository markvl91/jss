import { Injector } from '@angular/core';
import { async, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, CanActivate } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { guardResolverFactory } from './guard-resolver-factory';
import { GuardResolver, GUARD_RESOLVER } from './placeholder.token';
import { Observable, of } from 'rxjs';

const createLiteralGuard = (
  canActivate: boolean | Promise<boolean> | Observable<boolean>
): CanActivate => ({
  canActivate() {
    return canActivate;
  },
});

class MockSyncTrueGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

class MockSyncFalseGuard implements CanActivate {
  canActivate() {
    return false;
  }
}

class MockAsyncTrueGuard implements CanActivate {
  canActivate() {
    return Promise.resolve(true);
  }
}

class MockAsyncFalseGuard implements CanActivate {
  canActivate() {
    return of(false);
  }
}

describe('guardResolverFactory', () => {
  let resolver: GuardResolver;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        MockSyncTrueGuard,
        MockSyncFalseGuard,
        MockAsyncTrueGuard,
        MockAsyncFalseGuard,
        {
          provide: GUARD_RESOLVER,
          useFactory: guardResolverFactory,
          deps: [Injector, ActivatedRoute, Router],
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    resolver = TestBed.get(GUARD_RESOLVER);
  });

  it('Returns rendering if single sync guard returns true', async () => {
    const nonGuarded = await resolver([
      {
        canActivate: createLiteralGuard(true),
        componentDefinition: {} as any,
      },
    ]);

    expect(nonGuarded.length).toBe(1);
  });

  it('Returns rendering if single async guard returns true', async () => {
    const nonGuarded = await resolver([
      {
        canActivate: MockAsyncTrueGuard,
        componentDefinition: {} as any,
      },
    ]);

    expect(nonGuarded.length).toBe(1);
  });

  it('Blocks rendering if single async guard returns false', async () => {
    const nonGuarded = await resolver([
      {
        canActivate: MockAsyncFalseGuard,
        componentDefinition: {} as any,
      },
    ]);

    expect(nonGuarded.length).toBe(0);
  });

  it('Returns rendering if multiple guards all return true', async () => {
    const nonGuarded = await resolver([
      {
        canActivate: [MockAsyncTrueGuard, createLiteralGuard(true), MockSyncTrueGuard],
        componentDefinition: {} as any,
      },
    ]);

    expect(nonGuarded.length).toBe(1);
  });

  it('Does not return rendering if one guard returns false', async () => {
    const nonGuarded = await resolver([
      {
        canActivate: [MockAsyncTrueGuard, createLiteralGuard(false), MockSyncTrueGuard],
        componentDefinition: {} as any,
      },
    ]);

    expect(nonGuarded.length).toBe(0);
  });

  it('Only returns renderings of which all guards return true', async () => {
    const compFactoryResults = [
      {
        canActivate: [MockAsyncTrueGuard, createLiteralGuard(false), MockSyncTrueGuard],
        componentDefinition: 'Rendering 1' as any,
      },
      {
        canActivate: [MockAsyncTrueGuard, createLiteralGuard(true), MockSyncTrueGuard],
        componentDefinition: 'Rendering 2' as any,
      },
      {
        canActivate: [MockAsyncTrueGuard, createLiteralGuard(true), MockSyncFalseGuard],
        componentDefinition: 'Rendering 3' as any,
      },
      {
        canActivate: [MockAsyncFalseGuard, createLiteralGuard(true), MockSyncTrueGuard],
        componentDefinition: 'Rendering 4' as any,
      },
    ];

    const nonGuarded = await resolver(compFactoryResults);

    expect(nonGuarded.length).toBe(1);
    expect(nonGuarded[0]).toBe(compFactoryResults[1]);
  });
});
