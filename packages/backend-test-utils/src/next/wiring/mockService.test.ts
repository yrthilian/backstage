/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createBackendPlugin,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { mockService } from './mockService';
import { startTestBackend } from './TestBackend';

interface FooService {
  foo(): string;
  bar(): number;
  baz(): void;
}

interface BarService {
  hey(): void;
}

const fooServiceRef = createServiceRef<FooService>({
  id: 'foo',
  scope: 'root',
});

const barServiceRef = createServiceRef<BarService>({
  id: 'bar',
  scope: 'plugin',
});

describe('mockService', () => {
  it('supports an empty implementation', () => {
    const { mock, impl } = mockService(fooServiceRef, {});

    // @ts-expect-error
    expect(mock.foo).toBeUndefined();
    // @ts-expect-error
    expect(mock.bar).toBeUndefined();
    // @ts-expect-error
    expect(mock.baz).toBeUndefined();

    expect(impl.foo).toBeUndefined();
    expect(impl.bar).toBeUndefined();
    expect(impl.baz).toBeUndefined();
  });

  it('supports a partial implementation', () => {
    const { mock, impl } = mockService(fooServiceRef, {
      foo: jest.fn(),
      bar: () => 2,
    });

    expect(mock.foo).toBeDefined();
    expect(mock.bar).toBeDefined();
    // @ts-expect-error
    expect(mock.baz).toBeUndefined();

    expect(impl.foo).toBeDefined();
    expect(impl.bar).toBeDefined();
    expect(impl.baz).toBeUndefined();

    mock.foo.mockReturnValue('hello');
    // @ts-expect-error
    expect(mock.bar.mockReturnValue).toBeUndefined();

    expect(mock.foo()).toBe('hello');
    expect(mock.bar()).toBe(2);
    expect(impl.foo()).toBe('hello');
    expect(impl.bar()).toBe(2);
  });

  it('rejects unknown mock properties', () => {
    mockService(fooServiceRef, {
      // @ts-expect-error
      unknown: jest.fn(),
    });

    expect.anything();
  });

  it('makes implementations and full mocks that can be passed to functions, but not partial mocks', () => {
    const { mock: fullMock, impl: fullImpl } = mockService(fooServiceRef, {
      foo: jest.fn(),
      bar: jest.fn(),
      baz: jest.fn(),
    });
    const { mock: partialMock, impl: partialImpl } = mockService(
      fooServiceRef,
      {
        foo: jest.fn(),
        bar: jest.fn(),
      },
    );

    function f(_a: FooService) {}

    f(fullMock);
    f(fullImpl);
    // @ts-expect-error
    f(partialMock);
    f(partialImpl);

    expect.anything();
  });

  it('creates factories that can be passed to startTestBackend for both root and plugin scopes', async () => {
    const { mock: fooMock, factory: fooFactory } = mockService(fooServiceRef, {
      foo: jest.fn(),
      bar: jest.fn(),
    });

    const { mock: barMock, factory: barFactory } = mockService(barServiceRef, {
      hey: jest.fn(),
    });

    const tester = createBackendPlugin({
      id: 'test',
      register(env) {
        env.registerInit({
          deps: { foo: fooServiceRef, bar: barServiceRef },
          async init({ foo, bar }) {
            foo.bar();
            bar.hey();
          },
        });
      },
    });

    await startTestBackend({
      services: [fooFactory, barFactory],
      features: [tester()],
    });

    expect(fooMock.bar).toHaveBeenCalledTimes(1);
    expect(barMock.hey).toHaveBeenCalledTimes(1);
  });
});
