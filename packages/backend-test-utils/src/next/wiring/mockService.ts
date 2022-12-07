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
  ServiceFactory,
  ServiceRef,
  createServiceFactory,
} from '@backstage/backend-plugin-api';

// export type MockedApi<TApi, TImpl> = {
//   [K in keyof TImpl]: TApi[K] extends jest.Mock<TApi[K]> ?  (...args: infer TArgs) => infer TReturn;
// };

/**
 * Simplifies the creation of a mock of a service API.
 *
 * @public
 */
export function mockService<TApi, TImpl extends Partial<TImpl>>(
  apiRef: ServiceRef<TApi>,
  api: TImpl,
): {
  mock: TImpl;
  impl: TApi;
  factory: ServiceFactory<TApi>;
} {
  const apiCast = api as unknown as TApi;

  const factory = createServiceFactory({
    service: apiRef,
    deps: {},
    factory: async (): Promise<any> => {
      return apiRef.scope === 'plugin' ? async () => apiCast : apiCast;
    },
  });

  return {
    mock: api,
    impl: apiCast,
    factory: factory(),
  };
}
